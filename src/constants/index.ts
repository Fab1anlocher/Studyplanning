/**
 * Application Constants
 * 
 * Centralized configuration and constants for the application.
 * This improves maintainability and makes it easier to update values.
 */

import { LearningMethod } from '../types';

// ==================== PDF Processing Constants ====================

export const PDF_VALIDATION = {
  MAX_FILE_SIZE_MB: 50,
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024,
  MAX_PAGES: 200,
  MAGIC_NUMBER: '%PDF-',
  MIN_TEXT_LENGTH: 100,
} as const;

// ==================== Module Validation Constants ====================

export const MODULE_VALIDATION = {
  ECTS_MIN: 1,
  ECTS_MAX: 30,
  ECTS_DEFAULT: 6,
  WORKLOAD_MIN: 30,
  WORKLOAD_MAX: 900,
  WORKLOAD_PER_ECTS: 30,
  ASSESSMENT_WEIGHT_TOLERANCE: 0.1,
  CONTENT_MIN: 4,
  CONTENT_MAX: 6,
  COMPETENCIES_MIN: 3,
  COMPETENCIES_MAX: 5,
} as const;

// ==================== Study Planning Constants ====================

export const STUDY_PLANNING = {
  MAX_DAILY_STUDY_MINUTES: 8 * 60,
  MAX_CONSECUTIVE_STUDY_DAYS: 6,
  EXAM_REVIEW_PERIOD_DAYS: 14,
  TIME_FORMAT_REGEX: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
} as const;

// ==================== Calendar Constants ====================

export const CALENDAR = {
  WEEK_DAYS: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const,
  DEFAULT_MONTH: '2024-12-01',
} as const;

// ==================== AI Configuration ====================

export const AI_CONFIG = {
  MODEL: 'gpt-4o',
  TEMPERATURE: 0.1,
  MAX_TOKENS: 1000,
  MAX_TEXT_LENGTH: 12000,
} as const;

// ==================== Learning Methods ====================

export const LEARNING_METHODS: Record<string, LearningMethod> = {
  'Deep Work': {
    title: 'Deep Work',
    description: 'Konzentrierte, ablenkungsfreie Arbeit an kognitiv anspruchsvollen Aufgaben. Optimal für komplexe Projekte und kreative Arbeit.',
    tips: [
      'Schalte alle Benachrichtigungen aus',
      'Plane mindestens 2-4 Stunden ein',
      'Arbeite in einem ruhigen Umfeld',
      'Mache nur alle 90 Minuten eine Pause'
    ]
  },
  'Pomodoro': {
    title: 'Pomodoro-Technik',
    description: 'Arbeite in 25-Minuten-Intervallen mit 5-Minuten-Pausen. Nach 4 Pomodoros eine längere Pause (15-30 Min).',
    tips: [
      '25 Minuten fokussierte Arbeit',
      '5 Minuten Pause (aufstehen, bewegen)',
      'Nach 4 Zyklen: 15-30 Min Pause',
      'Ideal für Programmierung und Übungen'
    ]
  },
  'Spaced Repetition': {
    title: 'Spaced Repetition',
    description: 'Wiederhole Lernstoff in zunehmend größeren Abständen für optimales Langzeitgedächtnis.',
    tips: [
      'Erste Wiederholung: nach 1 Tag',
      'Zweite Wiederholung: nach 3 Tagen',
      'Dritte Wiederholung: nach 7 Tagen',
      'Nutze Karteikarten oder Apps wie Anki'
    ]
  },
  'Active Recall': {
    title: 'Active Recall',
    description: 'Aktives Abrufen von Wissen ohne Hilfsmittel. Teste dich selbst statt passiv zu lesen.',
    tips: [
      'Schließe Bücher und Notizen',
      'Schreibe alles auf, was du weißt',
      'Vergleiche mit dem Original',
      'Konzentriere dich auf Lücken'
    ]
  },
  'Feynman Technik': {
    title: 'Feynman-Technik',
    description: 'Erkläre ein Konzept in einfachen Worten, als würdest du es einem Kind beibringen.',
    tips: [
      'Wähle ein Konzept',
      'Erkläre es in einfachen Worten',
      'Identifiziere Wissenslücken',
      'Vereinfache und verwende Analogien'
    ]
  },
  'Interleaving': {
    title: 'Interleaving',
    description: 'Wechsle zwischen verschiedenen Themen/Modulen statt alles auf einmal zu lernen.',
    tips: [
      'Mische verschiedene Themen',
      'Verbessert Problemlösungsfähigkeit',
      'Verhindert Langeweile',
      'Fördert Transfer von Wissen'
    ]
  },
  'Practice Testing': {
    title: 'Practice Testing',
    description: 'Übe mit echten oder simulierten Prüfungen. Die beste Vorbereitung auf Prüfungen.',
    tips: [
      'Nutze alte Prüfungen',
      'Simuliere Prüfungsbedingungen',
      'Zeitlimit einhalten',
      'Analysiere Fehler gründlich'
    ]
  }
} as const;

export const ALLOWED_LEARNING_METHODS = [
  'Spaced Repetition',
  'Active Recall', 
  'Deep Work',
  'Pomodoro',
  'Feynman Technik',
  'Interleaving',
  'Practice Testing'
] as const;
