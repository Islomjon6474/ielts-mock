import { WritingTask } from '@/stores/WritingStore'

export const sampleWritingTest: WritingTask[] = [
  {
    id: 1,
    title: 'Part 1',
    timeMinutes: 20,
    minWords: 150,
    instruction: 'You should spend about 20 minutes on this task. Write at least 150 words.',
    question: `The chart below shows the number of adults participating in different major sports in one area, in 1997 and 2017.

Summarise the information by selecting and reporting the main features, and make comparisons where relevant.

Give reasons for your answer and include any relevant examples from your own knowledge or experience.`,
    image: '/download.png', // Optional: path to chart image
  },
  {
    id: 2,
    title: 'Part 2',
    timeMinutes: 40,
    minWords: 250,
    instruction: 'You should spend about 40 minutes on this task. Write at least 250 words.',
    question: `Write about the following topic:

The world of work is changing rapidly and employees cannot depend on having the same job or the same working conditions for life.

Discuss the possible causes for this rapid change, and suggest ways of preparing people for the world of work in the future.

Give reasons for your answer and include any relevant examples from your own knowledge or experience.`,
  },
]
