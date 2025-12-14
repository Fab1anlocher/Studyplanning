# Week Elaboration Feature - Documentation

## Overview

The "Woche ausarbeiten" (Week Elaboration) feature allows users to select a specific week in the study plan calendar and generate detailed execution guides for all sessions in that week using AI.

## Feature Components

### 1. Types & Interfaces (`src/types/executionGuide.ts`)

Defines the data structures for execution guides:

- **ExecutionGuide**: Contains detailed planning for a single session
  - `sessionGoal`: Why the session is important
  - `agenda`: Time-based breakdown of activities (phases with durations)
  - `methodIdeas`: 2-4 concrete approaches to tackle the session
  - `tools`: Specific tools or materials to use
  - `deliverable`: Clear expected output
  - `readyCheck`: Success criteria

- **WeekElaborationRequest**: Request format for LLM
- **WeekElaborationResponse**: Response format from LLM

### 2. Storage Layer (`src/services/executionGuideStorage.ts`)

LocalStorage utilities for persisting execution guides:

- `saveExecutionGuide(guide)`: Save a single guide
- `saveExecutionGuides(guides)`: Save multiple guides
- `getExecutionGuide(sessionId)`: Retrieve guide for session
- `hasExecutionGuide(sessionId)`: Check if guide exists
- `deleteExecutionGuide(sessionId)`: Remove guide
- `clearAllExecutionGuides()`: Clear all guides

Storage key: `studyplanner_execution_guides`

### 3. LLM Service (`src/services/weekElaborationService.ts`)

Handles AI-powered generation of execution guides:

- **generateWeekElaboration(request, apiKey)**: Main function that:
  - Validates input data
  - Calls OpenAI/DeepSeek LLM with structured prompt
  - Validates and sanitizes LLM response
  - Returns validated execution guides
  
- **getSessionsForWeek(allSessions, weekStartDate)**: Helper to filter sessions
- **formatDateISO(date)**: Date formatting utility

### 4. LLM Prompts (`src/prompts/weekElaborationPrompt.ts`)

Carefully crafted prompts ensuring:

- Structured JSON output
- Time-consistent agendas (must match session duration)
- Module-context awareness (uses content, competencies, assessments)
- Pedagogically sound progression (Warm-up → Core Work → Consolidation)
- Concrete, actionable guidance (no vague instructions)
- Assessment-oriented planning

### 5. UI Components

#### ExecutionGuideView (`src/components/ExecutionGuideView.tsx`)

Displays execution guide details with:
- Session goal (blue accent)
- Agenda with time breakdown (purple accent)
- Method ideas (orange accent)
- Tools & materials (green accent)
- Expected deliverable (pink accent)
- Success check (emerald accent)
- Generation timestamp

#### StudyPlanGenerator Enhancements

Added to existing component:

1. **Week Selection UI**:
   - Hint banner explaining the feature
   - Week selection buttons (one per week with sessions)
   - Visual highlight for selected week
   - Session count display

2. **Elaboration Workflow**:
   - Click week button to select
   - Click again to elaborate (calls LLM)
   - Loading state during generation
   - Success notification
   - Error handling with user-friendly messages

3. **Execution Guide Display**:
   - Badge on sessions with guides ("Ausgearbeitet")
   - "Execution Guide anzeigen" button
   - Modal with full guide details
   - Seamless integration with existing session view

## User Flow

1. **Generate Study Plan**: User goes through the existing flow to generate their study plan
2. **View Calendar**: Study plan shows calendar with all sessions
3. **Select Week**: User clicks on a week button (e.g., "Woche 2024-12-09 auswählen")
4. **Elaborate Week**: Selected week is highlighted, button changes to "Woche ausarbeiten (X Sessions)"
5. **AI Generation**: User clicks the button, LLM generates execution guides (takes 5-15 seconds)
6. **View Guides**: Sessions now show "Ausgearbeitet" badge and "Execution Guide anzeigen" link
7. **Review Details**: Click to see full execution guide in modal

## Technical Details

### LLM Integration

- **Model**: DeepSeek Chat (configurable)
- **Temperature**: 0.7 (creative but consistent)
- **Max Tokens**: 8000 (sufficient for multiple sessions)
- **Response Format**: JSON object (structured output)

### Validation

The service performs robust validation:

1. **Input Validation**:
   - API key presence
   - Sessions availability
   - Module data completeness

2. **Response Validation**:
   - JSON structure correctness
   - Required fields presence
   - Agenda duration matching session duration (±5 min tolerance)
   - Array field types

3. **Data Sanitization**:
   - Filters out invalid guides
   - Logs warnings for issues
   - Returns only validated guides

### Error Handling

- Network errors: User-friendly error message
- Invalid responses: Fallback with warning
- Missing API key: Preventive validation
- No sessions in week: Clear error message

## Design Consistency

The feature follows the existing app's design language:

- **Colors**: Uses existing gradient scheme (orange-yellow for elaboration)
- **Components**: Reuses Button, Card, Badge, Alert from UI library
- **Icons**: Lucide React icons (Zap for elaboration)
- **Spacing**: Consistent with existing layout
- **Typography**: Matches existing font hierarchy
- **Animations**: Subtle transitions consistent with app

## Performance Considerations

1. **Lazy Loading**: Execution guides loaded only when needed
2. **LocalStorage**: Quick access without API calls for saved guides
3. **Memoization**: Calendar calculations memoized to prevent re-renders
4. **Efficient Filtering**: Sessions filtered by week only once per request

## Future Enhancements

Potential improvements (not implemented):

1. **Bulk Elaboration**: Elaborate multiple weeks at once
2. **Guide Editing**: Allow users to modify generated guides
3. **Export Guides**: Include guides in Excel export
4. **Regeneration**: Re-generate guide for specific session
5. **Templates**: Save and reuse guide templates
6. **Offline Mode**: Queue elaborations for when API is available
7. **Progress Tracking**: Mark guide steps as completed during study

## Code Quality

- **TypeScript**: Full type safety throughout
- **Validation**: Multiple layers of validation
- **Error Handling**: Comprehensive error catching
- **Logging**: Detailed console logs for debugging
- **Comments**: Well-documented code
- **Separation of Concerns**: Clear service/component boundaries

## Testing Recommendations

1. **Unit Tests**:
   - Storage functions (save, load, delete)
   - Date utilities (getSessionsForWeek, formatDateISO)
   - Validation functions

2. **Integration Tests**:
   - LLM service with mock responses
   - Component interactions
   - LocalStorage persistence

3. **E2E Tests**:
   - Full elaboration workflow
   - Error scenarios
   - UI responsiveness

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support (via existing components)
- Screen reader friendly (descriptive text)
- Color contrast meeting WCAG standards

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- LocalStorage API support required
- ES6+ JavaScript features
- CSS Grid and Flexbox

## Security Considerations

- API key stored only in component state (not in localStorage)
- No sensitive data in execution guides
- XSS prevention via React's built-in sanitization
- Input validation on all user inputs
- No eval() or dangerous dynamic code execution
