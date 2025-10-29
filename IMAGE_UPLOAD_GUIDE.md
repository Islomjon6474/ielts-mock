# Image Upload Feature Documentation

## Overview
The image upload feature allows admins to add images/illustrations to:
1. **Listening sections** - Images for question groups (e.g., maps, diagrams)
2. **Writing Part 1** - Charts, graphs, diagrams for Task 1

---

## How It Works

### Upload Flow
1. Admin clicks "Upload Image" button
2. File is uploaded via `POST /file/upload`
3. API returns file metadata: `{ success: boolean, data: { id: UUID, name, contentType, size } }`
4. File ID is stored in the JSON content
5. On user side, image is displayed via `GET /file/download/{id}`

---

## Admin Side Implementation

### 1. Listening Section
**Location:** Each question group can have an image

```typescript
// Content JSON structure for Listening
{
  instruction: "Listen to the audio and answer the questions",
  questionGroups: [
    {
      type: "MULTIPLE_CHOICE",
      range: "1-5",
      instruction: "Look at the map below",
      imageId: "550e8400-e29b-41d4-a716-446655440000", // ← File ID
      questions: [...]
    }
  ]
}
```

**UI Component:** `QuestionGroupEditor` with `showImageUpload={true}`

### 2. Writing Section (Part 1)
**Location:** Part-level image (for the entire task)

```typescript
// Content JSON structure for Writing Part 1
{
  instruction: "Write at least 150 words",
  passage: "The chart shows...",
  imageId: "550e8400-e29b-41d4-a716-446655440000", // ← File ID at part level
  questionGroups: [...]
}
```

**UI Component:** Separate `ImageUpload` in the passage section

---

## Components Created

### 1. `ImageUpload.tsx` (Admin)
**Location:** `src/components/admin/ImageUpload.tsx`

**Props:**
```typescript
{
  value?: string         // Current file ID
  onChange?: (fileId: string | undefined) => void
  label?: string         // Button label
}
```

**Features:**
- Upload button when no image
- Image preview with delete option
- Automatic file upload handling
- Error handling with messages

**Usage:**
```tsx
<Form.Item name="imageId">
  <ImageUpload label="Upload Image" />
</Form.Item>
```

### 2. `ImageDisplay.tsx` (User Side)
**Location:** `src/components/common/ImageDisplay.tsx`

**Props:**
```typescript
{
  fileId?: string        // File ID to display
  alt?: string          // Alt text
  style?: CSSProperties
  className?: string
}
```

**Features:**
- Automatic URL generation
- Loading state
- Error handling
- Image preview (zoom)

**Usage:**
```tsx
// In listening question rendering
{questionGroup.imageId && (
  <ImageDisplay 
    fileId={questionGroup.imageId}
    alt="Question illustration"
  />
)}

// In writing task rendering
{content.imageId && (
  <ImageDisplay 
    fileId={content.imageId}
    alt="Task 1 diagram"
  />
)}
```

---

## API Endpoints Used

### Upload File
```
POST /file/upload
Content-Type: multipart/form-data

Request:
- file: File (binary)

Response:
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "diagram.png",
    "contentType": "image/png",
    "size": 125340
  }
}
```

### Download File
```
GET /file/download/{id}

Response: Binary image file
```

---

## Data Structure

### Listening Part Content
```json
{
  "instruction": "General instructions",
  "questionGroups": [
    {
      "type": "MULTIPLE_CHOICE",
      "range": "1-5",
      "instruction": "Look at the map below",
      "imageId": "550e8400-e29b-41d4-a716-446655440000",
      "questions": [
        {
          "text": "Where is the library?",
          "optionA": "Near the park",
          "optionB": "Next to the museum",
          "optionC": "Behind the station",
          "optionD": "Opposite the bank",
          "correctAnswer": "C"
        }
      ]
    }
  ]
}
```

### Writing Part Content
```json
{
  "instruction": "Write at least 150 words describing the information",
  "passage": "The chart shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011.",
  "imageId": "550e8400-e29b-41d4-a716-446655440000",
  "questionGroups": []
}
```

---

## User Side Implementation Guide

When rendering tests on the user side, check for `imageId` fields and display images:

### Listening Test Rendering
```tsx
{parts.map(part => (
  <div key={part.id}>
    {part.questionGroups.map(group => (
      <div key={group.id}>
        {/* Show image if exists */}
        {group.imageId && (
          <ImageDisplay 
            fileId={group.imageId}
            alt="Question illustration"
            style={{ marginBottom: '20px' }}
          />
        )}
        
        {/* Render questions */}
        {group.questions.map(question => (
          <QuestionComponent key={question.id} {...question} />
        ))}
      </div>
    ))}
  </div>
))}
```

### Writing Task Rendering
```tsx
{content.imageId && (
  <div className="task-image">
    <ImageDisplay 
      fileId={content.imageId}
      alt="Writing Task 1 diagram"
      style={{ maxWidth: '600px', margin: '20px 0' }}
    />
  </div>
)}
<div className="task-description">
  {content.passage}
</div>
```

---

## File Upload Service

The file API methods are in `src/services/testManagementApi.ts`:

```typescript
export const fileApi = {
  // Upload file
  uploadFile: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post('/file/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Get download URL
  getDownloadUrl: (fileId: string) => {
    return `${BASE_URL}/file/download/${fileId}`
  },
}
```

---

## Testing Checklist

### Admin Side
- [ ] Navigate to Listening section part editor
- [ ] Create a question group
- [ ] Upload an image for the question group
- [ ] Verify image preview shows
- [ ] Delete image and verify it's removed
- [ ] Save content and reload page
- [ ] Verify image persists after reload

### Writing Section
- [ ] Navigate to Writing section part editor
- [ ] Upload an image in the "Task Image/Chart" section
- [ ] Verify image preview shows
- [ ] Save and reload
- [ ] Verify image persists

### User Side (Future)
- [ ] Load a listening test with images
- [ ] Verify images display correctly
- [ ] Load a writing test with image
- [ ] Verify chart/diagram displays
- [ ] Test image zoom/preview functionality

---

## Supported Image Formats

The upload component accepts all image formats:
- JPG/JPEG
- PNG
- GIF
- SVG
- WebP
- BMP

---

## Best Practices

### For Admins
1. **Image Size:** Keep images under 2MB for faster loading
2. **Resolution:** Use clear, readable images (min 800px width recommended)
3. **File Names:** Use descriptive names (e.g., "map-section-a.png")
4. **Listening Images:** Use diagrams, maps, floor plans, or illustrations
5. **Writing Task 1:** Upload charts, graphs, tables, or process diagrams

### For Developers
1. Always check if `imageId` exists before rendering
2. Handle loading and error states
3. Provide alt text for accessibility
4. Use responsive image sizing
5. Enable image preview/zoom for better UX

---

## Troubleshooting

### Issue: Upload fails
- Check file size (server may have limits)
- Verify API endpoint is accessible
- Check network console for errors

### Issue: Image not displaying on user side
- Verify `imageId` is stored in JSON content
- Check download URL is correct
- Verify file exists on server (use browser to test URL)

### Issue: Image preview not working
- Clear browser cache
- Check if fileId is valid UUID format
- Verify API authentication (if required)

---

## Future Enhancements

1. **Image Cropping** - Allow admins to crop images before upload
2. **Multiple Images** - Support multiple images per question group
3. **Image Gallery** - Reuse previously uploaded images
4. **Drag & Drop** - Drag and drop image upload
5. **Compression** - Auto-compress large images
6. **Alternative Text** - Add alt text field for accessibility

---

**Implementation Date:** October 29, 2025
**Status:** ✅ Complete - Ready for Testing
