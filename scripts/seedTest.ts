/*
 Seed script to create a test and populate part contents (reading, listening, writing)
 - Uses public admin endpoints from Swagger
 - If sections/parts are not present (no creation endpoints exposed), the script will instruct to create them via Admin UI once, then re-run
*/

import axios from 'axios'

const BASE = 'https://mock.fleetoneld.com/ielts-mock-main'
const api = axios.create({ baseURL: BASE, headers: { 'Content-Type': 'application/json' } })

async function createTest(name: string) {
  const res = await api.post('/test-management/save', { name })
  return res.data?.data || res.data
}

async function getSections(testId: string) {
  const res = await api.get('/test-management/get-all-section', { params: { testId } })
  return res.data?.data || res.data || []
}

async function getParts(sectionId: string) {
  const res = await api.get('/test-management/get-all-part', { params: { sectionId } })
  return res.data?.data || res.data || []
}

async function savePartContent(partId: string, content: any) {
  const res = await api.post('/test-management/save-part-question-content', {
    partId,
    content: JSON.stringify(content),
  })
  return res.data
}

function makeListeningAdminPayload(partIndex: number) {
  // Build 10 questions per part with mixed types/groups
  const base = partIndex === 0 ? 1 : partIndex === 1 ? 11 : partIndex === 2 ? 21 : 31
  const groups: any[] = []

  if (partIndex === 0) {
    // Part 1: Notes completion (1-10)
    groups.push({
      type: 'FILL_IN_BLANK',
      range: `${base}-${base + 9}`,
      instruction: 'Complete the notes. Write ONE WORD AND/OR A NUMBER for each answer.',
      questions: Array.from({ length: 10 }, (_, i) => ({
        questionNumber: base + i,
        text: `Question ${base + i} text`,
      })),
    })
  } else if (partIndex === 1) {
    // Part 2: Matching (11-15) + Map labelling (16-20)
    groups.push({
      type: 'MATCHING',
      range: `${base}-${base + 4}`,
      instruction: 'Who is responsible for each area? Choose the correct letter.',
      questions: Array.from({ length: 5 }, (_, i) => ({
        questionNumber: base + i,
        text: `Match item ${i + 1}`,
        options: ['A', 'B', 'C', 'D', 'E', 'F'],
      })),
    })
    groups.push({
      type: 'MAP_LABEL',
      range: `${base + 5}-${base + 9}`,
      instruction: 'Label the map. Choose the correct place for each label.',
      questions: Array.from({ length: 5 }, (_, i) => ({
        questionNumber: base + 5 + i,
        text: `Map position ${i + 1}`,
        options: ['Cookery room', 'Games room', 'Kitchen', 'Pottery room', 'Sports complex', 'Staff accommodation'],
      })),
    })
    // Extra: IMAGE_INPUTS demo (still within 11-20 range if needed, but not used by transforms for range logic)
    groups.push({
      type: 'IMAGE_INPUTS',
      range: `${base + 5}-${base + 7}`,
      instruction: 'Look at the image and fill in the labels next to it.',
      questions: [
        { questionNumber: base + 5, text: 'Label A', imageUrl: '/map.svg' },
        { questionNumber: base + 6, text: 'Label B', imageUrl: '/map.svg' },
        { questionNumber: base + 7, text: 'Label C', imageUrl: '/map.svg' },
      ],
    })
  } else if (partIndex === 2) {
    // Part 3: Matching (21-25) + Flow chart (26-30)
    groups.push({
      type: 'MATCHING',
      range: `${base}-${base + 4}`,
      instruction: 'Match the items to their features.',
      questions: Array.from({ length: 5 }, (_, i) => ({
        questionNumber: base + i,
        text: `Match feature ${i + 1}`,
        options: ['A', 'B', 'C', 'D', 'E', 'F'],
      })),
    })
    groups.push({
      type: 'FLOW_CHART',
      range: `${base + 5}-${base + 9}`,
      instruction: 'Complete the flow chart.',
      questions: Array.from({ length: 5 }, (_, i) => ({
        questionNumber: base + 5 + i,
        text: `Step ${i + 1}`,
      })),
    })
  } else {
    // Part 4: MCQ (31-32), Table completion (33-37), Fill in blank (38-40)
    groups.push({
      type: 'MULTIPLE_CHOICE',
      range: `${base}-${base + 1}`,
      instruction: 'Choose the correct answer A, B, or C.',
      questions: Array.from({ length: 2 }, (_, i) => ({
        questionNumber: base + i,
        text: `MCQ ${base + i}`,
        options: ['A', 'B', 'C'],
      })),
    })
    groups.push({
      type: 'TABLE_COMPLETION',
      range: `${base + 2}-${base + 6}`,
      instruction: 'Complete the table. Write ONE WORD ONLY.',
      questions: Array.from({ length: 5 }, (_, i) => ({
        questionNumber: base + 2 + i,
        text: `Table cell ${i + 1}`,
      })),
    })
    groups.push({
      type: 'FILL_IN_BLANK',
      range: `${base + 7}-${base + 9}`,
      instruction: 'Complete the notes. Write ONE WORD ONLY.',
      questions: Array.from({ length: 3 }, (_, i) => ({
        questionNumber: base + 7 + i,
        text: `Note ${i + 1}`,
      })),
    })
  }

  return {
    instruction: `Listening Part ${partIndex + 1} instruction`,
    questionGroups: groups,
  }
}

function makeReadingAdminPayload(partIndex: number) {
  // 13 questions per part
  const start = partIndex === 0 ? 1 : 14
  const qs: any[] = []
  if (partIndex === 0) {
    // 1-5 MATCH_HEADING
    for (let i = 0; i < 5; i++) qs.push({ id: start + i, type: 'MATCH_HEADING', text: `Choose a heading for Section ${i + 1}` })
    // 6-10 TRUE_FALSE_NOT_GIVEN
    for (let i = 5; i < 10; i++) qs.push({ id: start + i, type: 'TRUE_FALSE_NOT_GIVEN', text: `Statement ${start + i}`, options: ['TRUE', 'FALSE', 'NOT GIVEN'] })
    // 11-13 FILL_IN_BLANK
    for (let i = 10; i < 13; i++) qs.push({ id: start + i, type: 'FILL_IN_BLANK', text: `Complete sentence ${start + i}` })
  } else {
    // 14-20 MULTIPLE_CHOICE (7)
    for (let i = 0; i < 7; i++) qs.push({ id: start + i, type: 'MULTIPLE_CHOICE', text: `MCQ ${start + i}`, options: ['A', 'B', 'C', 'D'] })
    // 21-23 MATCH_HEADING (3)
    for (let i = 7; i < 10; i++) qs.push({ id: start + i, type: 'MATCH_HEADING', text: `Choose heading for paragraph ${i - 6}` })
    // 24-26 FILL_IN_BLANK (3)
    for (let i = 10; i < 13; i++) qs.push({ id: start + i, type: 'FILL_IN_BLANK', text: `Complete sentence ${start + i}` })
  }
  return {
    title: `Reading Part ${partIndex + 1}`,
    instruction: 'Read the passage and answer the questions.',
    passage: `This is a sample passage for reading part ${partIndex + 1}.\nIt has multiple paragraphs.`,
    sections: [
      { number: 1, content: 'Section A content' },
      { number: 2, content: 'Section B content' },
    ],
    questions: qs,
    questionRange: [start, start + 12] as [number, number],
  }
}

function makeWritingAdminPayload(partIndex: number) {
  const isTask1 = partIndex === 0
  return {
    title: isTask1 ? 'Writing Task 1' : 'Writing Task 2',
    timeMinutes: isTask1 ? 20 : 40,
    minWords: isTask1 ? 150 : 250,
    instruction: isTask1
      ? 'Summarize the information presented in the chart.'
      : 'Write an essay presenting arguments on the given topic.',
    question: isTask1
      ? 'The chart below shows the number of visitors to three museums between 2010 and 2015.'
      : 'Some people think that governments should invest more in public services than in the arts. To what extent do you agree or disagree?'
  }
}

function makeEnvelope(admin: any) {
  // user payload is admin with answers removed where applicable
  const user = JSON.parse(JSON.stringify(admin))
  if (user?.questionGroups) {
    user.questionGroups.forEach((g: any) => {
      if (Array.isArray(g.questions)) {
        g.questions.forEach((q: any) => delete q.correctAnswer)
      }
    })
  }
  return { admin, user }
}

async function seed() {
  console.log('Creating test...')
  const testId = await createTest(`Auto Test ${new Date().toISOString()}`)
  console.log('Test created:', testId)

  const sections = await getSections(testId)
  if (!sections || sections.length === 0) {
    console.warn('No sections returned for this test. Create Listening/Reading/Writing sections and at least one part per section in Admin, then re-run this script.')
    return
  }

  const byType = (t: string) => sections.find((s: any) => String(s.sectionType).toLowerCase() === t)
  const listening = byType('listening')
  const reading = byType('reading')
  const writing = byType('writing')

  for (const [sec, maker] of [
    [listening, makeListeningAdminPayload],
    [reading, makeReadingAdminPayload],
    [writing, makeWritingAdminPayload],
  ] as const) {
    if (!sec) {
      console.warn('Missing section:', sec)
      continue
    }
    const parts = await getParts(sec.id)
    console.log(`Section ${sec.sectionType} parts:`, parts.map((p: any) => p.id))
    if (!parts || parts.length === 0) {
      console.warn(`No parts for ${sec.sectionType}. Create at least one part in Admin and re-run.`)
      continue
    }

    for (let i = 0; i < parts.length; i++) {
      const adminPayload = maker(i)
      const envelope = makeEnvelope(adminPayload)
      console.log(`Saving content for part ${parts[i].id} (${sec.sectionType})...`)
      await savePartContent(parts[i].id, envelope)
      console.log('Saved.')
    }
  }

  console.log('Seeding complete.')
}

seed().catch((e) => {
  console.error('Seed failed:', e?.response?.data || e)
  process.exit(1)
})
