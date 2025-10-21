import { ListeningPart } from '@/stores/ListeningStore'

export const sampleListeningTest: ListeningPart[] = [
  {
    id: 1,
    title: 'Part 1',
    instruction: 'Listen and answer questions 1–10.',
    questionRange: [1, 10],
    audioUrl: '/IELTS_MOCK_SAMPLE.mp3',
    questions: [
      {
        id: 1,
        type: 'FILL_IN_BLANK',
        text: 'Questions 1–10\n\nComplete the notes. Write ONE WORD AND/OR A NUMBER for each answer.\n\nPhone call about second-hand furniture\n\nItems:\n\nDining table:       - [1] shape\n                    - medium size\n                    - [2] old\n                    - price: £25.00\n\nDining chairs:      - set of [3] chairs\n                    - seats covered in [4] material\n                    - in [5] condition\n                    - price: £20.00\n\nDesk:               - length: 1 metre 20\n                    - 3 drawers. Top drawer has a [6].\n                    - price: £ [7]\n\n\nAddress:\n\n            [8] Old Lane, Stonethorpe\n\n\nDirections:\n\n            Take the Havcroft road out of Stonethorpe. Go past the secondary school, then turn [9] at the crossroads. House is down this road, opposite the [10].',
      },
    ],
  },
  {
    id: 2,
    title: 'Part 2',
    instruction: 'Questions 11–20',
    questionRange: [11, 20],
    audioUrl: '/IELTS_MOCK_SAMPLE.mp3',
    questions: [
      {
        id: 11,
        type: 'MATCHING',
        text: 'Questions 11–15\n\nWho is responsible for each area? Choose the correct answer for each person and move it into the gap.',
      },
      {
        id: 16,
        type: 'MATCHING',
        text: 'Questions 16–20\n\nLabel the map. Choose the correct answer and move it into the gap.',
      },
    ],
  },
  {
    id: 3,
    title: 'Part 3',
    instruction: 'Listen and answer questions 21–30.',
    questionRange: [21, 30],
    audioUrl: '/IELTS_MOCK_SAMPLE.mp3',
    questions: [
      {
        id: 21,
        type: 'MATCHING',
        text: 'Questions 21–25\n\nWhich feature do the speakers identify for each of the following categories of fossil? Choose the correct answer for each fossil category and move it into the gap.',
      },
      {
        id: 26,
        type: 'MATCHING',
        text: 'Questions 26–30\n\nComplete the flow-chart. Choose the correct answer and move it into the gap.',
      },
    ],
  },
  {
    id: 4,
    title: 'Part 4',
    instruction: 'Listen and answer questions 31–40.',
    questionRange: [31, 40],
    audioUrl: '/IELTS_MOCK_SAMPLE.mp3',
    questions: [
      {
        id: 31,
        type: 'MULTIPLE_CHOICE',
        text: 'Questions 31–32\n\nChoose the correct answer.',
      },
      {
        id: 33,
        type: 'TABLE',
        text: 'Questions 33–37\n\nComplete the table. Write ONE WORD ONLY for each answer.',
      },
      {
        id: 38,
        type: 'FILL_IN_BLANK',
        text: 'Questions 38–40\n\nComplete the notes. Write ONE WORD ONLY for each answer.',
      },
    ],
  },
]
