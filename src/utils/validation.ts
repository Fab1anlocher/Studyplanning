/**
 * Validation Utilities
 * 
 * Centralized validation functions for common operations.
 * Provides consistent validation logic across the application.
 */

import { MODULE_VALIDATION, STUDY_PLANNING } from '../constants';

/**
 * Validates if a file is actually a PDF by checking magic number (header bytes)
 * PDFs start with %PDF- (25 50 44 46 2D in hex)
 */
export async function isPDFByMagicNumber(file: File): Promise<boolean> {
  try {
    const arrayBuffer = await file.slice(0, 5).arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    return bytes.length >= 5 &&
           bytes[0] === 0x25 && // %
           bytes[1] === 0x50 && // P
           bytes[2] === 0x44 && // D
           bytes[3] === 0x46 && // F
           bytes[4] === 0x2D;   // -
  } catch {
    return false;
  }
}

/**
 * Validates ECTS value is within acceptable range
 */
export function isValidECTS(ects: number): boolean {
  return typeof ects === 'number' && 
         ects >= MODULE_VALIDATION.ECTS_MIN && 
         ects <= MODULE_VALIDATION.ECTS_MAX;
}

/**
 * Validates workload value is within acceptable range
 */
export function isValidWorkload(workload: number): boolean {
  return typeof workload === 'number' && 
         workload >= MODULE_VALIDATION.WORKLOAD_MIN && 
         workload <= MODULE_VALIDATION.WORKLOAD_MAX;
}

/**
 * Validates that assessment weights sum to 100%
 */
export function validateAssessmentWeights(
  assessments: Array<{ weight: number }>
): boolean {
  const total = assessments.reduce((sum, a) => sum + a.weight, 0);
  return Math.abs(total - 100) < MODULE_VALIDATION.ASSESSMENT_WEIGHT_TOLERANCE;
}

/**
 * Validates time format (HH:MM)
 */
export function isValidTimeFormat(time: string): boolean {
  return STUDY_PLANNING.TIME_FORMAT_REGEX.test(time);
}

/**
 * Validates API key format (basic check for OpenAI key)
 */
export function isValidAPIKey(apiKey: string): boolean {
  return apiKey.trim().length > 0 && apiKey.startsWith('sk-');
}

/**
 * Validates module title is not empty
 */
export function isValidModuleTitle(title: string): boolean {
  return Boolean(title && title.trim().length > 0);
}

/**
 * Validates content array has correct number of items
 */
export function isValidContentArray(content: string[]): boolean {
  return Array.isArray(content) && 
         content.length >= MODULE_VALIDATION.CONTENT_MIN && 
         content.length <= MODULE_VALIDATION.CONTENT_MAX;
}

/**
 * Validates competencies array has correct number of items
 */
export function isValidCompetenciesArray(competencies: string[]): boolean {
  return Array.isArray(competencies) && 
         competencies.length >= MODULE_VALIDATION.COMPETENCIES_MIN && 
         competencies.length <= MODULE_VALIDATION.COMPETENCIES_MAX;
}
