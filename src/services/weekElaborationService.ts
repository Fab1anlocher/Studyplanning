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
  WEEK_ELABORATION_PROMPT 
} from '../prompts/weekElaborationPrompt';

/**
 * Session interface matching the StudySession type from StudyPlanGenerator
 */
export interface Session {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  module: string;
  topic: string;
  description: string;
  learningMethod?: string;
  contentTopics?: string[];
  competencies?: string[];
  studyTips?: string;
}

/**
 * Validates an execution guide structure
 */
function validateExecutionGuide(guide: any): guide is ExecutionGuide {
  // Verify essential fields
  if (!guide.sessionId) {
    console.warn('Missing sessionId', guide);
    return false;
  }
  if (typeof guide.sessionId !== 'string' && typeof guide.sessionId !== 'number') {
    console.warn('sessionId is not string/number:', guide.sessionId);
    return false;
  }
  
  if (!guide.sessionGoal || typeof guide.sessionGoal !== 'string') {
    console.warn('Missing or invalid sessionGoal', guide);
    return false;
  }
  
  if (!Array.isArray(guide.agenda) || guide.agenda.length === 0) {
    console.warn('Missing or empty agenda', guide);
    return false;
  }
  
  if (!Array.isArray(guide.methodIdeas)) {
    console.warn('Missing methodIdeas array', guide);
    return false;
  }
  
  if (!Array.isArray(guide.tools)) {
    console.warn('Missing tools array', guide);
    return false;
  }
  
  if (!guide.deliverable || typeof guide.deliverable !== 'string') {
    console.warn('Missing or invalid deliverable', guide);
    return false;
  }
  
  if (!guide.readyCheck || typeof guide.readyCheck !== 'string') {
    console.warn('Missing or invalid readyCheck', guide);
    return false;
  }
  
  // Validate agenda items more leniently
  for (const item of guide.agenda) {
    if (!item.phase || typeof item.phase !== 'string') {
      console.warn('Invalid agenda phase:', item);
      return false;
    }
    // Duration can be number or string representation of number
    const duration = typeof item.duration === 'number' 
      ? item.duration 
      : typeof item.duration === 'string' 
        ? parseInt(item.duration, 10)
        : NaN;
    
    if (isNaN(duration) || duration <= 0) {
      console.warn('Invalid agenda duration:', item.duration);
      return false;
    }
    
    if (!item.description || typeof item.description !== 'string') {
      console.warn('Invalid agenda description:', item);
      return false;
    }
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
  
  // Prepare unified prompt with all variable replacements
  const sessionsJson = JSON.stringify(request.sessions, null, 2);
  const moduleDataJson = JSON.stringify(request.moduleData, null, 2);
  
  const unifiedPrompt = WEEK_ELABORATION_PROMPT
    .replace(/{weekStart}/g, request.week.startDate)
    .replace(/{weekEnd}/g, request.week.endDate)
    .replace(/{sessionsJson}/g, sessionsJson)
    .replace(/{moduleDataJson}/g, moduleDataJson);
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'user', content: unifiedPrompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
      max_tokens: 16000
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Keine Antwort von der KI erhalten');
    }
    
    // Parse and validate response
    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(content);
    } catch (parseError) {
      console.error('[WeekElaboration] JSON Parse Error:', parseError);
      console.error('[WeekElaboration] Response content:', content.substring(0, 500));
      throw new Error(`JSON Parse Error: ${parseError instanceof Error ? parseError.message : 'Unbekannter Fehler'}`);
    }
    
    if (!parsedResponse.executionGuides || !Array.isArray(parsedResponse.executionGuides)) {
      console.error('[WeekElaboration] Invalid response structure:', parsedResponse);
      throw new Error('Ungültige Antwort: executionGuides fehlt oder ist kein Array');
    }
    
    console.log(`[WeekElaboration] Received ${parsedResponse.executionGuides.length} guides from AI`);
    
    // Validate each execution guide
    const validatedGuides: ExecutionGuide[] = [];
    const now = new Date().toISOString();
    
    for (let idx = 0; idx < parsedResponse.executionGuides.length; idx++) {
      const guide = parsedResponse.executionGuides[idx];
      if (!validateExecutionGuide(guide)) {
        console.warn(`[WeekElaboration] Guide ${idx + 1} ungültig, Details:`, JSON.stringify(guide).substring(0, 200));
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
        sessionId: String(guide.sessionId),
        generatedAt: now
      });
    }
    
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
  allSessions: Session[],
  weekStartDate: Date
): Session[] {
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
