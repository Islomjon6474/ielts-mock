# Audio Upload Fix - Correct API Flow

## ✅ What Was Fixed

Based on the Swagger API documentation, the correct audio upload flow requires **two steps**, not one.

---

## 🔧 Correct Flow (Fixed)

### Step 1: Upload File
```
POST /file/upload
Content-Type: multipart/form-data
Body: { file: File }

Response:
{
  "success": true,
  "data": {
    "id": "uuid-of-uploaded-file",
    "name": "audio.mp3",
    "contentType": "audio/mpeg",
    "size": 5242880
  }
}
```

### Step 2: Save Listening Audio
```
POST /test-management/save-listening-audio
Content-Type: application/json
Body: {
  "testId": "uuid-of-test",
  "fileId": "uuid-of-uploaded-file"
}

Response:
{
  "success": true,
  "data": "uuid-of-listening-audio-record"
}
```

---

## 📝 What Changed

### 1. Added Missing API Function

**File:** `src/services/testManagementApi.ts`

Added `saveListeningAudio` function to `listeningAudioApi`:

```typescript
// Save listening audio (link uploaded file to test)
saveListeningAudio: async (testId: string, fileId: string) => {
  const response = await api.post('/test-management/save-listening-audio', {
    testId,
    fileId,
  })
  return response.data
},
```

### 2. Updated Upload Handler

**File:** `src/app/admin/test/[testId]/section/[sectionType]/page.tsx`

**Before (Incorrect):**
```typescript
const handleAudioUpload = async (file: File) => {
  // Only uploaded file, didn't save to listening audio
  const response = await fileApi.uploadFile(file)
  const fileId = response.data || response.id
  message.success(`${file.name} uploaded successfully`)
  await fetchAudioFiles()
}
```

**After (Correct):**
```typescript
const handleAudioUpload = async (file: File) => {
  try {
    setUploading(true)
    
    // Step 1: Upload file to get fileId
    const uploadResponse = await fileApi.uploadFile(file)
    const fileId = uploadResponse.data?.id || uploadResponse.id
    
    if (!fileId) {
      throw new Error('Failed to upload file - no file ID returned')
    }
    
    // Step 2: Save listening audio (link file to test)
    await listeningAudioApi.saveListeningAudio(testId, fileId)
    
    message.success(`${file.name} uploaded and saved successfully`)
    
    // Refresh audio list
    await fetchAudioFiles()
    
    return false
  } catch (error: any) {
    console.error('Error uploading audio:', error)
    message.error(error.message || 'Failed to upload audio file')
    return false
  } finally {
    setUploading(false)
  }
}
```

### 3. Updated Audio File Interface

**Before:**
```typescript
interface AudioFile {
  id: string
  fileName: string
  ord: number
  fileUrl?: string
}
```

**After (Matching API Response):**
```typescript
interface AudioFile {
  id: string          // Listening audio record ID
  fileId: string      // File ID (for download)
  name: string        // File name
  contentType: string // MIME type (e.g., audio/mpeg)
  size: number        // File size in bytes
  ord?: number        // Order (optional)
}
```

### 4. Updated Display Logic

- **Play button** now uses `item.fileId` instead of `item.id`
- **File name** displayed from `item.name`
- **File info** shows content type and size (in MB)
- **Icon** changed from drag handle to audio icon

---

## 🎯 API Response Structure

### GET /test-management/get-all-listening-audio

```json
{
  "success": true,
  "data": [
    {
      "id": "listening-audio-uuid",
      "fileId": "file-uuid",
      "name": "Part_1_Audio.mp3",
      "contentType": "audio/mpeg",
      "size": 5242880
    }
  ]
}
```

---

## 📊 Complete Upload Flow Diagram

```
User clicks "Upload Audio File"
         ↓
Select audio file (MP3, WAV, etc.)
         ↓
┌─────────────────────────────────────┐
│ Step 1: Upload File                 │
│ POST /file/upload                   │
│ → Get fileId                        │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Step 2: Save Listening Audio        │
│ POST /save-listening-audio          │
│ Body: { testId, fileId }            │
│ → Creates listening audio record    │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Step 3: Refresh Audio List          │
│ GET /get-all-listening-audio        │
│ → Display in UI                     │
└─────────────────────────────────────┘
```

---

## 🎨 UI Improvements

### Audio List Display

**Before:**
- Showed `fileName` (didn't exist in API)
- Used `item.id` for download (wrong ID)
- Drag handle icon (non-functional)

**After:**
- Shows `name` from API
- Uses `item.fileId` for download
- Audio icon (🔊)
- Displays file type and size
- Better visual hierarchy

**Example:**
```
┌────────────────────────────────────────────────┐
│ 🔊 #1 Part_1_Introduction.mp3                  │
│     audio/mpeg | 4.85 MB        [Play] [Delete]│
├────────────────────────────────────────────────┤
│ 🔊 #2 Part_2_Conversation.mp3                  │
│     audio/mpeg | 6.23 MB        [Play] [Delete]│
└────────────────────────────────────────────────┘
```

---

## ✅ Testing

### To test the fix:

1. **Navigate to Listening Section**
   - Admin → Select Test → Click "Listening"

2. **Click "Audio Files" Tab**

3. **Upload Audio**
   - Click "Upload Audio File"
   - Select an MP3 file
   - Should see: "filename.mp3 uploaded and saved successfully"

4. **Verify in List**
   - Audio should appear in the list
   - Should show file name, type, and size
   - Click "Play" → should open audio in new tab
   - Click "Delete" → should remove audio

5. **Check Network Tab**
   - Should see two API calls:
     - `POST /file/upload` → returns fileId
     - `POST /save-listening-audio` → links file to test
     - `GET /get-all-listening-audio` → refreshes list

---

## 🚨 Important Notes

1. **Two-Step Process is Required**
   - Files uploaded to `/file/upload` are just stored
   - They must be linked to a test via `/save-listening-audio`
   - Otherwise, they won't appear in the listening audio list

2. **File ID vs Listening Audio ID**
   - `fileId` is used for downloading/playing
   - `id` (listening audio ID) is used for deleting the association

3. **Order Management**
   - Order is managed via `/change-listening-audio-ord`
   - Pass array of listening audio IDs in desired order

---

## 📚 Related Endpoints

```typescript
// Upload file
POST /file/upload
Response: { data: { id, name, contentType, size } }

// Save listening audio (NEW - was missing)
POST /test-management/save-listening-audio
Body: { testId, fileId }
Response: { data: "uuid-of-listening-audio" }

// Get all listening audio
GET /test-management/get-all-listening-audio?testId={uuid}
Response: { data: [{ id, fileId, name, contentType, size }] }

// Delete listening audio
DELETE /test-management/delete-listening-audio/{id}

// Change audio order
PUT /test-management/change-listening-audio-ord
Body: { ids: ["uuid1", "uuid2", "uuid3"] }

// Download/play file
GET /file/download/{fileId}
```

---

## ✅ Summary

✅ **Added missing API function** `saveListeningAudio`  
✅ **Implemented two-step upload flow**  
✅ **Updated interface to match API response**  
✅ **Fixed Play button to use correct fileId**  
✅ **Improved UI display** with file info  
✅ **Better error handling** with specific messages

The audio upload now works correctly according to the Swagger API documentation! 🎉
