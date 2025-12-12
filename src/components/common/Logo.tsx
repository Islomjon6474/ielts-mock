'use client'

import Image from 'next/image'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'

interface LogoProps {
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
}

const Logo = observer(({ size = 'medium', showText = true }: LogoProps) => {
  const { themeStore } = useStore()
  const isDarkTheme = themeStore.currentTheme === 'dark' || themeStore.currentTheme === 'yellow'

  // Size configurations
  const sizes = {
    small: { width: 100, height: 36 },
    medium: { width: 140, height: 50 },
    large: { width: 200, height: 100 },
  }

  const { width, height } = sizes[size]

  // For light theme, use the full logo with black text
  // For dark/yellow themes, use the logo with white text
  if (isDarkTheme) {
    // Dark theme: show star icon + white text
    if (showText) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Image
            src="/logos/sirius logo white.png"
            alt="Sirius Academy"
            width={Math.round(width * 0.6)}
            height={Math.round(height * 0.7)}
            style={{ objectFit: 'contain' }}
            priority
          />
          <Image
            src="/logos/sirius type white.png"
            alt="Sirius Academy"
            width={width}
            height={Math.round(height * 0.3)}
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
      )
    }
    // Just icon for dark theme without text
    return (
      <Image
        src="/logos/sirius logo white.png"
        alt="Sirius Academy"
        width={width}
        height={height}
        style={{ objectFit: 'contain' }}
        priority
      />
    )
  }

  // Light theme: use full logo
  return (
    <Image
      src="/logos/1.png"
      alt="Sirius Academy"
      width={width}
      height={height}
      style={{ objectFit: 'contain' }}
      priority
    />
  )
})

export default Logo
