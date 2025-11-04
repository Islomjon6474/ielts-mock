export { MultipleChoiceQuestion } from './MultipleChoiceQuestion'
export { TrueFalseQuestion } from './TrueFalseQuestion'
export { SentenceCompletionQuestion } from './SentenceCompletionQuestion'
export { MatchHeadingQuestion } from './MatchHeadingQuestion'
export { ShortAnswerQuestion } from './ShortAnswerQuestion'
export { QuestionGroupEditor } from './QuestionGroupEditor'

export const questionTypes = [
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
  { value: 'TRUE_FALSE_NOT_GIVEN', label: 'True/False/Not Given' },
  { value: 'YES_NO_NOT_GIVEN', label: 'Yes/No/Not Given' },
  { value: 'MATCH_HEADING', label: 'Match Headings' },
  { value: 'SENTENCE_COMPLETION', label: 'Sentence Completion' },
  { value: 'SUMMARY_COMPLETION', label: 'Summary Completion' },
  { value: 'SHORT_ANSWER', label: 'Short Answer Questions' },
  { value: 'IMAGE_INPUTS', label: 'Image with Inputs (Listening)' },
]
