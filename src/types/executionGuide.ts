/**
 * Execution Guide data structures for week elaboration feature
 */

export interface AgendaItem {
  phase: string; // e.g., "Warm-up", "Core Work", "Consolidation"
  duration: number; // in minutes
  description: string;
}

export interface ExecutionGuide {
  sessionId: string;
  sessionGoal: string; // Why this session is important
  agenda: AgendaItem[]; // Didactic flow with time breakdown
  methodIdeas: string[]; // 2-4 concrete approaches
  tools: string[]; // Specific tools or materials (optional)
  deliverable: string; // One clear output
  readyCheck: string; // Success criteria
  generatedAt: string; // ISO timestamp
}

export interface WeekElaborationRequest {
  week: {
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
  };
  sessions: {
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
  }[];
  moduleData: {
    name: string;
    content?: string[];
    competencies?: string[];
    teachingMethods?: string[];
    assessments?: {
      type: string;
      weight: number;
      format?: string;
      tools?: string[];
    }[];
  }[];
}

export interface WeekElaborationResponse {
  executionGuides: ExecutionGuide[];
  summary: {
    totalSessions: number;
    weekStartDate: string;
    weekEndDate: string;
  };
}
