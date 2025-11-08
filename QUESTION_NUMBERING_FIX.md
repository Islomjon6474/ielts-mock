# Question Numbering and Add Question Button Fix

## Issues Fixed

### 1. Add Question Button Not Working
**Problem:** The "Add Question" button only incremented a counter but didn't actually create question objects in the form.

**Solution:** Updated `QuestionGroupEditor.tsx` to create proper question objects for each question type:
- Multiple Choice: `{ text: '', options: ['', '', '', ''], answer: '' }`
- True/False/Not Given: `{ text: '', answer: '' }`
- Yes/No/Not Given: `{ text: '', answer: '' }`
- Sentence Completion: `{ text: '', answer: '' }`
- Match Heading: `{ paragraphText: '', answer: '' }`
- Short Answer: `{ text: '', answer: '' }`
- Image Inputs: `{ x: 50, y: 50, answer: '', imageUrl: ... }`

### 2. Question Numbering Not Sequential
**Problem:** Question groups didn't auto-calculate their question range, causing:
- Questions in Group 2 starting from 1 instead of 6 (if Group 1 had 5 questions)
- Answers being saved with wrong question numbers
- Answers from different groups overwriting each other

**Solution:** 
1. Added `getNextQuestionRange()` function that calculates the starting number based on all previous groups
2. Auto-generates range like "6-10" for Group 2 if Group 1 was "1-5"
3. Updated `addQuestionGroup()` to create new groups with pre-calculated ranges
4. Added `updateRange()` function that auto-updates the range when questions are added/removed

### 3. Range Not Updating When Questions Added/Removed
**Problem:** If you added a 6th question to a group with range "1-5", the range stayed "1-5" instead of updating to "1-6"

**Solution:**
- `addQuestion()` now calls `updateRange()` after adding
- `removeQuestion()` now calls `updateRange()` after removing
- Range automatically adjusts based on actual question count

## Files Modified

### 1. `/src/components/admin/questions/QuestionGroupEditor.tsx`
- Added proper question object creation in `addQuestion()`
- Added `updateRange()` function
- Updated `removeQuestion()` to call `updateRange()`

### 2. `/src/app/admin/test/[testId]/section/[sectionType]/part/[partId]/page.tsx`
- Added `getNextQuestionRange()` function
- Updated `addQuestionGroup()` to pre-populate range
- Passed `defaultQuestionRange` prop to all QuestionGroupEditor components

## How It Works Now

### Admin Side:
1. **First Question Group:** Range defaults to "1-5" (for 5 questions)
2. **Second Question Group:** Auto-calculates to "6-10" (continuing from first group)
3. **Add Question:** Range updates from "1-5" to "1-6"
4. **Remove Question:** Range updates from "1-5" to "1-4"

### User Side:
- Questions display with correct numbers (1, 2, 3, ... 5, 6, 7, ...)
- Answers are saved with correct question numbers
- No answer collision between groups

## Testing Checklist

- [x] Add Question button works for all question types
- [x] Question groups auto-calculate sequential ranges
- [x] Range updates when adding questions
- [x] Range updates when removing questions
- [x] Questions in Group 2 start from correct number (e.g., 6 if Group 1 ends at 5)
- [x] Answers save with correct question numbers
- [x] No answer overlap between groups
