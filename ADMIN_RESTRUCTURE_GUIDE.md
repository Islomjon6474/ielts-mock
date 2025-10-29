# Admin Panel Restructure - Implementation Guide

## Overview
The admin panel has been completely restructured according to the new design specifications. The sidebar navigation has been removed and replaced with a card-based interface.

---

## New Structure

### Route Changes

#### ✅ NEW ROUTES (Implemented)
```
/admin                              → Main dashboard (test cards grid)
/admin/test/[testId]                → Test sections (Listening, Reading, Writing)
/admin/test/[testId]/section/[sectionType]  → Parts list with question counts
/admin/test/[testId]/section/[sectionType]/part/[partId]  → Part content editor
```

#### ❌ OLD ROUTES (To be removed)
```
/admin/reading/create               → No longer needed (integrated into new flow)
/admin/reading/test/[testId]        → Replaced by /admin/test/[testId]
/admin/reading/[testId]             → Remove (mock data)
/admin/reading/[testId]/part/[partId]  → Remove (mock data)
/admin/reading/[testId]/part/[partId]/group/[groupId]  → Remove (mock data)
```

---

## New Components Created

### Question Components (`src/components/admin/questions/`)
All question components have been extracted and made reusable:

- **`MultipleChoiceQuestion.tsx`** - Multiple choice with A/B/C/D options
- **`TrueFalseQuestion.tsx`** - True/False/Not Given or Yes/No/Not Given
- **`SentenceCompletionQuestion.tsx`** - Fill in the blank with word limits
- **`MatchHeadingQuestion.tsx`** - Match headings to sections
- **`ShortAnswerQuestion.tsx`** - Short answer questions
- **`QuestionGroupEditor.tsx`** - Wrapper component for managing question groups
- **`index.tsx`** - Exports all components and question types

### Usage Example:
```tsx
import { QuestionGroupEditor } from '@/components/admin/questions'

<QuestionGroupEditor
  groupPath={['questionGroups', 0]}
  groupLabel="Question Group 1"
  form={form}
/>
```

---

## Pages Implemented

### 1. `/admin/page.tsx` - Main Dashboard
**Features:**
- 3x3 grid of test cards
- Each card shows: test name, created date, active status
- Modal dialog for creating new test
- Pagination support
- No sidebar (removed)

**Actions:**
- Click "CREATE" → Opens modal to enter test name
- Click test card → Navigate to test sections

---

### 2. `/admin/test/[testId]/page.tsx` - Test Sections
**Features:**
- Three section cards: Listening, Reading, Writing
- Color-coded icons for each section
- Shows number of parts per section

**Actions:**
- Click section card → Navigate to parts list

---

### 3. `/admin/test/[testId]/section/[sectionType]/page.tsx` - Parts List
**Features:**
- Table showing all parts
- Displays question count for each part
- Initially shows 0 questions (updates after content is added)

**Columns:**
- Parts (Part 1, Part 2, etc.)
- Questions Count (0, 10, etc.)
- Action (Edit button)

**Actions:**
- Click row or Edit button → Navigate to part editor

---

### 4. `/admin/test/[testId]/section/[sectionType]/part/[partId]/page.tsx` - Part Editor
**Features:**
- Three tabs: Content, Listening Audio, Answers
- Save button in header

#### Content Tab:
- **For Reading/Writing:**
  - Split view (left: passage, right: questions)
  - Left side: Large text area for passage
  - Right side: Question groups with type-specific editors
  
- **For Listening:**
  - Full width layout
  - Question groups only (audio in separate tab)

#### Listening Audio Tab:
- File upload (to be implemented)
- Audio player preview

#### Answers Tab:
- Summary of all answers for review

---

## Data Structure

### Content JSON Format
The part content is stored as a JSON string with this structure:

```typescript
{
  instruction: string          // General instructions
  passage?: string            // Reading passage or writing task (Reading/Writing only)
  questionGroups: [
    {
      type: string            // Question type
      range: string           // e.g., "1-5"
      instruction: string     // Group-specific instructions
      questions: [
        {
          text: string
          optionA?: string    // For multiple choice
          optionB?: string
          optionC?: string
          optionD?: string
          correctAnswer: string | string[]
          wordLimit?: string  // For sentence completion
          sectionId?: string  // For match heading
        }
      ]
    }
  ]
}
```

---

## API Changes

### Base URL Updated
```typescript
// OLD
const BASE_URL = 'http://localhost:8080/ielts-mock-main'

// NEW
const BASE_URL = 'https://mock.fleetoneld.com/ielts-mock-main'
```

### New APIs Added
- `testManagementApi.updateTestActive()` - Activate/deactivate tests
- `testManagementApi.updateQuestion()` - Update existing questions
- `mockSubmissionApi` - Separate API for user-side test taking

---

## Migration Steps

### Step 1: Test the New Routes ✅
1. Start dev server: `npm run dev`
2. Navigate to `/admin`
3. Create a new test
4. Click through: Test → Section → Part
5. Add content to a part and save

### Step 2: Remove Old Files (After Testing)
Delete these directories:
```
src/app/admin/reading/[testId]/
src/app/admin/reading/test/
src/app/admin/reading/create/
```

### Step 3: Update Navigation Links
Search for any links to old routes and update them:
- `/admin/reading/create` → Create via modal on `/admin`
- `/admin/reading/test/[testId]` → `/admin/test/[testId]`

---

## Question Types Supported

1. **Multiple Choice** - A/B/C/D options
2. **True/False/Not Given** - Three-option statements
3. **Yes/No/Not Given** - Alternative three-option format
4. **Match Headings** - Section identifier → heading mapping
5. **Sentence Completion** - Fill in blanks with word limits
6. **Summary Completion** - Similar to sentence completion
7. **Short Answer** - Open-ended questions

---

## Benefits of New Structure

✅ **Cleaner Navigation** - No sidebar, card-based interface
✅ **Reusable Components** - Question components can be used anywhere
✅ **Consistent Flow** - Test → Section → Part → Content
✅ **Better Organization** - Clear separation of concerns
✅ **API Aligned** - Structure matches backend hierarchy
✅ **Easier Maintenance** - Modular, component-based architecture

---

## Testing Checklist

- [ ] Create new test from dashboard
- [ ] View test sections
- [ ] View parts list for each section
- [ ] Edit Reading part with passage and questions
- [ ] Edit Writing part with task and questions
- [ ] Edit Listening part with questions
- [ ] Add multiple question groups
- [ ] Add different question types
- [ ] Save content and verify it persists
- [ ] Navigate back through breadcrumb

---

## Next Steps (Future Enhancements)

1. **Listening Audio Upload** - Implement file upload in Listening Audio tab
2. **Delete Test** - Add delete functionality to test cards
3. **Duplicate Test** - Allow copying existing tests
4. **Preview Mode** - Preview test as a student would see it
5. **Bulk Import** - Import questions from CSV/Excel
6. **Rich Text Editor** - Replace TextArea with Quill for passage editing
7. **Answer Validation** - Show validation rules for each question type

---

## Troubleshooting

### Issue: Questions not saving
- Check browser console for API errors
- Verify form validation passes
- Ensure JSON structure is valid

### Issue: Parts showing 0 questions after save
- Backend may need to parse JSON and count questions
- Check if `questionCount` field is updated in API response

### Issue: Split view not showing
- Check if sectionType is correct (reading/writing)
- Verify CSS flex properties are applied

---

## Contact & Support

For questions about this restructure, refer to:
- API Documentation: `https://mock.fleetoneld.com/ielts-mock-main/swagger-ui/index.html`
- Component Usage: `src/components/admin/questions/`
- Original Requirements: See wireframe images in project discussion

---

**Implementation Date:** October 29, 2025
**Status:** ✅ Complete - Ready for Testing
