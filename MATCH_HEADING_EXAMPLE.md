# Match Heading Question - Complete Example

## Overview
Match Heading questions require students to match section paragraphs with appropriate headings from a list.

---

## Admin Panel Input

### Part 2 - Question Group 1 (Match Heading)

**Question Type:** Match Heading  
**Question Range:** 14-17  
**Instructions:** "Match each section to the correct heading from the list below"

---

### Question 1

**Section Number:** `14`

**Section Content:**
```
Some years ago, when several theoretical physicists, principally Dirk Helbing and 
Boris Kerner of Stuttgart, Germany, began publishing papers on traffic flow in 
publications normally read by traffic engineers, they were clearly working outside 
their usual sphere of investigation. They had noticed that if they simulated the 
movement of vehicles on a highway, using the equations that describe how the 
molecules of a gas move, some very strange results emerged.
```

**Heading Options (one per line):**
```
i. How a maths experiment actually reduced traffic congestion
ii. How a concept from one field of study was applied in another
iii. A lack of investment in driver training
iv. Areas of doubt and disagreement between experts
v. How different countries have dealt with traffic congestion
vi. The impact of driver behavior on traffic speed
vii. A proposal to take control away from the driver
```

**Correct Heading:**
```
How a concept from one field of study was applied in another
```

---

### Question 2

**Section Number:** `15`

**Section Content:**
```
However, the physicists modified the equations to take the differences into account 
and the overall description of traffic as a flowing gas has proved to be a very good 
one; the moving-gas model of traffic reproduces many phenomena seen in real-world 
traffic. The strangest thing that came out of these equations, however, was the 
implication that congestion can arise completely spontaneously; no external causes 
are necessary.
```

**Heading Options:** (same as above - they're shared)

**Correct Heading:**
```
The impact of driver behavior on traffic speed
```

---

### Question 3

**Section Number:** `16`

**Section Content:**
```
Vehicles can be flowing freely along, at a density still well below what the road 
can handle, and then suddenly get into a slow-moving state. Under certain conditions, 
jams will appear for no obvious reason, growing and persisting and creating delays 
even after the number of vehicles has returned to normal levels.
```

**Heading Options:** (same as above)

**Correct Heading:**
```
How a maths experiment actually reduced traffic congestion
```

---

### Question 4

**Section Number:** `17`

**Section Content:**
```
The physicists' work has challenged traditional approaches to traffic management. 
Civil engineers have questioned whether elaborate chaos-theory interpretations are 
needed at all, since at least some of the traffic phenomena the physicists' theories 
predicted seemed to be similar to observations that had been appearing in traffic 
engineering literature under other names for years.
```

**Heading Options:** (same as above)

**Correct Heading:**
```
Areas of doubt and disagreement between experts
```

---

## Transformed JSON Output

```json
{
  "id": 2,
  "title": "Part 2",
  "instruction": "Read the text and answer questions 14-26.",
  "questionRange": [14, 26],
  "passage": "The Physics of Traffic Behavior",
  "sections": [
    {
      "number": 14,
      "content": "Some years ago, when several theoretical physicists, principally Dirk Helbing and Boris Kerner of Stuttgart, Germany, began publishing papers on traffic flow in publications normally read by traffic engineers, they were clearly working outside their usual sphere of investigation. They had noticed that if they simulated the movement of vehicles on a highway, using the equations that describe how the molecules of a gas move, some very strange results emerged."
    },
    {
      "number": 15,
      "content": "However, the physicists modified the equations to take the differences into account and the overall description of traffic as a flowing gas has proved to be a very good one; the moving-gas model of traffic reproduces many phenomena seen in real-world traffic. The strangest thing that came out of these equations, however, was the implication that congestion can arise completely spontaneously; no external causes are necessary."
    },
    {
      "number": 16,
      "content": "Vehicles can be flowing freely along, at a density still well below what the road can handle, and then suddenly get into a slow-moving state. Under certain conditions, jams will appear for no obvious reason, growing and persisting and creating delays even after the number of vehicles has returned to normal levels."
    },
    {
      "number": 17,
      "content": "The physicists' work has challenged traditional approaches to traffic management. Civil engineers have questioned whether elaborate chaos-theory interpretations are needed at all, since at least some of the traffic phenomena the physicists' theories predicted seemed to be similar to observations that had been appearing in traffic engineering literature under other names for years."
    }
  ],
  "questions": [
    {
      "id": 14,
      "type": "MATCH_HEADING",
      "text": "Section 14",
      "options": [
        "i. How a maths experiment actually reduced traffic congestion",
        "ii. How a concept from one field of study was applied in another",
        "iii. A lack of investment in driver training",
        "iv. Areas of doubt and disagreement between experts",
        "v. How different countries have dealt with traffic congestion",
        "vi. The impact of driver behavior on traffic speed",
        "vii. A proposal to take control away from the driver"
      ]
    },
    {
      "id": 15,
      "type": "MATCH_HEADING",
      "text": "Section 15",
      "options": [
        "i. How a maths experiment actually reduced traffic congestion",
        "ii. How a concept from one field of study was applied in another",
        "iii. A lack of investment in driver training",
        "iv. Areas of doubt and disagreement between experts",
        "v. How different countries have dealt with traffic congestion",
        "vi. The impact of driver behavior on traffic speed",
        "vii. A proposal to take control away from the driver"
      ]
    },
    {
      "id": 16,
      "type": "MATCH_HEADING",
      "text": "Section 16",
      "options": [
        "i. How a maths experiment actually reduced traffic congestion",
        "ii. How a concept from one field of study was applied in another",
        "iii. A lack of investment in driver training",
        "iv. Areas of doubt and disagreement between experts",
        "v. How different countries have dealt with traffic congestion",
        "vi. The impact of driver behavior on traffic speed",
        "vii. A proposal to take control away from the driver"
      ]
    },
    {
      "id": 17,
      "type": "MATCH_HEADING",
      "text": "Section 17",
      "options": [
        "i. How a maths experiment actually reduced traffic congestion",
        "ii. How a concept from one field of study was applied in another",
        "iii. A lack of investment in driver training",
        "iv. Areas of doubt and disagreement between experts",
        "v. How different countries have dealt with traffic congestion",
        "vi. The impact of driver behavior on traffic speed",
        "vii. A proposal to take control away from the driver"
      ]
    }
  ]
}
```

---

## How Students See It

### Display Format:

**Available Headings:**
- i. How a maths experiment actually reduced traffic congestion
- ii. How a concept from one field of study was applied in another
- iii. A lack of investment in driver training
- iv. Areas of doubt and disagreement between experts
- v. How different countries have dealt with traffic congestion
- vi. The impact of driver behavior on traffic speed
- vii. A proposal to take control away from the driver

---

**Question 14 - Section A**

*[Section content displayed here]*

**Select heading:** [Dropdown with all heading options]

---

**Question 15 - Section B**

*[Section content displayed here]*

**Select heading:** [Dropdown with all heading options]

---

## Key Points

1. **Sections are separate from questions** - They contain the paragraph text
2. **All questions share the same heading options** - Enter them once in the first question
3. **Section numbers should match question IDs** - e.g., Section 14 = Question 14
4. **Heading options can include Roman numerals** - i, ii, iii, etc. (optional but traditional)
5. **Students select from a dropdown** - Not drag-and-drop (simpler implementation)

---

## Tips for Creating Match Heading Questions

✅ **DO:**
- Keep sections roughly equal in length (2-4 sentences each)
- Make headings clearly distinguishable
- Include 2-3 extra "distractor" headings
- Use clear, descriptive headings

❌ **DON'T:**
- Make sections too long or too short
- Use very similar headings
- Include headings that are too general or too specific
- Forget to add correct answers for grading
