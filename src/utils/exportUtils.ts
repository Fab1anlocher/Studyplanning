/**
 * Export Utilities
 * 
 * Functions for exporting data in various formats (CSV, Excel, etc.)
 */

import { StudySession, Module } from '../types';

/**
 * Exports study sessions to CSV format (Excel-compatible)
 */
export function exportSessionsToCSV(sessions: StudySession[], modules: Module[]): void {
  // Create CSV header
  const headers = ['Datum', 'Start', 'Ende', 'Modul', 'Thema', 'Beschreibung', 'Lernmethode'];
  
  // Create CSV rows
  const rows = sessions.map(session => [
    session.date,
    session.startTime,
    session.endTime,
    session.module,
    session.topic,
    session.description.replace(/,/g, ';'), // Replace commas to avoid CSV issues
    session.learningMethod || ''
  ]);
  
  // Combine header and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // Create download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `lernplan_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports module data to JSON format
 */
export function exportModulesToJSON(modules: Module[]): void {
  const jsonContent = JSON.stringify(modules, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `module_${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
