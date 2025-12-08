/**
 * Centralized Type Definitions
 * 
 * This file contains all the domain types used throughout the application.
 * Having types in one place improves maintainability and prevents duplication.
 */

/**
 * Represents a time slot in the weekly schedule
 */
export interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
}

/**
 * Represents an assessment/exam for a module
 */
export interface Assessment {
  id: string;
  type: string;
  weight: number;
  format: string;
  deadline: string;
}

/**
 * Represents a study module
 */
export interface Module {
  id: string;
  name: string;
  ects: number;
  workload: number;
  examDate: string;
  assessments: Assessment[];
  pdfName?: string;
  extractedContent?: string;
  content?: string[];
  competencies?: string[];
}

/**
 * Represents a study session in the generated plan
 */
export interface StudySession {
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
 * Props interface for step components
 */
export interface StepComponentProps {
  onNext: () => void;
  onBack: () => void;
  modules: Module[];
  setModules: (modules: Module[]) => void;
  timeSlots: TimeSlot[];
  setTimeSlots: (slots: TimeSlot[]) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
}

/**
 * Extracted module data from AI processing
 */
export interface ExtractedModuleData {
  title: string;
  ects: number;
  workload: number;
  assessments: {
    type: string;
    weight: number;
    format: string;
    deadline?: string;
  }[];
  content?: string[];
  competencies?: string[];
}

/**
 * Learning method type definition
 */
export type LearningMethodType = 
  | 'Spaced Repetition'
  | 'Active Recall'
  | 'Deep Work'
  | 'Pomodoro'
  | 'Feynman Technik'
  | 'Interleaving'
  | 'Practice Testing';

/**
 * Learning method information
 */
export interface LearningMethod {
  title: string;
  description: string;
  tips: string[];
}
