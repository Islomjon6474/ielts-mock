# Data Structure Analysis - Listening Section

## 🔍 Problem Statement

When creating questions in the listening section:
1. Questions are not persisted when re-entering manage mode
2. Preview mode shows empty content
3. Data is being saved but not properly loaded back

---

## 📊 Current Data Structures

### Admin Format (What's saved in `save-part-question-content`)

```typescript
{
  instruction: string,
  questionGroups: [
    {
      type: 'MULTIPLE_CHOICE' | 'FILL_IN_BLANK' | etc,
      range: '1-5',  // Question range as string
      instruction: string,
      questions: [
        {
          questionNumber: 1,
          text: 'Question text',
          correctAnswer: 'answer',  // REMOVED before saving
          options: ['A', 'B', 'C'],  // For MC
          // ... other fields
        }
      ]
    }
  ]
}
```

###User Format (What ListeningStore expects)

```typescript
{
  id: number,
  title: string,
  instruction: string,
  questionRange: [number, number],  // Array of start/end
  audioUrl: string,
  questions: [
    {
      id: number,
      type: 'MULTIPLE_CHOICE' | 'FILL_IN_BLANK' | etc,
      text: string,
      // NO correctAnswer field (that's in answers table)
    }
  ]
}
```

---

## 🚨 Key Issues

### Issue 1: Answers are Removed Before Saving
**Location:** `removeAnswersFromContent()` in PartEditorPage

```typescript
const removeAnswersFromContent = (formData: any) => {
  // Removes correctAnswer from all questions
  const { correctAnswer, ...questionWithoutAnswer } = question
  return questionWithoutAnswer
}
```

**Problem:** When admin reloads, questions don't have answers, so form appears empty.

**Solution:** Save TWO versions:
- Admin version (WITH answers) for re-editing
- User version (WITHOUT answers) for display/preview

### Issue 2: Separate Answer Saving
**Location:** `handleAnswerChange()` in PartEditorPage

```typescript
await testManagementApi.saveQuestion(sectionId, partId, [answer])
```

**Problem:** This saves answers to a separate table, but:
- Not linked to specific question numbers
- Saving ALL answers as a single array
- No way to match answer to question when reloading

### Issue 3: Data Structure Mismatch
**Admin uses:** `questionGroups` array
**User expects:** flat `questions` array with `questionRange`

**Problem:** No transformation between formats.

---

## 💡 Proposed Solution

### Step 1: Add Admin Content Field

Add a new API endpoint or use a separate field:
- `content` - User format (without answers, for preview/testing)
- `adminContent` - Admin format (with answers, for editing)

OR

Store everything in `content` but separate by purpose:
```typescript
{
  admin: { ...adminFormat },
  user: { ...userFormat }
}
```

### Step 2: Save Complete Admin Data

```typescript
const handleSave = async () => {
  const values = await form.validateFields()
  
  // Save FULL admin data (with answers)
  const adminData = {
    admin: values,  // Keep everything including answers
    user: transformToUserFormat(values)  // Transform for display
  }
  
  await testManagementApi.savePartQuestionContent(partId, JSON.stringify(adminData))
}
```

### Step 3: Load Admin Data Properly

```typescript
const fetchPartContent = async () => {
  const response = await testManagementApi.getPartQuestionContent(partId)
  const content = JSON.parse(response.data.content)
  
  // Load admin format for editing
  if (content.admin) {
    form.setFieldsValue(content.admin)
  }
}
```

### Step 4: Create Transformation Utility

```typescript
// src/utils/transformListeningData.ts

export function transformAdminToUser(adminData: any): ListeningPart {
  return {
    id: adminData.partNumber || 1,
    title: `Part ${adminData.partNumber || 1}`,
    instruction: adminData.instruction || '',
    questionRange: parseQuestionRange(adminData.questionGroups),
    audioUrl: adminData.audioUrl || '',
    questions: flattenQuestionGroups(adminData.questionGroups)
  }
}

function flattenQuestionGroups(groups: any[]): any[] {
  const questions = []
  
  groups.forEach(group => {
    group.questions?.forEach(q => {
      questions.push({
        id: q.questionNumber,
        type: group.type,
        text: group.instruction || q.text,
        // No correctAnswer here
      })
    })
  })
  
  return questions
}
```

### Step 5: Fix Preview Mode

Create listening preview page that loads from API:

```typescript
// src/app/admin/reading/preview/[testId]/[sectionType]/page.tsx

if (sectionType === 'listening') {
  // Load parts
  // Transform from admin format to user format
  const transformedParts = parts.map(part => {
    const content = JSON.parse(part.content)
    return transformAdminToUser(content.user || content)
  })
  
  listeningStore.setParts(transformedParts)
}
```

---

## 🔧 Implementation Steps

1. **Update Part Editor Save** - Keep answers in saved content
2. **Update Part Editor Load** - Restore answers when loading
3. **Create Transformation Utility** - Convert admin ↔ user formats
4. **Update Preview Page** - Load listening data and transform
5. **Test Full Flow** - Create → Save → Reload → Preview

---

## 📋 API Changes Needed

### Option A: Use Existing Field Differently

Store JSON with both formats:
```json
{
  "admin": {
    "instruction": "...",
    "questionGroups": [...]
  },
  "user": {
    "id": 1,
    "title": "Part 1",
    "questions": [...]
  }
}
```

###Option B: Add New Field

Add `adminContent` field to Part table:
- `content` - User format (for preview/testing)
- `adminContent` - Admin format (for editing)

**Recommendation:** Option A (less DB changes)

---

## 🎯 Next Steps

1. Modify `handleSave` to save both formats
2. Modify `fetchPartContent` to load admin format
3. Create transformation utility
4. Update preview page for listening
5. Test complete workflow

---

## ✅ Success Criteria

- ✅ Create questions in admin → Save
- ✅ Close and reopen admin → Questions still there with answers
- ✅ Go to preview → See questions properly formatted
- ✅ Questions display correctly in listening test layout
- ✅ Answers are stored separately for checking (not in user format)
