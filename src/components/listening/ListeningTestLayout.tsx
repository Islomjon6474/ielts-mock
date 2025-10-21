'use client'

import { useState, useRef, useEffect } from 'react'
import { Layout, Input } from 'antd'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/navigation'
import { useStore } from '@/stores/StoreContext'
import Header from '@/components/common/Header'
import BottomNavigationComponent from '@/components/common/BottomNavigation'
import AudioInstructionModal from './AudioInstructionModal'
import MapDiagramQuestion from './MapDiagramQuestion'
import TableQuestion from './TableQuestion'
import MatchingQuestion from './MatchingQuestion'
import MapLabelingQuestion from './MapLabelingQuestion'
import FlowChartQuestion from './FlowChartQuestion'
import SubmitModal from '@/components/common/SubmitModal'

const { Content } = Layout

const ListeningTestLayout = observer(() => {
  const { listeningStore } = useStore()
  const router = useRouter()
  const [showModal, setShowModal] = useState(true)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const currentPart = listeningStore.currentPartData

  // Play/pause audio based on isPlaying state
  useEffect(() => {
    if (listeningStore.hasStarted && audioRef.current) {
      if (listeningStore.isPlaying) {
        audioRef.current.play()
      } else {
        audioRef.current.pause()
      }
    }
  }, [listeningStore.isPlaying, listeningStore.hasStarted])

  // Update audio source when part changes
  useEffect(() => {
    if (audioRef.current && currentPart?.audioUrl) {
      audioRef.current.src = currentPart.audioUrl
      if (listeningStore.hasStarted && listeningStore.isPlaying) {
        audioRef.current.play()
      }
    }
  }, [currentPart?.audioUrl, listeningStore.hasStarted, listeningStore.isPlaying])

  // Check if parts are loaded
  if (!listeningStore.parts || listeningStore.parts.length === 0) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  const handleStart = () => {
    setShowModal(false)
    listeningStore.setHasStarted(true)
    listeningStore.setIsPlaying(true)
    // Play audio after modal closes
    setTimeout(() => {
      audioRef.current?.play()
    }, 100)
  }

  const handlePartClick = (partNumber: number) => {
    listeningStore.setCurrentPart(partNumber)
  }

  const handleQuestionClick = (questionNumber: number) => {
    listeningStore.goToQuestion(questionNumber)
  }

  const handleSubmit = () => {
    setShowSubmitModal(true)
  }

  const handleModalClose = () => {
    setShowSubmitModal(false)
  }

  const handleModalConfirm = () => {
    setShowSubmitModal(false)
    router.push('/')
  }

  if (!currentPart) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <Layout className="h-screen flex flex-col">
      {/* Hidden Audio Player */}
      <audio ref={audioRef} style={{ display: 'none' }} />
      
      <Header />

      {/* Test Info Header */}
      <div className="bg-gray-50 px-6 py-2 border-b flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold">Test taker ID</span>
        </div>
        {listeningStore.isPlaying && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-700">Audio is playing</span>
          </div>
        )}
      </div>

      {/* Part Info */}
      <div className="bg-white px-6 py-3 border-b">
        <h2 className="font-bold text-base text-black mb-1">{currentPart.title}</h2>
        <p className="text-sm text-gray-700">{currentPart.instruction}</p>
      </div>

      {/* Main Content */}
      <Content className="flex-1 overflow-y-auto bg-gray-200 flex justify-center py-6">
        <div className="w-[70%] max-w-[1200px] bg-white px-8 py-6 shadow-lg overflow-x-auto">
          {/* Render questions based on part */}
          <div>
            {/* Part 1: Fill in the blank questions */}
            {currentPart.id === 1 && (
              <div className="space-y-4">
                <h3 className="font-bold text-base mb-2">Questions 1–10</h3>
                <p className="text-sm mb-4">
                  Complete the notes. Write <span className="font-bold">ONE WORD AND/OR A NUMBER</span> for each answer.
                </p>
                
                <p className="font-semibold text-sm mb-4">Phone call about second-hand furniture</p>
                
                <p className="font-semibold text-sm mb-2">Items:</p>
                
                {/* Dining table */}
                <div className="mb-6">
                  <div className="flex items-start gap-16">
                    <span className="font-semibold text-sm w-32">Dining table:</span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span>-</span>
                        <Input
                          value={listeningStore.getAnswer(1) as string || ''}
                          onChange={(e) => listeningStore.setAnswer(1, e.target.value)}
                          placeholder="1"
                          className="inline-block mx-2 text-center"
                          style={{ width: '120px' }}
                        />
                        <span>shape</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>-</span>
                        <span>medium size</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>-</span>
                        <Input
                          value={listeningStore.getAnswer(2) as string || ''}
                          onChange={(e) => listeningStore.setAnswer(2, e.target.value)}
                          placeholder="2"
                          className="inline-block mx-2 text-center"
                          style={{ width: '120px' }}
                        />
                        <span>old</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>-</span>
                        <span>price: £25.00</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dining chairs */}
                <div className="mb-6">
                  <div className="flex items-start gap-16">
                    <span className="font-semibold text-sm w-32">Dining chairs:</span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span>-</span>
                        <span>set of</span>
                        <Input
                          value={listeningStore.getAnswer(3) as string || ''}
                          onChange={(e) => listeningStore.setAnswer(3, e.target.value)}
                          placeholder="3"
                          className="inline-block mx-2 text-center"
                          style={{ width: '120px' }}
                        />
                        <span>chairs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>-</span>
                        <span>seats covered in</span>
                        <Input
                          value={listeningStore.getAnswer(4) as string || ''}
                          onChange={(e) => listeningStore.setAnswer(4, e.target.value)}
                          placeholder="4"
                          className="inline-block mx-2 text-center"
                          style={{ width: '120px' }}
                        />
                        <span>material</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>-</span>
                        <span>in</span>
                        <Input
                          value={listeningStore.getAnswer(5) as string || ''}
                          onChange={(e) => listeningStore.setAnswer(5, e.target.value)}
                          placeholder="5"
                          className="inline-block mx-2 text-center"
                          style={{ width: '120px' }}
                        />
                        <span>condition</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>-</span>
                        <span>price: £20.00</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desk */}
                <div className="mb-8">
                  <div className="flex items-start gap-16">
                    <span className="font-semibold text-sm w-32">Desk:</span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span>-</span>
                        <span>length: 1 metre 20</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>-</span>
                        <span>3 drawers. Top drawer has a</span>
                        <Input
                          value={listeningStore.getAnswer(6) as string || ''}
                          onChange={(e) => listeningStore.setAnswer(6, e.target.value)}
                          placeholder="6"
                          className="inline-block mx-2 text-center"
                          style={{ width: '120px' }}
                        />
                        <span>.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>-</span>
                        <span>price: £</span>
                        <Input
                          value={listeningStore.getAnswer(7) as string || ''}
                          onChange={(e) => listeningStore.setAnswer(7, e.target.value)}
                          placeholder="7"
                          className="inline-block mx-2 text-center"
                          style={{ width: '120px' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="mb-6">
                  <p className="font-semibold text-sm mb-2">Address:</p>
                  <div className="flex items-center gap-2 ml-20">
                    <Input
                      value={listeningStore.getAnswer(8) as string || ''}
                      onChange={(e) => listeningStore.setAnswer(8, e.target.value)}
                      placeholder="8"
                      className="inline-block mx-2 text-center"
                      style={{ width: '120px' }}
                    />
                    <span>Old Lane, Stonethorpe</span>
                  </div>
                </div>

                {/* Directions */}
                <div className="mb-6">
                  <p className="font-semibold text-sm mb-2">Directions:</p>
                  <div className="ml-20">
                    <p className="text-sm">
                      Take the Havcroft road out of Stonethorpe. Go past the secondary school, then turn{' '}
                      <Input
                        value={listeningStore.getAnswer(9) as string || ''}
                        onChange={(e) => listeningStore.setAnswer(9, e.target.value)}
                        placeholder="9"
                        className="inline-block mx-2 text-center"
                        style={{ width: '120px' }}
                      />
                      {' '}at the crossroads. House is down this road, opposite the{' '}
                      <Input
                        value={listeningStore.getAnswer(10) as string || ''}
                        onChange={(e) => listeningStore.setAnswer(10, e.target.value)}
                        placeholder="10"
                        className="inline-block mx-2 text-center"
                        style={{ width: '120px' }}
                      />
                      {' '}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Part 2: Matching and Map Labeling */}
            {currentPart.id === 2 && (
              <div className="space-y-8">
                {/* Questions 11-15: Matching */}
                <MatchingQuestion
                  questionStart={11}
                  questionEnd={15}
                  leftItems={[
                    { id: 11, label: 'Mary Brown' },
                    { id: 12, label: 'John Stevens' },
                    { id: 13, label: 'Alison Jones' },
                    { id: 14, label: 'Tim Smith' },
                    { id: 15, label: 'Jenny James' }
                  ]}
                  rightOptions={[
                    'Finance',
                    'Food',
                    'Health',
                    'Kids\' Counselling',
                    'Organisation',
                    'Rooms',
                    'Sport',
                    'Trips'
                  ]}
                  instruction="Who is responsible for each area? Choose the correct answer for each person and move it into the gap."
                  title="Questions 11–15"
                />

                {/* Questions 16-20: Map Labeling */}
                <MapLabelingQuestion
                  positions={[
                    { id: 16, label: '16' },
                    { id: 17, label: '17' },
                    { id: 18, label: '18' },
                    { id: 19, label: '19' },
                    { id: 20, label: '20' }
                  ]}
                  options={[
                    'Cookery room',
                    'Games room',
                    'Kitchen',
                    'Pottery room',
                    'Sports complex',
                    'Staff accommodation'
                  ]}
                  instruction="Label the map. Choose the correct answer and move it into the gap."
                  title="Questions 16–20"
                  mapUrl="/map.svg"
                />
              </div>
            )}

            {/* Part 3: Matching and Flow Chart */}
            {currentPart.id === 3 && (
              <div className="space-y-8">
                {/* Questions 21-25: Matching */}
                <MatchingQuestion
                  questionStart={21}
                  questionEnd={25}
                  leftItems={[
                    { id: 21, label: 'Impression fossils' },
                    { id: 22, label: 'Cast fossils' },
                    { id: 23, label: 'Permineralisation fossils' },
                    { id: 24, label: 'Compaction fossils' },
                    { id: 25, label: 'Fusion fossils' }
                  ]}
                  rightOptions={[
                    'They are a new type of fossil best.',
                    'They do not contain any organic matter.',
                    'They are found in soft, wet ground.',
                    'They can be found in their normal fossil areas.',
                    'They are three-dimensional.',
                    'They provide information about plant cells.'
                  ]}
                  instruction="Which feature do the speakers identify for each of the following categories of fossil? Choose the correct answer for each fossil category and move it into the gap."
                  title="Questions 21–25"
                />

                {/* Questions 26-30: Flow Chart */}
                <FlowChartQuestion
                  questionStart={26}
                  questionEnd={30}
                  options={[
                    'contamination',
                    'vehicle',
                    'head',
                    'results',
                    'radiation',
                    'site',
                    'microbes',
                    'water'
                  ]}
                  instruction="Complete the flow-chart. Choose the correct answer and move it into the gap."
                  title="Questions 26–30"
                />
              </div>
            )}

            {/* Part 4: Multiple choice, Table, and Fill in blank */}
            {currentPart.id === 4 && (
              <div className="space-y-6">
                {/* Questions 31-32: Multiple Choice */}
                <div>
                  <h3 className="font-bold text-base mb-2">Questions 31–32</h3>
                  <p className="text-sm mb-4">Choose the correct answer.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm mb-2"><span className="font-bold">31</span> Participants in the Learner Persistence study were all drawn from the same</p>
                      <div className="ml-6 space-y-1">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="q31"
                            value="age group"
                            checked={listeningStore.getAnswer(31) === 'age group'}
                            onChange={(e) => listeningStore.setAnswer(31, e.target.value)}
                          />
                          age group.
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="q31"
                            value="geographical area"
                            checked={listeningStore.getAnswer(31) === 'geographical area'}
                            onChange={(e) => listeningStore.setAnswer(31, e.target.value)}
                          />
                          geographical area.
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="q31"
                            value="socio-economic level"
                            checked={listeningStore.getAnswer(31) === 'socio-economic level'}
                            onChange={(e) => listeningStore.setAnswer(31, e.target.value)}
                          />
                          socio-economic level.
                        </label>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm mb-2"><span className="font-bold">32</span> The study showed that when starting their course, older students were most concerned about</p>
                      <div className="ml-6 space-y-1">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="q32"
                            value="effects on their home life"
                            checked={listeningStore.getAnswer(32) === 'effects on their home life'}
                            onChange={(e) => listeningStore.setAnswer(32, e.target.value)}
                          />
                          effects on their home life.
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="q32"
                            value="implications for their future career"
                            checked={listeningStore.getAnswer(32) === 'implications for their future career'}
                            onChange={(e) => listeningStore.setAnswer(32, e.target.value)}
                          />
                          implications for their future career.
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="q32"
                            value="financial constraints"
                            checked={listeningStore.getAnswer(32) === 'financial constraints'}
                            onChange={(e) => listeningStore.setAnswer(32, e.target.value)}
                          />
                          financial constraints.
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Questions 33-37: Table */}
                <div>
                  <h3 className="font-bold text-base mb-2">Questions 33–37</h3>
                  <p className="text-sm mb-4">Complete the table. Write <span className="font-bold">ONE WORD ONLY</span> for each answer.</p>
                  
                  <table className="w-full border-collapse border border-black">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black p-2 text-sm font-bold text-center" colSpan={4}>Research findings</th>
                      </tr>
                      <tr className="bg-gray-50">
                        <th className="border border-black p-2 text-sm font-semibold"></th>
                        <th className="border border-black p-2 text-sm font-semibold">Social and Environmental Factors</th>
                        <th className="border border-black p-2 text-sm font-semibold">Other Factors</th>
                        <th className="border border-black p-2 text-sm font-semibold">Personal Characteristics</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black p-2 text-sm font-semibold">First level of importance</td>
                        <td className="border border-black p-2 text-sm">Effective support</td>
                        <td className="border border-black p-2 text-sm">Perceived success in study</td>
                        <td className="border border-black p-2 text-sm">
                          <span>Enjoyment of </span>
                          <Input
                            value={listeningStore.getAnswer(33) as string || ''}
                            onChange={(e) => listeningStore.setAnswer(33, e.target.value)}
                            placeholder="33"
                            className="inline-block text-center"
                            style={{ width: '80px' }}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black p-2 text-sm font-semibold">Second level of importance</td>
                        <td className="border border-black p-2 text-sm">Positive experience at school</td>
                        <td className="border border-black p-2 text-sm">
                          <Input
                            value={listeningStore.getAnswer(34) as string || ''}
                            onChange={(e) => listeningStore.setAnswer(34, e.target.value)}
                            placeholder="34"
                            className="inline-block text-center"
                            style={{ width: '80px' }}
                          />
                        </td>
                        <td className="border border-black p-2 text-sm">
                          <span>Main </span>
                          <Input
                            value={listeningStore.getAnswer(35) as string || ''}
                            onChange={(e) => listeningStore.setAnswer(35, e.target.value)}
                            placeholder="35"
                            className="inline-block text-center"
                            style={{ width: '80px' }}
                          />
                          <span> is daily life</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black p-2 text-sm font-semibold">Third level of importance</td>
                        <td className="border border-black p-2 text-sm">
                          <span>Good interaction with the </span>
                          <Input
                            value={listeningStore.getAnswer(36) as string || ''}
                            onChange={(e) => listeningStore.setAnswer(36, e.target.value)}
                            placeholder="36"
                            className="inline-block text-center"
                            style={{ width: '80px' }}
                          />
                        </td>
                        <td className="border border-black p-2 text-sm">
                          <Input
                            value={listeningStore.getAnswer(37) as string || ''}
                            onChange={(e) => listeningStore.setAnswer(37, e.target.value)}
                            placeholder="37"
                            className="inline-block text-center"
                            style={{ width: '80px' }}
                          />
                          <span> problems</span>
                        </td>
                        <td className="border border-black p-2 text-sm">Capacity for multi-tasking</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Questions 38-40: Fill in blank */}
                <div>
                  <h3 className="font-bold text-base mb-2">Questions 38–40</h3>
                  <p className="text-sm mb-4">Complete the notes. Write <span className="font-bold">ONE WORD ONLY</span> for each answer.</p>
                  
                  <p className="font-semibold text-sm mb-3">Recommendations</p>
                  <ul className="list-disc ml-6 space-y-2">
                    <li className="text-sm">
                      <span>Ask new students to complete questionnaires to gauge their level of </span>
                      <Input
                        value={listeningStore.getAnswer(38) as string || ''}
                        onChange={(e) => listeningStore.setAnswer(38, e.target.value)}
                        placeholder="38"
                        className="inline-block text-center"
                        style={{ width: '80px' }}
                      />
                    </li>
                    <li className="text-sm">
                      <span>Train selected students to act as </span>
                      <Input
                        value={listeningStore.getAnswer(39) as string || ''}
                        onChange={(e) => listeningStore.setAnswer(39, e.target.value)}
                        placeholder="39"
                        className="inline-block text-center"
                        style={{ width: '80px' }}
                      />
                    </li>
                    <li className="text-sm">
                      <span>Outside office hours, offer </span>
                      <Input
                        value={listeningStore.getAnswer(40) as string || ''}
                        onChange={(e) => listeningStore.setAnswer(40, e.target.value)}
                        placeholder="40"
                        className="inline-block text-center"
                        style={{ width: '80px' }}
                      />
                      <span> help.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </Content>

      {/* Bottom Navigation */}
      <BottomNavigationComponent
        parts={listeningStore.parts}
        currentPart={listeningStore.currentPart}
        currentQuestionIndex={listeningStore.currentQuestionIndex}
        onPartClick={handlePartClick}
        onQuestionClick={handleQuestionClick}
        isQuestionAnswered={(qNum) => listeningStore.isQuestionAnswered(qNum)}
        onSubmit={handleSubmit}
      />

      {/* Audio Instruction Modal */}
      <AudioInstructionModal visible={showModal} onStart={handleStart} />

      {/* Submit Modal */}
      <SubmitModal visible={showSubmitModal} onClose={handleModalClose} onConfirm={handleModalConfirm} />
    </Layout>
  )
})

export default ListeningTestLayout
