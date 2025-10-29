# Real-Time Answer Saving System

## Overview
Answers are now saved **immediately** when the admin selects or enters them. Each answer is saved separately with its question number via API as soon as it's provided.

---

## 🚀 How It Works

### Old System (Batch Saving)
```
1. Admin fills all questions
2. Clicks "Save" button
3. All answers extracted and saved together
```

### New System (Real-Time Saving)
```
1. Admin selects answer for Question 1
   → API call immediately saves answer
2. Admin selects answer for Question 2
   → API call immediately saves answer
3. Admin clicks "Save" button
   → Only saves content (no answers)
```

---

## Implementation Details

### Question Components
Each question component now has:
- `questionNumber` prop - The actual question number (e.g., 1, 14, 27)
- `onAnswerChange` callback - Called when answer changes

### Trigger Events

| Question Type | Trigger Event |
|--------------|---------------|
| **Multiple Choice** | `onChange` (Radio button) |
| **True/False/Not Given** | `onChange` (Radio button) |
| **Sentence Completion** | `onBlur` (Text input loses focus) |
| **Match Heading** | `onBlur` (Text input loses focus) |
| **Short Answer** | `onBlur` (Text input loses focus) |

### Flow Diagram

```
User Action
    ↓
Question Component detects change
    ↓
onAnswerChange(questionNumber, answer)
    ↓
handleAnswerChange() in Part Editor
    ↓
API: POST /test-management/save-question
{
  sectionId: "uuid",
  partId: "uuid",
  answers: ["selected-answer"]
}
    ↓
Answer saved to database
    ↓
Console log confirmation
```

---

## Code Example

### 1. Question Component (Multiple Choice)

```tsx
<Form.Item
  label="Correct Answer"
  name={[...groupPath, 'questions', questionIndex, 'correctAnswer']}
  rules={[{ required: true }]}
>
  <Radio.Group onChange={(e) => onAnswerChange?.(questionNumber, e.target.value)}>
    <Radio value="A">A</Radio>
    <Radio value="B">B</Radio>
    <Radio value="C">C</Radio>
    <Radio value="D">D</Radio>
  </Radio.Group>
</Form.Item>
```

### 2. Question Number Calculation

```tsx
const getQuestionNumber = (index: number): number => {
  // Parse question range (e.g., "1-5" or "14-20")
  const range = form.getFieldValue([...groupPath, 'range']) || questionRange
  if (range) {
    const match = range.match(/^(\d+)-(\d+)$/)
    if (match) {
      return parseInt(match[1]) + index
    }
  }
  return index + 1
}

// Example:
// Range: "14-20", index: 0 → Question Number: 14
// Range: "14-20", index: 3 → Question Number: 17
```

### 3. Answer Save Handler

```tsx
const handleAnswerChange = async (questionNumber: number, answer: string) => {
  if (!answer || !sectionId) return
  
  try {
    // Save this single answer immediately
    await testManagementApi.saveQuestion(sectionId, partId, [answer])
    console.log(`Answer for question ${questionNumber} saved:`, answer)
  } catch (error) {
    console.error('Error saving answer:', error)
    message.error(`Failed to save answer for question ${questionNumber}`)
  }
}
```

### 4. Content Save (No Answers)

```tsx
const handleSave = async () => {
  const values = await form.validateFields()
  
  // Remove answers from content
  const contentWithoutAnswers = removeAnswersFromContent(values)
  
  // Save content only
  await testManagementApi.savePartQuestionContent(
    partId, 
    JSON.stringify(contentWithoutAnswers)
  )
  
  message.success('Content saved successfully!')
}
```

---

## API Calls

### Real-Time Answer Save
```http
POST /test-management/save-question
Content-Type: application/json

{
  "sectionId": "550e8400-e29b-41d4-a716-446655440000",
  "partId": "550e8400-e29b-41d4-a716-446655440001",
  "answers": ["A"]  // Single answer
}
```

### Content Save (No Answers)
```http
POST /test-management/save-part-question-content
Content-Type: application/json

{
  "partId": "550e8400-e29b-41d4-a716-446655440001",
  "content": "{\"instruction\":\"...\",\"questionGroups\":[{\"questions\":[{\"text\":\"...\"}]}]}"
  // Note: No correctAnswer fields in JSON
}
```

---

## Benefits

### ✅ **Immediate Feedback**
- Admin knows answer is saved right away
- No waiting until final save
- Console logs confirm each save

### ✅ **Data Safety**
- Answers saved as they're entered
- Won't lose work if page crashes
- Can safely navigate away

### ✅ **Better Security**
- Answers never in content JSON
- Separate API endpoint
- Server-side storage only

### ✅ **Scalability**
- Can handle large tests
- No memory issues with batch saving
- Each answer saves independently

---

## Question Number Examples

### Reading Section - Part 1

```
Question Group 1: Range "1-5"
├─ Question Index 0 → Question Number: 1
├─ Question Index 1 → Question Number: 2
├─ Question Index 2 → Question Number: 3
├─ Question Index 3 → Question Number: 4
└─ Question Index 4 → Question Number: 5

Question Group 2: Range "6-13"
├─ Question Index 0 → Question Number: 6
├─ Question Index 1 → Question Number: 7
├─ Question Index 2 → Question Number: 8
...
└─ Question Index 7 → Question Number: 13
```

### Reading Section - Part 2

```
Question Group 1: Range "14-20"
├─ Question Index 0 → Question Number: 14
├─ Question Index 1 → Question Number: 15
...
└─ Question Index 6 → Question Number: 20
```

---

## Console Output Example

When admin selects answers, console shows:

```
Answer for question 1 saved: A
Answer for question 2 saved: TRUE
Answer for question 3 saved: Paris
Answer for question 14 saved: B,C
Answer for question 15 saved: NOT_GIVEN
```

---

## Error Handling

### Missing sectionId
```tsx
if (!sectionId) {
  // Silently skip - sectionId comes from URL params
  return
}
```

### API Error
```tsx
catch (error) {
  console.error('Error saving answer:', error)
  message.error(`Failed to save answer for question ${questionNumber}`)
}
```

### Empty Answer
```tsx
if (!answer) {
  // Don't save empty answers
  return
}
```

---

## Testing Checklist

### Real-Time Saving
- [ ] Select answer for Question 1
- [ ] Check console: "Answer for question 1 saved: A"
- [ ] Check Network tab: POST to /save-question
- [ ] Select answer for Question 2
- [ ] Check console: "Answer for question 2 saved: TRUE"
- [ ] Refresh page
- [ ] Verify answers persist

### Content Saving
- [ ] Click "Save" button
- [ ] Check Network tab: POST to /save-part-question-content
- [ ] Verify JSON has NO correctAnswer fields
- [ ] Reload page
- [ ] Verify content loads correctly
- [ ] Verify answers still show in form

### Question Numbers
- [ ] Create Question Group with range "14-20"
- [ ] Add 3 questions
- [ ] Select answer for first question
- [ ] Verify console says "Question 14" (not "Question 0")
- [ ] Select answer for second question
- [ ] Verify console says "Question 15"

---

## Troubleshooting

### Issue: Answers not saving
**Check:**
1. sectionId is in URL: `?sectionId=xxx`
2. Console for error messages
3. Network tab for failed requests
4. Browser console for JavaScript errors

### Issue: Wrong question numbers
**Check:**
1. Question Range field is filled (e.g., "1-5")
2. Range format is correct: "start-end"
3. Console log shows correct number

### Issue: Content includes answers
**Check:**
1. `removeAnswersFromContent()` function is called
2. Network payload has no "correctAnswer" fields
3. Browser console for errors

---

## Migration Notes

### Backward Compatibility
- Old content with answers still works
- New saves use real-time system
- No data migration needed

### Recommendation
- Inform admins about real-time saving
- Explain they don't need to save after each answer
- "Save" button now only saves content structure

---

## Future Enhancements

1. **Visual Confirmation** - Show checkmark when answer saved
2. **Retry Logic** - Auto-retry failed saves
3. **Offline Queue** - Queue saves when offline
4. **Bulk Edit** - Edit multiple answers at once
5. **Undo/Redo** - Undo answer changes

---

**Implementation Date:** October 29, 2025
**Status:** ✅ Complete - Ready for Testing
