# Answer Storage & Security Guide

## Overview
Answers are now stored **separately** from the content JSON to ensure security. The content JSON (without answers) is sent to the user-side, while answers are stored securely via a separate API endpoint.

---

## 🔒 Security Architecture

### Problem
Previously, answers were stored in the content JSON:
```json
{
  "questionGroups": [
    {
      "questions": [
        {
          "text": "What is the capital of France?",
          "correctAnswer": "Paris"  ← ❌ Users can see this!
        }
      ]
    }
  ]
}
```

### Solution
Now answers are separated:

**Content JSON (sent to users):**
```json
{
  "questionGroups": [
    {
      "questions": [
        {
          "text": "What is the capital of France?"
          // No correctAnswer field!
        }
      ]
    }
  ]
}
```

**Answers (stored separately):**
```
POST /test-management/save-question
{
  "sectionId": "uuid",
  "partId": "uuid",
  "answers": ["Paris", "TRUE", "1867", ...]
}
```

---

## Implementation Details

### Save Flow

1. **Admin fills in questions with answers**
2. **Click Save button**
3. **System extracts answers** from form data
4. **System saves content** WITHOUT answers
5. **System saves answers** separately

### Code Implementation

```typescript
const handleSave = async () => {
  // Step 1: Extract answers
  const { answers, contentWithoutAnswers } = extractAnswers(values)
  
  // Step 2: Save content (no answers)
  await testManagementApi.savePartQuestionContent(
    partId, 
    JSON.stringify(contentWithoutAnswers)
  )
  
  // Step 3: Save answers separately
  if (answers.length > 0) {
    await testManagementApi.saveQuestion(sectionId, partId, answers)
  }
}
```

### Extract Answers Function

```typescript
const extractAnswers = (formData: any) => {
  const answers: string[] = []
  const contentWithoutAnswers = { ...formData }

  if (contentWithoutAnswers.questionGroups) {
    contentWithoutAnswers.questionGroups = 
      contentWithoutAnswers.questionGroups.map((group: any) => {
        if (group.questions) {
          const cleanQuestions = group.questions.map((question: any) => {
            // Extract answer
            if (question.correctAnswer) {
              answers.push(
                Array.isArray(question.correctAnswer) 
                  ? question.correctAnswer.join(',') 
                  : question.correctAnswer
              )
            }
            
            // Remove answer from question
            const { correctAnswer, ...questionWithoutAnswer } = question
            return questionWithoutAnswer
          })
          
          return { ...group, questions: cleanQuestions }
        }
        return group
      })
  }

  return { answers, contentWithoutAnswers }
}
```

---

## API Endpoints

### Content Storage (without answers)
```
POST /test-management/save-part-question-content
Request: {
  partId: UUID,
  content: string  // JSON string without answers
}
```

### Answer Storage
```
POST /test-management/save-question
Request: {
  sectionId: UUID,
  partId: UUID,
  answers: string[]  // Array of correct answers
}
```

### Retrieve Content (User Side)
```
GET /mock-submission/get-part-question-content?partId={uuid}
Response: {
  content: string  // JSON without answers ✓
}
```

---

## Answer Format

Answers are stored as a flat array of strings in order:

```typescript
// Question 1: Multiple Choice → Answer: "A"
// Question 2: True/False → Answer: "TRUE"
// Question 3: Fill in blank → Answer: "Paris"
// Question 4: Multiple answers → Answer: "A,C"

answers: ["A", "TRUE", "Paris", "A,C"]
```

---

## Audio Upload Implementation

### Listening Section Audio

Each listening part can have an audio file uploaded:

```typescript
// In the content JSON
{
  "audioFileId": "uuid-of-audio-file",
  "questionGroups": [...]
}
```

### Audio Upload Component

**Location:** `src/components/admin/AudioUpload.tsx`

**Features:**
- Upload audio files (MP3, WAV, OGG, M4A)
- Audio player preview
- Delete/remove functionality
- File validation

**Usage:**
```tsx
<Form.Item name="audioFileId">
  <AudioUpload label="Upload Audio File" />
</Form.Item>
```

### Audio Display (User Side)

```typescript
// In test taking component
{content.audioFileId && (
  <audio 
    controls 
    src={fileApi.getDownloadUrl(content.audioFileId)}
  />
)}
```

---

## Data Structure

### Content JSON Structure (Saved)

```json
{
  "instruction": "General instructions",
  "passage": "Reading text or task description",
  "imageId": "uuid (optional)",
  "audioFileId": "uuid (optional, listening only)",
  "questionGroups": [
    {
      "type": "MULTIPLE_CHOICE",
      "range": "1-5",
      "instruction": "Choose the correct answer",
      "imageId": "uuid (optional)",
      "questions": [
        {
          "text": "What is...?",
          "optionA": "Option A",
          "optionB": "Option B",
          "optionC": "Option C",
          "optionD": "Option D"
          // NO correctAnswer field!
        }
      ]
    }
  ]
}
```

### Answers Array (Saved Separately)

```json
["A", "TRUE", "Paris", "1867", "B,C", "NOT_GIVEN", ...]
```

---

## Testing Checklist

### Admin Side
- [ ] Create questions with answers
- [ ] Click Save
- [ ] Verify success message
- [ ] Reload page
- [ ] Verify questions still show answers (in form)
- [ ] Check browser network tab
- [ ] Verify content JSON has NO answers
- [ ] Verify separate answer API call

### User Side (Future)
- [ ] Fetch part content
- [ ] Verify content has NO answers
- [ ] Answer questions
- [ ] Submit answers
- [ ] System validates against stored answers
- [ ] User receives score

---

## Security Benefits

✅ **Users cannot see answers** in browser dev tools
✅ **Cannot inspect network** to find answers
✅ **Cannot modify client-side** JavaScript to reveal answers
✅ **Answers only accessible** on server-side for grading

---

## Migration Notes

### Existing Tests
If you have existing tests with answers in content JSON:
1. Re-save each part in the admin panel
2. System will automatically separate answers
3. Old content will be updated

### Backward Compatibility
- Old content with answers will still work
- But new saves will use separate storage
- Recommend re-saving all parts

---

## Future Enhancements

1. **Answer Encryption** - Encrypt answers in database
2. **Answer History** - Track answer changes
3. **Bulk Import** - Import questions and answers from CSV
4. **Answer Validation** - Validate answer format before save
5. **Multiple Correct Answers** - Support OR logic for answers

---

**Implementation Date:** October 29, 2025
**Status:** ✅ Complete - Ready for Testing
