/**
 * Fullscreen utility functions for test sections
 * Handles entering and exiting fullscreen mode across different browsers
 */

/**
 * Request fullscreen mode for an element
 * @param element - The HTML element to make fullscreen (usually document.documentElement)
 * @returns Promise that resolves when fullscreen is entered
 */
export const enterFullscreen = async (element: HTMLElement = document.documentElement): Promise<void> => {
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen()
    } else if ((element as any).webkitRequestFullscreen) {
      // Safari
      await (element as any).webkitRequestFullscreen()
    } else if ((element as any).mozRequestFullScreen) {
      // Firefox
      await (element as any).mozRequestFullScreen()
    } else if ((element as any).msRequestFullscreen) {
      // IE/Edge
      await (element as any).msRequestFullscreen()
    }
    console.log('✅ Entered fullscreen mode')
  } catch (error) {
    console.error('❌ Failed to enter fullscreen:', error)
    throw error
  }
}

/**
 * Exit fullscreen mode
 * @returns Promise that resolves when fullscreen is exited
 */
export const exitFullscreen = async (): Promise<void> => {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen()
    } else if ((document as any).webkitExitFullscreen) {
      // Safari
      await (document as any).webkitExitFullscreen()
    } else if ((document as any).mozCancelFullScreen) {
      // Firefox
      await (document as any).mozCancelFullScreen()
    } else if ((document as any).msExitFullscreen) {
      // IE/Edge
      await (document as any).msExitFullscreen()
    }
    console.log('✅ Exited fullscreen mode')
  } catch (error) {
    console.error('❌ Failed to exit fullscreen:', error)
    throw error
  }
}

/**
 * Check if currently in fullscreen mode
 * @returns boolean indicating if in fullscreen
 */
export const isFullscreen = (): boolean => {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  )
}

/**
 * Toggle fullscreen mode
 * @param element - The element to make fullscreen (optional)
 * @returns Promise that resolves when toggle is complete
 */
export const toggleFullscreen = async (element?: HTMLElement): Promise<void> => {
  if (isFullscreen()) {
    await exitFullscreen()
  } else {
    await enterFullscreen(element)
  }
}

/**
 * Add event listener for fullscreen changes
 * @param callback - Function to call when fullscreen state changes
 * @returns Cleanup function to remove the listener
 */
export const onFullscreenChange = (callback: (isFullscreen: boolean) => void): (() => void) => {
  const handler = () => {
    callback(isFullscreen())
  }

  // Add listeners for all browser prefixes
  document.addEventListener('fullscreenchange', handler)
  document.addEventListener('webkitfullscreenchange', handler)
  document.addEventListener('mozfullscreenchange', handler)
  document.addEventListener('MSFullscreenChange', handler)

  // Return cleanup function
  return () => {
    document.removeEventListener('fullscreenchange', handler)
    document.removeEventListener('webkitfullscreenchange', handler)
    document.removeEventListener('mozfullscreenchange', handler)
    document.removeEventListener('MSFullscreenChange', handler)
  }
}

/**
 * Check if fullscreen is supported by the browser
 * @returns boolean indicating if fullscreen API is available
 */
export const isFullscreenSupported = (): boolean => {
  return !!(
    document.documentElement.requestFullscreen ||
    (document.documentElement as any).webkitRequestFullscreen ||
    (document.documentElement as any).mozRequestFullScreen ||
    (document.documentElement as any).msRequestFullscreen
  )
}
