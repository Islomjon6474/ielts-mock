// Strongly-typed admin/user content structures used across admin and preview

export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'MULTIPLE_CHOICE_SINGLE'
  | 'MULTIPLE_QUESTIONS_MULTIPLE_CHOICE'
  | 'TRUE_FALSE_NOT_GIVEN'
  | 'YES_NO_NOT_GIVEN'
  | 'SENTENCE_COMPLETION'
  | 'SUMMARY_COMPLETION'
  | 'MATCH_HEADING'
  | 'SHORT_ANSWER'
  | 'MULTIPLE_CORRECT_ANSWERS'
  | 'MATRIX_TABLE'

export interface AdminQuestion {
  questionNumber?: number
  text?: string
  options?: string[] | string
  correctAnswer?: string
  correctAnswers?: string[] // For MULTIPLE_CORRECT_ANSWERS type
}

export interface AdminQuestionGroup {
  type: QuestionType | string
  range?: string
  instruction?: string
  headingOptions?: string
  imageId?: string
  questions?: AdminQuestion[] | string | Record<string, AdminQuestion>
  matrixOptions?: string[] // For MATRIX_TABLE type - column headers
}

export interface AdminPartContent {
  instruction?: string
  passage?: string
  imageId?: string
  questionGroups?: AdminQuestionGroup[] | string | Record<string, AdminQuestionGroup>
}

export interface UserPartContent {
  instruction?: string
  passage?: string
  questionGroups?: Omit<AdminQuestionGroup, 'correctAnswer'>[]
}

// Envelope persisted in DB
export interface PersistedPartContentEnvelope {
  admin?: AdminPartContent | string
  user?: UserPartContent | string
  // Backward compatibility: early records stored admin directly without envelope
  questionGroups?: AdminPartContent['questionGroups']
  instruction?: string
  passage?: string
}
