/**
 * Helper function to parse date - handles both ISO and custom DD.MM.YYYY HH:mm:ss format
 * @param dateString - Date string in ISO or DD.MM.YYYY HH:mm:ss format
 * @returns Date object or null if parsing fails
 */
export const parseCustomDate = (dateString: string): Date | null => {
  if (!dateString) return null
  try {
    // Try ISO format first (e.g., "2025-01-25T18:30:46.000+00:00")
    // Only use native Date parsing for strings that contain 'T' or '-' (actual ISO format)
    if (dateString.includes('T') || (dateString.includes('-') && !dateString.includes('.'))) {
      const isoDate = new Date(dateString)
      if (!isNaN(isoDate.getTime())) {
        return isoDate
      }
    }
    
    // Parse custom format: "24.11.2025 13:27:46" or "DD.MM.YYYY HH:mm:ss"
    const parts = dateString.split(' ')
    if (parts.length !== 2) return null
    
    const dateParts = parts[0].split('.')
    const timeParts = parts[1].split(':')
    
    if (dateParts.length !== 3 || timeParts.length !== 3) return null
    
    const day = parseInt(dateParts[0])
    const month = parseInt(dateParts[1]) - 1 // Month is 0-indexed
    const year = parseInt(dateParts[2])
    const hour = parseInt(timeParts[0])
    const minute = parseInt(timeParts[1])
    const second = parseInt(timeParts[2])
    
    const date = new Date(year, month, day, hour, minute, second)
    return isNaN(date.getTime()) ? null : date
  } catch (error) {
    return null
  }
}
