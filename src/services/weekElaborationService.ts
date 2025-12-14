/**
 * Week Elaboration Service - Generates execution guides for all sessions in a week
 */

import OpenAI from 'openai';
import { 
  ExecutionGuide, 
  WeekElaborationRequest, 
  WeekElaborationResponse,
  AgendaItem
} from '../types/executionGuide';
import { 
  WEEK_ELABORATION_SYSTEM_PROMPT, 
  WEEK_ELABORATION_USER_PROMPT 
} from '../prompts/weekElaborationPrompt';

/**
 * Validates an execution guide structure
 */
function validateExecutionGuide(guide: any): guide is ExecutionGuide {
  if (!guide.sessionId || typeof guide.sessionId !== 'string') return false;
  if (!guide.sessionGoal || typeof guide.sessionGoal !== 'string') return false;
  if (!Array.isArray(guide.agenda)) return false;
  if (!Array.isArray(guide.methodIdeas)) return false;
  if (!Array.isArray(guide.tools)) return false;
  if (!guide.deliverable || typeof guide.deliverable !== 'string') return false;
  if (!guide.readyCheck || typeof guide.readyCheck !== 'string') return false;
  
  // Validate agenda items
  for (const item of guide.agenda) {
    if (!item.phase || typeof item.phase !== 'string') return false;
    if (typeof item.duration !== 'number') return false;
    if (!item.description || typeof item.description !== 'string') return false;
  }
  
  return true;
}

/**
 * Calculate session duration in minutes
 */
function calculateSessionDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  return (endHour * 60 + endMin) - (startHour * 60 + startMin);
}

/**
 * Generate execution guides for a week using LLM
 */
export async function generateWeekElaboration(
  request: WeekElaborationRequest,
  apiKey: string
): Promise<WeekElaborationResponse> {
  console.log('[WeekElaboration] Generating execution guides for week:', request.week);
  console.log('[WeekElaboration] Sessions count:', request.sessions.length);
  
  // Validate input
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('API-Key fehlt');
  }
  
  if (!request.sessions || request.sessions.length === 0) {
    throw new Error('Keine Sessions für diese Woche gefunden');
  }
  
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });
  
  // Prepare user prompt
  const sessionsJson = JSON.stringify(request.sessions, null, 2);
  const moduleDataJson = JSON.stringify(request.moduleData, null, 2);
  
  const userPrompt = WEEK_ELABORATION_USER_PROMPT
    .replace('{weekStart}', request.week.startDate)
    .replace('{weekEnd}', request.week.endDate)
    .replace('{sessionsJson}', sessionsJson)
    .replace('{moduleDataJson}', moduleDataJson);
  
  console.log('[WeekElaboration] Sending request to LLM...');
  
  try {
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: WEEK_ELABORATION_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
      max_tokens: 8000
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Keine Antwort von der KI erhalten');
    }
    
    console.log('[WeekElaboration] Received response from LLM');
    
    // Parse and validate response
    const parsedResponse = JSON.parse(content);
    
    if (!parsedResponse.executionGuides || !Array.isArray(parsedResponse.executionGuides)) {
      throw new Error('Ungültige Antwort: executionGuides fehlt oder ist kein Array');
    }
    
    // Validate each execution guide
    const validatedGuides: ExecutionGuide[] = [];
    const now = new Date().toISOString();
    
    for (const guide of parsedResponse.executionGuides) {
      if (!validateExecutionGuide(guide)) {
        console.warn('[WeekElaboration] Ungültiger Execution Guide übersprungen:', guide);
        continue;
      }
      
      // Find corresponding session for duration validation
      const session = request.sessions.find(s => s.id === guide.sessionId);
      if (session) {
        const expectedDuration = calculateSessionDuration(session.startTime, session.endTime);
        const actualDuration = guide.agenda.reduce((sum, item) => sum + item.duration, 0);
        
        // Allow 5 minute tolerance
        if (Math.abs(expectedDuration - actualDuration) > 5) {
          console.warn(
            `[WeekElaboration] Agenda-Dauer passt nicht zur Session-Dauer für Session ${guide.sessionId}:`,
            `Erwartet: ${expectedDuration} min, Ist: ${actualDuration} min`
          );
          // Don't skip, just warn - the guide might still be useful
        }
      }
      
      validatedGuides.push({
        ...guide,
        generatedAt: now
      });
    }
    
    console.log(`[WeekElaboration] Validated ${validatedGuides.length}/${parsedResponse.executionGuides.length} guides`);
    
    if (validatedGuides.length === 0) {
      throw new Error('Keine gültigen Execution Guides generiert');
    }
    
    return {
      executionGuides: validatedGuides,
      summary: {
        totalSessions: validatedGuides.length,
        weekStartDate: request.week.startDate,
        weekEndDate: request.week.endDate
      }
    };
    
  } catch (error) {
    console.error('[WeekElaboration] Error generating execution guides:', error);
    throw error;
  }
}

/**
 * Get sessions for a specific week
 */
export function getSessionsForWeek(
  allSessions: any[],
  weekStartDate: Date
): any[] {
  const weekStart = new Date(weekStartDate);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  
  return allSessions.filter(session => {
    const sessionDate = new Date(session.date);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate >= weekStart && sessionDate < weekEnd;
  });
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}
