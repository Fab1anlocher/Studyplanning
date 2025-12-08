/**
 * Data Normalization Utilities
 * 
 * Functions to normalize and clean data for consistent processing.
 */

import { MODULE_VALIDATION } from '../constants';

/**
 * Ensures assessment weights sum to exactly 100% using largest remainder method
 * This prevents rounding errors from causing weight sums != 100%
 */
export function normalizeAssessmentWeights<T extends { weight: number }>(
  assessments: T[]
): T[] {
  const total = assessments.reduce((sum, a) => sum + a.weight, 0);
  
  // Guard against zero or negative totals
  if (total <= 0) {
    console.warn('Assessment weights sum to zero or negative. Setting equal weights.');
    const equalWeight = Math.floor(100 / assessments.length);
    const remainder = 100 - (equalWeight * assessments.length);
    return assessments.map((a, i) => ({
      ...a,
      weight: i < remainder ? equalWeight + 1 : equalWeight
    }));
  }
  
  if (Math.abs(total - 100) < MODULE_VALIDATION.ASSESSMENT_WEIGHT_TOLERANCE) {
    return assessments; // Already close enough
  }
  
  // Calculate ideal weights and integer parts
  const factor = 100 / total;
  const idealWeights = assessments.map(a => a.weight * factor);
  const integerParts = idealWeights.map(w => Math.floor(w));
  const fractionalParts = idealWeights.map((w, i) => ({ 
    index: i, 
    fraction: w - (integerParts[i] ?? 0)
  }));
  
  // Sort by fractional part descending
  fractionalParts.sort((a, b) => b.fraction - a.fraction);
  
  // Distribute remaining points to largest remainders
  let distributed = integerParts.reduce((sum, w) => sum + w, 0);
  let i = 0;
  while (distributed < 100 && i < fractionalParts.length) {
    const fracPart = fractionalParts[i];
    if (fracPart && fracPart.index >= 0 && fracPart.index < integerParts.length) {
      const currentValue = integerParts[fracPart.index];
      if (currentValue !== undefined) {
        integerParts[fracPart.index] = currentValue + 1;
      }
    }
    distributed++;
    i++;
  }
  
  return assessments.map((a, index) => ({
    ...a,
    weight: integerParts[index] ?? 0
  }));
}

/**
 * Calculates workload from ECTS if not provided
 */
export function calculateWorkloadFromECTS(ects: number): number {
  return ects * MODULE_VALIDATION.WORKLOAD_PER_ECTS;
}

/**
 * Truncates text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

/**
 * Generates a unique ID
 */
export function generateUniqueId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 11);
}
