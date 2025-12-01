/**
 * Audio alert utility for playing notification sounds
 */

/**
 * Play an error/warning sound
 * Uses Web Audio API to generate a beep sound
 */
export const playErrorSound = () => {
  try {
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    // Create oscillator (sound generator)
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    // Connect nodes
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Configure error sound (lower frequency, shorter duration)
    oscillator.frequency.value = 400 // Hz - lower pitch for warning
    oscillator.type = 'sine' // Smooth sine wave

    // Volume envelope (fade in/out)
    const now = audioContext.currentTime
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01) // Fade in
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.15) // Hold
    gainNode.gain.linearRampToValueAtTime(0, now + 0.2) // Fade out

    // Play the sound
    oscillator.start(now)
    oscillator.stop(now + 0.2)

    console.log('🔊 Played error sound')
  } catch (error) {
    console.error('Failed to play error sound:', error)
  }
}

/**
 * Play a double beep for emphasis (warning sound)
 */
export const playWarningSound = () => {
  playErrorSound()
  setTimeout(() => playErrorSound(), 250)
}

/**
 * Play success sound
 */
export const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Higher frequency for success
    oscillator.frequency.value = 800 // Hz
    oscillator.type = 'sine'

    const now = audioContext.currentTime
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.01)
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.1)
    gainNode.gain.linearRampToValueAtTime(0, now + 0.15)

    oscillator.start(now)
    oscillator.stop(now + 0.15)

    console.log('🔊 Played success sound')
  } catch (error) {
    console.error('Failed to play success sound:', error)
  }
}
