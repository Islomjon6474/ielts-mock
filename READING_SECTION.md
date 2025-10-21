# Reading Section Documentation

## Overview

The Reading section implements a comprehensive IELTS Reading test interface with all the features shown in the design mockups.

## Features Implemented

### ✅ Layout Structure
- **Resizable Split Pane**: Draggable divider between passage and questions (left-right split)
- **3-Part Navigation**: Bottom bar with Part 1, Part 2, Part 3 tabs
- **Question Navigation**: Numbered buttons showing all questions in current part
- **Answer Highlighting**: Questions with answers are highlighted in blue
- **Navigation Buttons**: Left/Right arrows for question navigation

### ✅ Question Types

1. **TRUE/FALSE/NOT GIVEN**
   - Radio button selection
   - Clear instructions
   - Question number display

2. **Fill in the Blank**
   - Input fields integrated into question text
   - Supports multiple blanks per question
   - "ONE WORD ONLY" instruction

3. **Match the Heading**
   - Dropdown selection for heading
   - List of available headings
   - Visual feedback for selected heading

4. **Multiple Choice (Choose TWO)**
   - Checkbox selection
   - Limits to maximum answers (2)
   - Counter showing selected/total

### ✅ State Management (MobX)

**ReadingStore** manages:
- Current part and question index
- Answer storage (Map of questionId → answer)
- Navigation (next/previous question, go to specific question)
- Question state (answered/unanswered)

### ✅ Components Structure

```
src/
├── app/
│   └── reading/
│       └── page.tsx                    # Main reading page
├── components/
│   └── reading/
│       ├── ReadingTestLayout.tsx       # Main layout with split panes
│       ├── ReadingPassage.tsx          # Left pane - passage display
│       ├── QuestionPanel.tsx           # Right pane - question renderer
│       ├── BottomNavigation.tsx        # Part/question navigation bar
│       └── questions/
│           ├── TrueFalseQuestion.tsx
│           ├── FillInBlankQuestion.tsx
│           ├── MatchHeadingQuestion.tsx
│           └── MultipleChoiceQuestion.tsx
├── stores/
│   └── ReadingStore.ts                 # MobX store for reading state
└── data/
    └── sampleReadingTest.ts            # Sample test data
```

## Data Structure

### Part Interface
```typescript
interface Part {
  id: number
  title: string
  instruction: string
  passage: string
  questions: Question[]
  questionRange: [number, number]
}
```

### Question Interface
```typescript
interface Question {
  id: number
  type: 'TRUE_FALSE_NOT_GIVEN' | 'FILL_IN_BLANK' | 'MATCH_HEADING' | 'MULTIPLE_CHOICE'
  text: string
  options?: string[]
  maxAnswers?: number
}
```

## Key Features

### Resizable Pane
- Click and drag the gray divider to resize
- Constrained between 20% and 80% width
- Smooth dragging experience

### Bottom Navigation
- **Part Tabs**: Click to switch between Part 1, 2, 3
- **Progress Counter**: Shows "X of Y" answered questions
- **Question Numbers**: Click any number to jump to that question
- **Visual Feedback**: 
  - Current question: Black border
  - Answered questions: Blue background
  - Unanswered: White background

### Navigation Buttons
- **Left Arrow**: Go to previous question
- **Right Arrow**: Go to next question
- Automatically switches parts when reaching end
- Disabled when at first/last question

## Sample Data

The `sampleReadingTest.ts` includes:
- **Part 1**: Marie Curie passage (13 questions)
  - TRUE/FALSE/NOT GIVEN (Q1-6)
  - Fill in the blank (Q7-13)
  
- **Part 2**: Physics of Traffic (13 questions)
  - Match headings (Q14-17)
  - Multiple choice - Choose TWO (Q18-21)
  - TRUE/FALSE/NOT GIVEN (Q22-26)
  
- **Part 3**: Plain English (14 questions)
  - Fill in the blank (Q27-33)
  - TRUE/FALSE/NOT GIVEN (Q34-37, Q40)
  - Multiple choice - Choose TWO (Q38-39)

## Usage

1. Navigate to `/reading` to start the test
2. Read the passage on the left
3. Answer questions on the right
4. Use bottom navigation to switch parts/questions
5. Use arrow buttons for sequential navigation
6. Submit when complete

## Styling

- Uses **Ant Design** components for UI consistency
- **Tailwind CSS** for custom styling
- Red header matching IELTS branding
- Responsive layout (works on different screen sizes)

## Future Enhancements

Potential improvements:
- Timer functionality
- Result calculation and scoring
- Drag-and-drop for match heading questions
- Highlight/note-taking in passage
- Review mode after submission
- Save progress functionality
- Multiple test sets
