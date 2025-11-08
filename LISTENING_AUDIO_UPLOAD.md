# Listening Audio Upload - Section Level Implementation

## ✅ What Changed

### Previous Structure (Per Part):
```
Test → Section (Listening) → Part 1 → Audio Upload Tab
                           → Part 2 → Audio Upload Tab  
                           → Part 3 → Audio Upload Tab
                           → Part 4 → Audio Upload Tab
```

### New Structure (Section Level):
```
Test → Section (Listening) → Audio Files Tab (Multiple uploads)
                           → Parts Tab
                                → Part 1 (Questions only)
                                → Part 2 (Questions only)
                                → Part 3 (Questions only)
                                → Part 4 (Questions only)
```

---

## 📍 Implementation Details

### 1. Section Page (`/admin/test/[testId]/section/[sectionType]/page.tsx`)

**For Listening Sections Only:**
- Added **two tabs**: "Parts" and "Audio Files"
- Audio Files tab shows:
  - Upload button for multiple audio files
  - List of uploaded audio files
  - Play button to preview audio
  - Delete button to remove audio
  - Drag handle for reordering (visual indicator)

**For Other Sections (Reading, Writing):**
- Single view with parts table (no tabs)

---

### 2. Part Editor Page (`/admin/test/[testId]/section/[sectionType]/part/[partId]/page.tsx`)

**Removed:**
- "Listening Audio" tab from part editor
- Audio upload functionality at part level

**Reason:**
- Audio is now managed at section level
- Parts only contain questions and content

---

## 🎯 Features

### Audio Management Tab

1. **Upload Multiple Files**
   - Click "Upload Audio File" button
   - Select MP3, WAV, OGG, or M4A files
   - Multiple files can be uploaded
   - File size limit: 50MB per file

2. **View Uploaded Files**
   - List shows all audio files with order number
   - File name displayed
   - Order indicator (#1, #2, #3, etc.)

3. **Play Audio**
   - "Play" button opens audio in new tab
   - Direct download URL from backend

4. **Delete Audio**
   - "Delete" button with confirmation modal
   - Removes file from backend

5. **Reorder Audio** (Future Enhancement)
   - Drag handle icon visible
   - API ready: `changeListeningAudioOrder(ids[])`
   - Can be implemented with drag-and-drop library

---

## 🔌 API Integration

### Endpoints Used:

```typescript
// Get all audio files for a test
GET /test-management/get-all-listening-audio?testId={testId}

// Upload audio file
POST /file/upload
FormData: { file }

// Delete audio file
DELETE /test-management/delete-listening-audio/{id}

// Change audio order
PUT /test-management/change-listening-audio-ord
Body: { ids: string[] }

// Download/Play audio
GET /file/download/{id}
```

---

## 📊 Data Flow

### Upload Audio:
```
1. User selects audio file
   ↓
2. Upload to /file/upload
   ↓
3. Get fileId from response
   ↓
4. Refresh audio list
   ↓
5. Display in list
```

### Delete Audio:
```
1. User clicks Delete
   ↓
2. Confirmation modal
   ↓
3. Call DELETE /delete-listening-audio/{id}
   ↓
4. Refresh audio list
```

---

## 🎨 UI Components

### Audio Files Tab Layout:

```
┌─────────────────────────────────────────────────┐
│ Listening Section Audio Files                   │
│ Upload audio files for this listening section... │
├─────────────────────────────────────────────────┤
│                                                  │
│  [📤 Upload Audio File]                         │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ 📝 Audio Guidelines:                       │ │
│  │ • Upload clear, high-quality audio        │ │
│  │ • Recommended format: MP3                 │ │
│  │ • File size: Keep under 50MB              │ │
│  │ • You can upload multiple files           │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  Uploaded Audio Files (3)                       │
│  ┌────────────────────────────────────────────┐ │
│  │ ☰ #1 Part_1_Audio.mp3    [Play] [Delete]  │ │
│  │ ☰ #2 Part_2_Audio.mp3    [Play] [Delete]  │ │
│  │ ☰ #3 Part_3_Audio.mp3    [Play] [Delete]  │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Empty State:

```
┌─────────────────────────────────┐
│         🔊                      │
│   No audio files uploaded yet   │
│                                 │
│ Click "Upload Audio File" above │
└─────────────────────────────────┘
```

---

## 💡 Benefits

### 1. **Better Organization**
   - All audio files in one place
   - Easy to see what's uploaded
   - Clear overview of section audio

### 2. **Multiple File Support**
   - Upload audio for all 4 parts in one location
   - Can upload separate files per part or combined
   - Flexible structure

### 3. **Easier Management**
   - Upload all audio at once
   - No need to navigate to each part
   - Single tab for all audio operations

### 4. **Student Experience**
   - Audio can be served in sequence
   - Proper ordering via reorder functionality
   - Centralized audio source

---

## 🚀 Usage Workflow

### For Admins Creating Listening Tests:

1. **Navigate to Test**
   - Go to Admin → Select Test → Click "Listening" section

2. **Upload Audio Files**
   - Click "Audio Files" tab
   - Click "Upload Audio File" button
   - Select MP3 file(s)
   - Upload multiple files if needed

3. **Manage Audio**
   - Play to preview
   - Delete if wrong file
   - Reorder if needed (future)

4. **Create Questions**
   - Switch to "Parts" tab
   - Click on Part 1, 2, 3, or 4
   - Add question groups and questions
   - Save content

---

## 📝 Notes

- **Audio upload only appears for Listening sections**
- **Reading and Writing sections show parts table only**
- **Audio tab removed from part editor for all sections**
- **Supports standard audio formats**: MP3, WAV, OGG, M4A
- **File limit**: 50MB per file (recommended)
- **Reordering**: API ready, UI can be enhanced with drag-and-drop

---

## 🔜 Future Enhancements

### Drag-and-Drop Reordering:
```typescript
// Can be implemented using react-beautiful-dnd or similar
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

const handleDragEnd = (result) => {
  // Reorder array
  const items = reorder(audioFiles, result.source.index, result.destination.index)
  
  // Update backend
  const ids = items.map(item => item.id)
  await listeningAudioApi.changeListeningAudioOrder(ids)
}
```

### Audio Preview Player:
- Inline audio player instead of opening in new tab
- Waveform visualization
- Playback controls (play/pause/seek)

### Audio Processing:
- Auto-convert to MP3 format
- Volume normalization
- Duration display
- File size display

---

## ✅ Summary

✅ **Moved audio upload from part level to section level**  
✅ **Multiple audio files can be uploaded per section**  
✅ **Clean tabbed interface for Listening sections**  
✅ **Play and delete functionality working**  
✅ **API ready for reordering**  
✅ **Removed audio tab from part editor**  
✅ **Better UX for managing listening test audio**
