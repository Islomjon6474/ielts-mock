export { MultipleChoiceQuestion } from './MultipleChoiceQuestion'
export { MultipleChoiceSingleQuestion } from './MultipleChoiceSingleQuestion'
export { TrueFalseQuestion } from './TrueFalseQuestion'
export { SentenceCompletionQuestion } from './SentenceCompletionQuestion'
export { MatchHeadingQuestion } from './MatchHeadingQuestion'
export { ShortAnswerQuestion } from './ShortAnswerQuestion'
export { MultipleCorrectAnswersQuestion } from './MultipleCorrectAnswersQuestion'
export { QuestionGroupEditor } from './QuestionGroupEditor'

export const questionTypes = [
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice (Multiple Answers)' },
  { value: 'MULTIPLE_CHOICE_SINGLE', label: 'Multiple Choice (Single Answer)' },
  { value: 'TRUE_FALSE_NOT_GIVEN', label: 'True/False/Not Given' },
  { value: 'YES_NO_NOT_GIVEN', label: 'Yes/No/Not Given' },
  { value: 'MATCH_HEADING', label: 'Match Headings' },
  { value: 'SHORT_ANSWER', label: 'Fill in the Blanks (Inline Placeholders)' },
  { value: 'MULTIPLE_CORRECT_ANSWERS', label: 'Multiple Correct Answers' },
  { value: 'IMAGE_INPUTS', label: 'Image with Inputs (Listening)' },
  { value: 'SENTENCE_COMPLETION', label: 'Sentence Completion (Drag & Drop)' },
]
