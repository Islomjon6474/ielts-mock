# Pagination Implementation - Admin Tests Page

## ✅ What Was Implemented

Enhanced pagination system with full control over page size, navigation, and loading states.

---

## 🎯 Features

### 1. **Dynamic Page Size**
- Users can change how many tests to display per page
- Options: 6, 9, 12, 18, 24 tests per page
- Default: 9 tests (3x3 grid)
- Automatically resets to page 1 when page size changes

### 2. **Page Navigation**
- Previous/Next buttons
- Direct page number selection
- Quick jump to specific page number
- Disabled when only one page

### 3. **Information Display**
- Shows current range: "Showing 1 to 9 of 45 tests"
- Shows page range in pagination: "1-9 of 45"
- Total count always visible

### 4. **Loading States**
- Skeleton loading cards while fetching
- Shows correct number of skeleton cards based on page size
- Smooth transition from loading to content

### 5. **Responsive Layout**
- Pagination bar with white background
- Flexbox layout that wraps on smaller screens
- Info text on left, pagination controls on right
- Clean spacing and rounded corners

---

## 📊 Implementation Details

### State Management

```typescript
const [currentPage, setCurrentPage] = useState(1)
const [totalTests, setTotalTests] = useState(0)
const [pageSize, setPageSize] = useState(9) // 3x3 grid
```

### API Integration

```typescript
const fetchTests = async (page: number) => {
  const response = await testManagementApi.getAllTests(page, pageSize)
  const data = response.data || response
  setTests(Array.isArray(data) ? data : data.content || [])
  setTotalTests(data.totalCount || data.totalElements || 0)
}

useEffect(() => {
  fetchTests(currentPage - 1) // API uses 0-based indexing
}, [currentPage, pageSize])
```

### Pagination Component

```typescript
<Pagination
  current={currentPage}
  total={totalTests}
  pageSize={pageSize}
  onChange={(page, newPageSize) => {
    setCurrentPage(page)
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize)
      setCurrentPage(1) // Reset to first page when page size changes
    }
  }}
  onShowSizeChange={(current, size) => {
    setPageSize(size)
    setCurrentPage(1)
  }}
  showSizeChanger
  showQuickJumper
  showTotal={(total, range) => `${range[0]}-${range[1]} of ${total}`}
  pageSizeOptions={['6', '9', '12', '18', '24']}
/>
```

---

## 🎨 UI Components

### Pagination Bar

```
┌────────────────────────────────────────────────────┐
│ Showing 1 to 9 of 45 tests     [<] [1] [2] [3] [>]│
│                                9 / page    Go: [_] │
└────────────────────────────────────────────────────┘
```

### Loading Skeleton

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ ▓▓▓▓▓▓▓▓ │  │ ▓▓▓▓▓▓▓▓ │  │ ▓▓▓▓▓▓▓▓ │
│ ▓▓▓▓▓▓   │  │ ▓▓▓▓▓▓   │  │ ▓▓▓▓▓▓   │
│ ▓▓▓▓     │  │ ▓▓▓▓     │  │ ▓▓▓▓     │
│ ▓▓▓      │  │ ▓▓▓      │  │ ▓▓▓      │
└──────────┘  └──────────┘  └──────────┘
(Shows pageSize number of skeletons)
```

---

## 📱 Responsive Behavior

### Desktop (>= 992px)
- 3 cards per row
- Pagination bar: info left, controls right
- All options visible

### Tablet (768px - 991px)
- 2 cards per row
- Pagination bar wraps on smaller screens
- Compact pagination controls

### Mobile (< 768px)
- 1 card per row
- Pagination bar stacks vertically
- Simplified page size options

---

## 🔧 How It Works

### Page Change Flow

```
User clicks page 2
    ↓
setCurrentPage(2)
    ↓
useEffect triggered (currentPage changed)
    ↓
fetchTests(1) // API uses 0-based index
    ↓
GET /test-management/get-all?page=1&size=9
    ↓
Update tests and totalTests state
    ↓
UI re-renders with new data
```

### Page Size Change Flow

```
User selects 12 per page
    ↓
setPageSize(12)
setCurrentPage(1) // Reset to first page
    ↓
useEffect triggered (both changed)
    ↓
fetchTests(0) // Back to page 1
    ↓
GET /test-management/get-all?page=0&size=12
    ↓
Update tests and totalTests state
    ↓
UI re-renders with 12 cards per page
```

---

## 🎯 Pagination Controls

### 1. **Page Size Selector**
- Dropdown with options: 6, 9, 12, 18, 24
- Default: 9 (3x3 grid)
- Label: "9 / page"

### 2. **Page Numbers**
- Shows up to 5 page numbers at a time
- Current page highlighted
- "..." for skipped pages
- Example: `[<] [1] ... [5] [6] [7] ... [15] [>]`

### 3. **Quick Jumper**
- Input field to type page number
- Press Enter to jump
- Label: "Go:"
- Validates input (only accepts valid page numbers)

### 4. **Previous/Next Buttons**
- `[<]` - Previous page
- `[>]` - Next page
- Disabled on first/last page

---

## 📊 Data Display

### Information Text
```
Showing {start} to {end} of {total} tests
```

Examples:
- Page 1, 9 per page, 45 total: "Showing 1 to 9 of 45 tests"
- Page 2, 9 per page, 45 total: "Showing 10 to 18 of 45 tests"
- Page 5, 9 per page, 45 total: "Showing 37 to 45 of 45 tests"

### Pagination Total
```
{start}-{end} of {total}
```

Examples:
- "1-9 of 45"
- "10-18 of 45"
- "37-45 of 45"

---

## 🔍 Edge Cases Handled

### 1. **Empty Results**
- Shows empty state
- No pagination bar
- "Create your first test" message

### 2. **Single Page**
- Pagination shows but controls disabled
- Can still change page size
- Info text still displays

### 3. **Page Size Change**
- Automatically resets to page 1
- Prevents showing empty pages
- Smooth transition

### 4. **Loading State**
- Shows skeleton cards
- Correct number based on pageSize
- Pagination hidden during load

### 5. **Last Page Partial Results**
- Shows only available tests
- Info text shows correct count
- Example: "Showing 37 to 42 of 42 tests"

---

## 🎨 Styling

### Pagination Bar
```css
{
  marginTop: 48px,
  padding: '24px',
  background: '#fff',
  borderRadius: '8px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '16px'
}
```

### Info Text
```css
{
  fontSize: '14px',
  color: 'rgba(0, 0, 0, 0.45)' // secondary text color
}
```

### Skeleton Cards
```css
{
  borderRadius: '12px',
  height: '280px'
}
```

---

## 📈 Performance

### Optimizations

1. **Conditional Rendering**
   - Only renders pagination when needed
   - Hides during loading
   - Shows only when tests exist

2. **Efficient State Updates**
   - Combined page and size change handlers
   - Single API call per change
   - Debounced loading states

3. **Skeleton Loading**
   - Instant feedback on page change
   - Prevents layout shift
   - Smooth transitions

---

## ✅ Benefits

✅ **Better UX** - Users can control how many tests to see  
✅ **Performance** - Only loads what's needed  
✅ **Loading Feedback** - Skeleton cards during fetch  
✅ **Flexibility** - Multiple page size options  
✅ **Navigation** - Easy to jump to any page  
✅ **Information** - Always know where you are  
✅ **Responsive** - Works on all screen sizes  
✅ **Handles Edge Cases** - Empty, single page, partial last page

---

## 🚀 Usage Example

### For 45 Total Tests

**Page 1 (9 per page):**
```
Showing 1 to 9 of 45 tests

[Test 1] [Test 2] [Test 3]
[Test 4] [Test 5] [Test 6]
[Test 7] [Test 8] [Test 9]

[<] [1] [2] [3] [4] [5] [>]
9 / page ▼    Go: [___]
1-9 of 45
```

**Page 3 (9 per page):**
```
Showing 19 to 27 of 45 tests

[Test 19] [Test 20] [Test 21]
[Test 22] [Test 23] [Test 24]
[Test 25] [Test 26] [Test 27]

[<] [1] [2] [3] [4] [5] [>]
9 / page ▼    Go: [___]
19-27 of 45
```

**Change to 12 per page:**
```
Showing 1 to 12 of 45 tests

[Test 1]  [Test 2]  [Test 3]
[Test 4]  [Test 5]  [Test 6]
[Test 7]  [Test 8]  [Test 9]
[Test 10] [Test 11] [Test 12]

[<] [1] [2] [3] [4] [>]
12 / page ▼    Go: [___]
1-12 of 45
```

---

## 🎉 Summary

The pagination system is fully functional with:
- ✅ Page size control (6, 9, 12, 18, 24)
- ✅ Page navigation (prev/next, direct, quick jump)
- ✅ Loading skeletons
- ✅ Information display
- ✅ Responsive design
- ✅ Edge case handling
- ✅ Clean and modern UI
