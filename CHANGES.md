# Changes Made to StudyPlanner

## Summary
This document describes the improvements made to the StudyPlanner application to fix issues and enhance the AI prompts.

## Issues Fixed

### 1. White Screen Issue in ModuleLearningGuide
**Problem:** When the ModuleLearningGuide component encountered an error during AI generation, it would show a white screen instead of a proper error message.

**Solution:** 
- Added error state management with `useState<string | null>(null)`
- Display error messages in an Alert component when generation fails
- Proper error handling in the `generateGuide` function
- Users now see a clear error message instead of a blank screen

**Files Changed:**
- `src/components/ModuleLearningGuide.tsx`

### 2. AI Prompt Improvements

#### Module Size Consideration
**Problem:** The AI didn't properly account for larger modules needing more time and resources.

**Solution:** Added explicit instructions to:
- Consider ECTS credits as a proxy for module complexity and workload
- Allocate proportionally more time to modules with higher ECTS
- Create longer sessions and more repetition cycles for larger modules

#### Assessment Weight Prioritization
**Problem:** The AI treated all assessments equally, even when one was worth 80% and another 20%.

**Solution:** Added instructions to:
- Analyze the weight percentage of each assessment
- Allocate study time proportionally (e.g., 80% presentation → 80% of preparation time)
- Start earlier with high-weight assessments (4-6 weeks instead of 2-3 weeks)
- Focus more effort on high-stakes assessments

#### Presentation Practice Strategy
**Problem:** Students would continue learning theory in the last days before a presentation instead of practicing the actual presentation.

**Solution:** Added explicit instructions for presentations:
- **Last 5-7 days:** ONLY practice presenting (no new content, no slide changes)
- Must practice 3-5 times completely through
- Focus on timing, delivery, body language, Q&A preparation
- No new slides or content changes in last 3 days

#### Student-Centric Thinking
**Problem:** The AI generated idealistic "learn everything perfectly" plans that don't match student reality.

**Solution:** Added "DENKE WIE EIN STUDENT" (Think Like a Student) section:
- Students have limited time and energy
- Larger modules need proportionally MORE focus
- Students prioritize by assessment weight (practical, not idealistic)
- In final days before presentation: ONLY practice presenting
- Need practical, realistic plans

**Files Changed:**
- `src/prompts/studyPlanGenerator.ts`
- `src/prompts/moduleLearningGuide.ts`

## New Feature: Prompt Extraction

### Problem
Non-technical users (e.g., friends who do prompt engineering) couldn't easily edit the AI prompts without touching the code, which is risky and requires technical knowledge.

### Solution
Created a separate `src/prompts/` directory with:
- `studyPlanGenerator.ts` - Prompt for semester study plan generation
- `moduleLearningGuide.ts` - Prompt for detailed module learning guides
- `README.md` - Complete documentation for editing prompts

### Benefits
1. **Non-Technical Friendly:** Prompts are in separate files, clearly documented
2. **No Code Knowledge Needed:** Users only edit the text between backticks
3. **Variable System:** Variables like `{startDate}` are automatically replaced at runtime
4. **Documentation:** README explains what each prompt does, how to edit, and includes tips
5. **Version Control:** Easy to track prompt changes separately from code changes

### How It Works
The prompts are imported in the components:
```typescript
import { MODULE_GUIDE_SYSTEM_PROMPT } from '../prompts/moduleLearningGuide';
```

Then variables are replaced at runtime:
```typescript
const prompt = MODULE_GUIDE_SYSTEM_PROMPT
  .replace('{moduleName}', actualModuleName)
  .replace('{ects}', actualECTS)
  // etc...
```

**Files Added:**
- `src/prompts/studyPlanGenerator.ts`
- `src/prompts/moduleLearningGuide.ts`
- `src/prompts/README.md`

**Files Modified:**
- `src/components/StudyPlanGenerator.tsx` - Import and use external prompts
- `src/components/ModuleLearningGuide.tsx` - Import and use external prompts

## Performance Considerations

The code already implements several performance optimizations:
- `useMemo` for expensive calculations (calendar weeks, month calculations)
- `useCallback` for stable function references (prevent re-renders)
- Memoized session filtering to avoid recalculation

No additional performance changes were needed.

## Testing

- ✅ TypeScript compilation successful
- ✅ Build successful (npm run build)
- ✅ All syntax valid
- ✅ No new dependencies added
- ✅ Existing functionality preserved

## Migration Notes

### For Developers
The old inline prompts are kept as comments in the component files for reference. To revert to inline prompts, uncomment the old prompt and remove the import.

### For Prompt Engineers
To edit prompts:
1. Navigate to `src/prompts/`
2. Open the relevant `.ts` file
3. Edit the text between the backticks (`)
4. **Do not delete variables in curly braces** `{variableName}`
5. Save the file
6. Rebuild the app: `npm run build`

See `src/prompts/README.md` for detailed instructions.

## Future Improvements

Potential areas for future enhancement:
1. Add prompt versioning system
2. Create A/B testing for different prompts
3. Add prompt templates for different study styles
4. User-configurable prompts through UI
5. Prompt analytics (which prompts lead to best outcomes)
