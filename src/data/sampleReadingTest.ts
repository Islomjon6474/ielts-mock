import { Part } from '@/stores/ReadingStore'

export const sampleReadingTest: Part[] = [
  {
    id: 1,
    title: 'Part 1',
    instruction: 'Read the text and answer questions 1–13.',
    questionRange: [1, 13],
    passage: `The life and work of Marie Curie

Marie Curie is probably the most famous woman scientist who has ever lived. Born Maria Sklodowska in Poland in 1867, she is famous for her work on radioactivity, and was twice a winner of the Nobel Prize. With her husband, Pierre Curie, and Henri Becquerel, she was awarded the 1903 Nobel Prize for Physics, and was then sole winner of the 1911 Nobel Prize for Chemistry. She was the first woman to win a Nobel Prize.

From childhood, Marie was remarkable for her prodigious memory, and at the age of 16 won a gold medal on completion of her secondary education. Because her father lost his savings through bad investment, she then had to take work as a teacher. From her earnings she was able to finance her sister Bronia's medical studies in Paris, on the understanding that Bronia would, in turn, later help her to get an education.

In 1891 this promise was fulfilled and Marie went to Paris and began to study at the Sorbonne (the University of Paris). She often worked far into the night and lived on little more than bread and butter and tea. She came first in the examination in the physical sciences in 1893, and in 1894 was placed second in the examination in mathematical sciences. It was not until the spring of that year that she was introduced to Pierre Curie.

Their marriage in 1895 marked the start of a partnership that was soon to achieve results of world significance. Following Henri Becquerel's discovery in 1896 of a new phenomenon, which Marie later called radioactivity, Marie Curie decided to find out if the radioactivity discovered in uranium was to be found in other elements. She discovered that this was true for thorium at the same time as G.C. Schmidt did.`,
    questions: [
      {
        id: 1,
        type: 'TRUE_FALSE_NOT_GIVEN',
        text: "Marie Curie's husband was a joint winner of both Marie's Nobel Prizes.",
      },
      {
        id: 2,
        type: 'TRUE_FALSE_NOT_GIVEN',
        text: 'Marie became interested in science when she was a child.',
      },
      {
        id: 3,
        type: 'TRUE_FALSE_NOT_GIVEN',
        text: "Marie was able to attend the Sorbonne because of her sister's financial help.",
      },
      {
        id: 4,
        type: 'TRUE_FALSE_NOT_GIVEN',
        text: 'Marie stopped teaching in 1891.',
      },
      {
        id: 5,
        type: 'TRUE_FALSE_NOT_GIVEN',
        text: 'Marie had known Pierre Curie before going to Paris.',
      },
      {
        id: 6,
        type: 'TRUE_FALSE_NOT_GIVEN',
        text: 'Marie was the first person to discover radioactivity.',
      },
      {
        id: 7,
        type: 'FILL_IN_BLANK',
        text: 'When uranium was discovered to be radioactive, Marie Curie found that the element called [7] had the same property.',
      },
      {
        id: 8,
        type: 'FILL_IN_BLANK',
        text: 'Marie and Pierre Curie research into the radioactivity of the mineral known as [8] led to the discovery of two new elements.',
      },
      {
        id: 9,
        type: 'FILL_IN_BLANK',
        text: 'In 1911, Marie Curie received recognition for her work on the element [9].',
      },
      {
        id: 10,
        type: 'FILL_IN_BLANK',
        text: 'Marie and Irène Curie developed X-radiography which was used as a medical technique for [10].',
      },
      {
        id: 11,
        type: 'FILL_IN_BLANK',
        text: 'Marie Curie saw the importance of collecting radioactive material both for research and for cases of [11].',
      },
      {
        id: 12,
        type: 'FILL_IN_BLANK',
        text: 'The radioactive material stocked in Paris contributed to the discoveries in the 1930s of the [12] and of what was known as artificial radioactivity.',
      },
      {
        id: 13,
        type: 'FILL_IN_BLANK',
        text: 'During her research, Marie Curie was exposed to radiation and as a result she suffered from [13].',
      },
    ],
  },
  {
    id: 2,
    title: 'Part 2',
    instruction: 'Read the text and answer questions 14–26.',
    questionRange: [14, 26],
    passage: 'The Physics of Traffic Behavior',
    sections: [
      {
        number: 14,
        content: 'Some years ago, when several theoretical physicists, principally Dirk Helbing and Boris Kerner of Stuttgart, Germany, began publishing papers on traffic flow in publications normally read by traffic engineers, they were clearly working outside their usual sphere of investigation. They had noticed that if they simulated the movement of vehicles on a highway, using the equations that describe how the molecules of a gas move, some very strange results emerged. Of course, vehicles do not behave exactly like gas molecules: for example, drivers try to avoid collisions by slowing down when they get too near another vehicle, whereas gas molecules have no such concern.',
      },
      {
        number: 15,
        content: 'However, the physicists modified the equations to take the differences into account and the overall description of traffic as a flowing gas has proved to be a very good one; the moving-gas model of traffic reproduces many phenomena seen in real-world traffic.\n\nThe strangest thing that came out of these equations, however, was the implication that congestion can arise completely spontaneously; no external causes are necessary.',
      },
      {
        number: 16,
        content: 'Vehicles can be flowing freely along, at a density still well below what the road can handle, and then suddenly get into a slow-moving state. Under certain conditions, jams will appear for no obvious reason, growing and persisting and creating delays even after the number of vehicles has returned to normal levels.\n\nThis phenomenon has been observed in real-world traffic studies across multiple countries.',
      },
      {
        number: 17,
        content: 'The physicists\' work has challenged traditional approaches to traffic management. Civil engineers have questioned whether elaborate chaos-theory interpretations are needed at all, since at least some of the traffic phenomena the physicists\' theories predicted seemed to be similar to observations that had been appearing in traffic engineering literature under other names for years.\n\nEngineers questioned how well the physicists\' theoretical results relate to traffic in the real world. Indeed, some engineering researchers have questioned whether elaborate chaos-theory interpretations are needed at all.',
      },
    ],
    questions: [
      {
        id: 14,
        type: 'MATCH_HEADING',
        text: 'Section 14',
        options: [
          'How a maths experiment actually reduced traffic congestion',
          'How a concept from one field of study was applied in another',
          'A lack of investment in driver training',
          'Areas of doubt and disagreement between experts',
          'How different countries have dealt with traffic congestion',
          'The impact of driver behavior on traffic speed',
          'A proposal to take control away from the driver',
        ],
      },
      {
        id: 15,
        type: 'MATCH_HEADING',
        text: 'Section 15',
        options: [
          'How a maths experiment actually reduced traffic congestion',
          'How a concept from one field of study was applied in another',
          'A lack of investment in driver training',
          'Areas of doubt and disagreement between experts',
          'How different countries have dealt with traffic congestion',
          'The impact of driver behavior on traffic speed',
          'A proposal to take control away from the driver',
        ],
      },
      {
        id: 16,
        type: 'MATCH_HEADING',
        text: 'Section 16',
        options: [
          'How a maths experiment actually reduced traffic congestion',
          'How a concept from one field of study was applied in another',
          'A lack of investment in driver training',
          'Areas of doubt and disagreement between experts',
          'How different countries have dealt with traffic congestion',
          'The impact of driver behavior on traffic speed',
          'A proposal to take control away from the driver',
        ],
      },
      {
        id: 17,
        type: 'MATCH_HEADING',
        text: 'Section 17',
        options: [
          'How a maths experiment actually reduced traffic congestion',
          'How a concept from one field of study was applied in another',
          'A lack of investment in driver training',
          'Areas of doubt and disagreement between experts',
          'How different countries have dealt with traffic congestion',
          'The impact of driver behavior on traffic speed',
          'A proposal to take control away from the driver',
        ],
      },
      {
        id: 18,
        type: 'MULTIPLE_CHOICE',
        text: 'Which TWO options describe what the writer is doing in section two?',
        maxAnswers: 2,
        options: [
          "explaining Helbing and Kerner's attitude to chaos theory",
          "clarifying Helbing and Kerner's conclusions about traffic behaviour",
          'showing how weather and temperature can change traffic flow',
          'drawing parallels between the behaviour of clouds and traffic',
          'giving examples of different potential causes of congestion',
        ],
      },
      {
        id: 19,
        type: 'MULTIPLE_CHOICE',
        text: 'Which TWO options describe what the writer is doing in section two?',
        maxAnswers: 2,
        options: [
          "explaining Helbing and Kerner's attitude to chaos theory",
          "clarifying Helbing and Kerner's conclusions about traffic behaviour",
          'showing how weather and temperature can change traffic flow',
          'drawing parallels between the behaviour of clouds and traffic',
          'giving examples of different potential causes of congestion',
        ],
      },
      {
        id: 20,
        type: 'MULTIPLE_CHOICE',
        text: "Which TWO statements reflect civil engineers' opinions of the physicists' theories?",
        maxAnswers: 2,
        options: [
          'They fail to take into account road maintenance.',
          'They may have little to do with everyday traffic behaviour.',
          'They are inconsistent with chaos theory.',
        ],
      },
      {
        id: 21,
        type: 'MULTIPLE_CHOICE',
        text: "Which TWO statements reflect civil engineers' opinions of the physicists' theories?",
        maxAnswers: 2,
        options: [
          'They fail to take into account road maintenance.',
          'They may have little to do with everyday traffic behaviour.',
          'They are inconsistent with chaos theory.',
        ],
      },
      {
        id: 22,
        type: 'TRUE_FALSE_NOT_GIVEN',
        text: 'The traffic flow model proposed by physicists was validated by real-world observations.',
      },
      {
        id: 23,
        type: 'TRUE_FALSE_NOT_GIVEN',
        text: 'Traffic engineers were initially skeptical of the physics approach to traffic analysis.',
      },
      {
        id: 24,
        type: 'TRUE_FALSE_NOT_GIVEN',
        text: 'The gas molecule model accurately predicts all traffic patterns.',
      },
      {
        id: 25,
        type: 'TRUE_FALSE_NOT_GIVEN',
        text: 'Spontaneous traffic jams can occur even on underutilized roads.',
      },
      {
        id: 26,
        type: 'TRUE_FALSE_NOT_GIVEN',
        text: 'The physicists collaborated directly with traffic engineers from the beginning.',
      },
    ],
  },
  {
    id: 3,
    title: 'Part 3',
    instruction: 'Read the text and answer questions 27–40.',
    questionRange: [27, 40],
    passage: `Plain English

There is no theoretical limit to the number of special purposes to which language can be put. As society develops new facets, so language is devised to express them. However, the result is often that language becomes very specialised and complex, and complications arise as we try to make sense of it.

Popular anxiety over special uses of language is most markedly seen in the campaigns to promote plain speaking and writing – notably, the Plain English movements of Britain and the USA. The main aim of these campaigns is to attack the use of unnecessarily complicated language (gobbledegook) by governments, businesses and other authorities whose role puts them in linguistic contact with the general public. The campaigners argue that such language, whether spoken or written, should be replaced by clearer forms of expression.

The movements took shape only in the 1970s, so it is too soon to ascertain their long-term influence on the character of language varieties. But they have certainly played a major part in promoting public awareness of the existence of communication problems, and have influenced many organisations to do something about it. In Britain, the campaign was launched in 1979 by a ritual shredding of government forms in Parliament Square, London. By 1982, the government had published a report telling departments to improve the design of forms, and to abolish those that were unnecessary. By 1985, around 15,700 forms had disappeared or were being revised, and 21,300 had been given a new look.

Lawyers, however, have raised objections to the use of plain English. They feel that it would result in ambiguity in documents and cause people to lose faith in legal language, which has been used in the courts for a very long time.`,
    questions: [
      {
        id: 27,
        type: 'FILL_IN_BLANK',
        text: 'For businesses, the use of complex language can have financial implications. The benefits of plain language can be seen in the case of companies who remove [27] from their forms and achieve [28] as a result.',
      },
      {
        id: 28,
        type: 'FILL_IN_BLANK',
        text: 'For businesses, the use of complex language can have financial implications. The benefits of plain language can be seen in the case of companies who remove [27] from their forms and achieve [28] as a result.',
      },
      {
        id: 29,
        type: 'FILL_IN_BLANK',
        text: 'Consumers often complain that they experience a feeling of [29] when trying to put together do-it-yourself products which have not been based on a [30]. In situations where not keeping to the correct procedures could affect safety issues, it is especially important that [31] information is not left out and no assumptions are made about a stage being self-evident or the consumer having a certain amount of [32].',
      },
      {
        id: 30,
        type: 'FILL_IN_BLANK',
        text: 'Consumers often complain that they experience a feeling of [29] when trying to put together do-it-yourself products which have not been based on a [30]. In situations where not keeping to the correct procedures could affect safety issues, it is especially important that [31] information is not left out and no assumptions are made about a stage being self-evident or the consumer having a certain amount of [32].',
      },
      {
        id: 31,
        type: 'FILL_IN_BLANK',
        text: 'Consumers often complain that they experience a feeling of [29] when trying to put together do-it-yourself products which have not been based on a [30]. In situations where not keeping to the correct procedures could affect safety issues, it is especially important that [31] information is not left out and no assumptions are made about a stage being self-evident or the consumer having a certain amount of [32].',
      },
      {
        id: 32,
        type: 'FILL_IN_BLANK',
        text: 'Consumers often complain that they experience a feeling of [29] when trying to put together do-it-yourself products which have not been based on a [30]. In situations where not keeping to the correct procedures could affect safety issues, it is especially important that [31] information is not left out and no assumptions are made about a stage being self-evident or the consumer having a certain amount of [32].',
      },
      {
        id: 33,
        type: 'FILL_IN_BLANK',
        text: 'Lawyers, however, have raised objections to the use of plain English. They feel that it would result in ambiguity in documents and cause people to lose faith in [33], as it would mean departing from language that has been used in the courts for a very long time.',
      },
      {
        id: 34,
        type: 'TRUE_FALSE_NOT_GIVEN',
        text: 'The Plain English movement has been successful in all countries where it was introduced.',
      },
      {
        id: 35,
        type: 'TRUE_FALSE_NOT_GIVEN',
        text: 'Government departments were initially resistant to simplifying their forms.',
      },
      {
        id: 36,
        type: 'TRUE_FALSE_NOT_GIVEN',
        text: 'The legal profession unanimously supports the use of plain English.',
      },
      {
        id: 37,
        type: 'TRUE_FALSE_NOT_GIVEN',
        text: 'Plain English can lead to better customer satisfaction for businesses.',
      },
      {
        id: 38,
        type: 'MULTIPLE_CHOICE',
        text: 'Which TWO reasons are given for the complexity of specialized language?',
        maxAnswers: 2,
        options: [
          'The development of new aspects of society',
          'Deliberate attempts to confuse people',
          'The need to maintain professional standards',
          'Historical tradition in certain professions',
          'Lack of education among writers',
        ],
      },
      {
        id: 39,
        type: 'MULTIPLE_CHOICE',
        text: 'Which TWO benefits of Plain English are mentioned?',
        maxAnswers: 2,
        options: [
          'Increased public awareness of communication issues',
          'Reduced costs for businesses',
          'Better legal documents',
          'Simplified tax forms',
          'Improved safety in product usage',
        ],
      },
      {
        id: 40,
        type: 'TRUE_FALSE_NOT_GIVEN',
        text: 'The Plain English movement was more successful in Britain than in the USA.',
      },
    ],
  },
]
