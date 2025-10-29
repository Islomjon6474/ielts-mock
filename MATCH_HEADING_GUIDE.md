# Match Heading Question Type - Complete Guide

## Overview
Match Heading questions require students to match headings to sections/paragraphs in a passage. This is a common IELTS Reading question type.

---

## 📖 How It Works in IELTS

### Example:

**Instructions:**
"The reading passage has six sections, A-F. Choose the correct heading for each section from the list of headings below."

**List of Headings:**
- i. Introduction to solar energy
- ii. Cost comparison with fossil fuels
- iii. Environmental benefits
- iv. Technological advancements
- v. Government policies and incentives
- vi. Future predictions
- vii. Challenges and limitations

**Questions:**
```
Question 14: Section A → Answer: i
Question 15: Section B → Answer: iii
Question 16: Section C → Answer: ii
Question 17: Section D → Answer: v
Question 18: Section E → Answer: vii
Question 19: Section F → Answer: vi
```

---

## 🔧 Data Structure

### JSON Format

```json
{
  "questionGroups": [
    {
      "type": "MATCH_HEADING",
      "range": "14-19",
      "instruction": "The reading passage has six sections, A-F. Choose the correct heading for each section from the list of headings below.",
      "headingOptions": "i. Introduction to solar energy\nii. Cost comparison with fossil fuels\niii. Environmental benefits\niv. Technological advancements\nv. Government policies and incentives\nvi. Future predictions\nvii. Challenges and limitations",
      "questions": [
        {
          "sectionId": "A",
          // correctAnswer saved separately: "i"
        },
        {
          "sectionId": "B",
          // correctAnswer saved separately: "iii"
        },
        {
          "sectionId": "C",
          // correctAnswer saved separately: "ii"
        },
        {
          "sectionId": "D",
          // correctAnswer saved separately: "v"
        },
        {
          "sectionId": "E",
          // correctAnswer saved separately: "vii"
        },
        {
          "sectionId": "F",
          // correctAnswer saved separately: "vi"
        }
      ]
    }
  ]
}
```

---

## 🎯 Admin Side - How to Create

### Step 1: Create Question Group
1. Select question type: **"Match Headings"**
2. Set question range: **"14-19"**
3. Enter instructions

### Step 2: Enter Available Headings
In the **"Available Headings"** field, enter all headings (one per line):
```
i. Introduction to solar energy
ii. Cost comparison with fossil fuels
iii. Environmental benefits
iv. Technological advancements
v. Government policies and incentives
vi. Future predictions
vii. Challenges and limitations
```

**Important Notes:**
- Include the Roman numeral (i, ii, iii, etc.)
- One heading per line
- Usually 7-10 headings with 5-6 questions

### Step 3: Add Questions (Sections)
For each section in the passage, add a question:

**Question 1 (Section A):**
- Section Identifier: **A**
- Correct Heading: **i**

**Question 2 (Section B):**
- Section Identifier: **B**
- Correct Heading: **iii**

...and so on

---

## 👨‍🎓 User Side - How to Display

### Layout

```
┌─────────────────────────────────────────────┐
│  List of Headings:                          │
│  i. Introduction to solar energy            │
│  ii. Cost comparison with fossil fuels      │
│  iii. Environmental benefits                │
│  iv. Technological advancements             │
│  v. Government policies and incentives      │
│  vi. Future predictions                     │
│  vii. Challenges and limitations            │
│                                             │
│  Question 14: Section A  [Dropdown ▼]       │
│  Question 15: Section B  [Dropdown ▼]       │
│  Question 16: Section C  [Dropdown ▼]       │
│  Question 17: Section D  [Dropdown ▼]       │
│  Question 18: Section E  [Dropdown ▼]       │
│  Question 19: Section F  [Dropdown ▼]       │
└─────────────────────────────────────────────┘
```

### Implementation

```tsx
// Parse heading options
const headingOptions = questionGroup.headingOptions
  .split('\n')
  .filter(line => line.trim())
  .map(line => {
    const match = line.match(/^([ivx]+)\.\s*(.+)$/i)
    return match ? { value: match[1], label: line } : null
  })
  .filter(Boolean)

// Render
<div>
  <div className="headings-list">
    <h4>List of Headings:</h4>
    {headingOptions.map(heading => (
      <div key={heading.value}>{heading.label}</div>
    ))}
  </div>

  {questionGroup.questions.map((question, index) => (
    <div key={index} className="question">
      <span>Question {questionNumber + index}: Section {question.sectionId}</span>
      <Select
        placeholder="Choose a heading"
        options={headingOptions}
        onChange={(value) => handleAnswer(questionNumber + index, value)}
      />
    </div>
  ))}
</div>
```

---

## 🗂️ Passage Structure

For Match Heading questions, the passage should be clearly divided into labeled sections:

```
Section A
[Paragraph text about introduction...]

Section B
[Paragraph text about environmental benefits...]

Section C
[Paragraph text about cost comparison...]

Section D
[Paragraph text about government policies...]

Section E
[Paragraph text about challenges...]

Section F
[Paragraph text about future predictions...]
```

### Admin Note:
Make sure to label sections in the passage text (A, B, C, etc.) so students know which section each heading should match to.

---

## 🎨 Heading Format Guidelines

### Do:
✅ Use Roman numerals: i, ii, iii, iv, v, vi, vii, viii, ix, x
✅ Be concise but clear (5-10 words)
✅ Make headings distinct from each other
✅ Include more headings than sections (e.g., 7 headings for 5 sections)

### Don't:
❌ Don't use Arabic numbers (1, 2, 3)
❌ Don't make headings too similar
❌ Don't make headings too long (>15 words)
❌ Don't use the exact wording from the passage

### Good Examples:
```
i. Historical development of the technology
ii. Economic advantages over alternatives
iii. Environmental impact assessment
iv. Current usage in different countries
v. Future technological improvements
vi. Barriers to widespread adoption
vii. Government regulation and support
```

### Bad Examples:
```
i. This section talks about history (❌ too informal)
ii. Money (❌ too vague)
iii. The passage discusses environmental issues (❌ too long)
iv. Economic advantages (✅ but too similar to ii)
```

---

## 💾 Data Flow

### Save Flow:
```
1. Admin enters headings in "Available Headings" field
   → Saved in questionGroup.headingOptions

2. Admin creates questions (Section A, B, C...)
   → Saved in questionGroup.questions[]

3. Admin selects correct heading for each section
   → Saved separately via API (not in content JSON)
```

### Load Flow (User Side):
```
1. Fetch content JSON
   → Get headingOptions and questions

2. Parse headingOptions into dropdown options
   → Split by \n, parse Roman numerals

3. Display headings list

4. Display questions with section IDs

5. Student selects heading for each section

6. Submit answers
   → Server validates against stored correct answers
```

---

## 🧪 Testing

### Admin Side Test:
```
1. Create Match Heading question group
2. Enter 7 headings in "Available Headings"
3. Add 5 questions (Sections A-E)
4. Set correct heading for each (i, iii, ii, v, vii)
5. Save content
6. Verify: headingOptions in JSON
7. Verify: No correctAnswer in questions
8. Verify: Answers saved separately
```

### User Side Test:
```
1. Load match heading questions
2. Verify: List of headings displays
3. Verify: 7 heading options in dropdown
4. Verify: 5 questions (Section A-E) display
5. Select heading for Section A
6. Verify: Selection saved
7. Submit test
8. Verify: Answers validated correctly
```

---

## 📊 Example Test Case

**Passage Topic:** "The History of Coffee"

**Sections:** A, B, C, D, E

**Headings:**
```
i. The origins of coffee cultivation
ii. Coffee's journey to Europe
iii. The rise of coffee houses
iv. Modern coffee production methods
v. Health benefits and concerns
vi. The global coffee trade
vii. Cultural significance in different societies
```

**Correct Answers:**
- Section A → i (Origins)
- Section B → ii (Journey to Europe)
- Section C → iii (Coffee houses)
- Section D → vi (Global trade)
- Section E → v (Health)

**Extra Headings (not used):**
- iv, vii (Distractors)

---

## 🔑 Key Points

1. **Group Level:** Headings are defined at question group level
2. **Question Level:** Each question has section ID and correct heading
3. **More Options:** Always provide more headings than questions
4. **Clear Labels:** Label sections clearly in the passage
5. **Parse Format:** User side must parse "i. Text" format
6. **Dropdown UI:** Use Select/Dropdown for user interface
7. **Security:** Correct answers stored separately from content

---

**Implementation Date:** October 29, 2025
**Status:** ✅ Complete - Ready for Testing
