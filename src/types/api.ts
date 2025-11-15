// API Response and Request Types
// Based on OpenAPI 3.1.0 specification from https://mock.fleetoneld.com/ielts-mock-main/swagger-ui/index.html

// ============================================================================
// Generic Response Types
// ============================================================================

export interface ResponseDto<T> {
  success: boolean
  reason?: string
  count: number
  totalCount: number
  data: T
}

export type ResponseDtoObject = ResponseDto<any>
export type ResponseDtoUUID = ResponseDto<string>
export type ResponseDtoString = ResponseDto<string>

// ============================================================================
// Test Management Types
// ============================================================================

export interface TestDto {
  id: string
  name: string
  isActive: number // 0 = inactive, 1 = active
  createdDate: string // ISO 8601 date-time
  updatedDate: string // ISO 8601 date-time
}

export interface SectionDto {
  id: string
  sectionType: 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING'
  isActive: number // 0 = inactive, 1 = active
  updatedDate: string // ISO 8601 date-time
}

export interface PartDto {
  id: string
  ord: number // Order/position of part in section
  questionCount: number
}

export interface QuestionDto {
  id: string
  partId: string
  partOrd: number // Order of part
  answers: string[] // Correct answers
  ord: number // Order/position of question
}

export interface PartQuestionContentDto {
  content: string // JSON stringified content
}

export interface ListeningAudioDto {
  id: string
  fileId: string
  name: string
  contentType: string
  size: number
  ord?: number // Order/position of audio file in sequence
}

// ============================================================================
// Mock Submission Types (Student Test Taking)
// ============================================================================

export interface MockDto {
  id: string
  testId: string
  isFinished: number // 0 = in progress, 1 = finished
  status: string
  startDate: string // ISO 8601 date-time
  sections: SectionDto[]
}

export interface MockQuestionAnswerDto {
  questionOrd: number
  answer: string
}

// ============================================================================
// User Types
// ============================================================================

export interface UserDto {
  id: string
  firstName: string
  lastName: string
  username: string
  roles: string[] // e.g., ["USER"], ["ADMIN"], ["USER", "ADMIN"]
  createdDate: string // ISO 8601 date-time
  updatedDate: string // ISO 8601 date-time
}

export interface UserMeDto {
  id: string
  fullName: string
  username: string
  roles: string[]
}

// ============================================================================
// File Types
// ============================================================================

export interface FileDto {
  id: string
  name: string
  contentType: string
  size: number
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface TokenDto {
  token: string
}

export interface SignUpDto {
  firstName: string
  lastName: string
  username: string
  password: string
}

export interface SignInDto {
  username: string
  password: string
}

// ============================================================================
// Request DTOs
// ============================================================================

// Test Management Requests
export interface SaveTestReqDto {
  name: string
}

export interface UpdateActiveReqDto {
  id: string
  isActive: number
}

export interface SaveQuestionReqDto {
  sectionId: string
  partId: string
  ord: number
  answers: string[]
}

export interface AddQuestionReqDto {
  sectionId: string
  partId: string
  ord: number
  answers: string[]
}

export interface UpdateQuestionReqDto {
  id: string
  partId: string
  answers: string[]
}

export interface SavePartQuestionContentReqDto {
  partId: string
  content: string // JSON stringified
}

export interface SaveListeningAudioReqDto {
  testId: string
  fileId: string
}

export interface ChangeListeningAudioOrdReqDto {
  ids: string[] // Array of audio IDs in desired order
}

// Mock Submission Requests
export interface StartMockReqDto {
  testId?: string // Optional in API spec
}

export interface StartSectionReqDto {
  mockId: string
  sectionId: string
}

export interface SendAnswerReqDto {
  mockId: string
  sectionId: string
  questionOrd: number
  answer: string
}

export interface FinishSectionReqDto {
  mockId: string
  sectionId: string
}

// Mock Result Requests
export interface GradeWritingReqDto {
  mockId: string
  sectionId: string
  writingPartOneScore: number
  writingPartTwoScore: number
}

// User Management Requests
export interface SaveStudentReqDto {
  firstName: string
  lastName: string
  username: string
  password: string
}

export interface ChangePasswordReqDto {
  id: string
  password: string
}

// ============================================================================
// Response Type Aliases
// ============================================================================

export type ResponseDtoTestDto = ResponseDto<TestDto>
export type ResponseDtoListTestDto = ResponseDto<TestDto[]>

export type ResponseDtoSectionDto = ResponseDto<SectionDto>
export type ResponseDtoListSectionDto = ResponseDto<SectionDto[]>

export type ResponseDtoPartDto = ResponseDto<PartDto>
export type ResponseDtoListPartDto = ResponseDto<PartDto[]>

export type ResponseDtoQuestionDto = ResponseDto<QuestionDto>
export type ResponseDtoListQuestionDto = ResponseDto<QuestionDto[]>

export type ResponseDtoPartQuestionContentDto = ResponseDto<PartQuestionContentDto>

export type ResponseDtoListeningAudioDto = ResponseDto<ListeningAudioDto>
export type ResponseDtoListListeningAudioDto = ResponseDto<ListeningAudioDto[]>

export type ResponseDtoMockDto = ResponseDto<MockDto>
export type ResponseDtoListMockDto = ResponseDto<MockDto[]>

export type ResponseDtoMockQuestionAnswerDto = ResponseDto<MockQuestionAnswerDto>
export type ResponseDtoListMockQuestionAnswerDto = ResponseDto<MockQuestionAnswerDto[]>

export type ResponseDtoUserDto = ResponseDto<UserDto>
export type ResponseDtoListUserDto = ResponseDto<UserDto[]>

export type ResponseDtoUserMeDto = ResponseDto<UserMeDto>

export type ResponseDtoFileDto = ResponseDto<FileDto>

export type ResponseDtoTokenDto = ResponseDto<TokenDto>

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationParams {
  page: number // 0-indexed
  size: number // items per page
}

export interface PaginatedResponse<T> extends ResponseDto<T[]> {
  count: number // items in current page
  totalCount: number // total items across all pages
}

// ============================================================================
// Query Parameter Types
// ============================================================================

export interface GetAllUsersParams extends PaginationParams {
  username?: string
  fullName?: string
}

export interface GetAllQuestionsParams {
  sectionId: string
  partId?: string
}

export interface GetSubmittedAnswersParams {
  mockId: string
  sectionId: string
}

export interface GetAllSectionsParams {
  testId: string
  mockId?: string // Optional for mock-submission endpoint
}
