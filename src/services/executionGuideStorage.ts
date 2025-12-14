/**
 * LocalStorage utilities for ExecutionGuide data
 */

import { ExecutionGuide } from '../types/executionGuide';

const STORAGE_KEY = 'studyplanner_execution_guides';

export interface StoredExecutionGuides {
  [sessionId: string]: ExecutionGuide;
}

/**
 * Save an execution guide to localStorage
 */
export function saveExecutionGuide(guide: ExecutionGuide): void {
  try {
    const stored = getAllExecutionGuides();
    stored[guide.sessionId] = guide;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (error) {
    console.error('[ExecutionGuideStorage] Failed to save execution guide:', error);
  }
}

/**
 * Save multiple execution guides at once
 */
export function saveExecutionGuides(guides: ExecutionGuide[]): void {
  try {
    const stored = getAllExecutionGuides();
    guides.forEach(guide => {
      stored[guide.sessionId] = guide;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (error) {
    console.error('[ExecutionGuideStorage] Failed to save execution guides:', error);
  }
}

/**
 * Get execution guide for a specific session
 */
export function getExecutionGuide(sessionId: string): ExecutionGuide | null {
  try {
    const stored = getAllExecutionGuides();
    return stored[sessionId] || null;
  } catch (error) {
    console.error('[ExecutionGuideStorage] Failed to get execution guide:', error);
    return null;
  }
}

/**
 * Get all stored execution guides
 */
export function getAllExecutionGuides(): StoredExecutionGuides {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {};
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('[ExecutionGuideStorage] Failed to get all execution guides:', error);
    return {};
  }
}

/**
 * Check if a session has an execution guide
 */
export function hasExecutionGuide(sessionId: string): boolean {
  const guide = getExecutionGuide(sessionId);
  return guide !== null;
}

/**
 * Delete an execution guide
 */
export function deleteExecutionGuide(sessionId: string): void {
  try {
    const stored = getAllExecutionGuides();
    delete stored[sessionId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (error) {
    console.error('[ExecutionGuideStorage] Failed to delete execution guide:', error);
  }
}

/**
 * Clear all execution guides
 */
export function clearAllExecutionGuides(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[ExecutionGuideStorage] Failed to clear execution guides:', error);
  }
}
