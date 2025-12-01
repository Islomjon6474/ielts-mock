'use client'

import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { ConfigProvider, theme } from 'antd'

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider = observer(({ children }: ThemeProviderProps) => {
  const { themeStore } = useStore()

  useEffect(() => {
    // Apply theme on mount and whenever it changes
    themeStore.applyTheme()
    themeStore.applyFontSize()
  }, [themeStore, themeStore.currentTheme, themeStore.fontSize])

  // Get Ant Design theme configuration based on current theme
  const getAntdTheme = () => {
    const colors = themeStore.colors
    const isYellowTheme = themeStore.currentTheme === 'yellow'

    return {
      algorithm: themeStore.currentTheme === 'light' ? theme.defaultAlgorithm : theme.darkAlgorithm,
      token: {
        colorPrimary: colors.primary,
        colorBgBase: colors.background,
        colorTextBase: colors.textPrimary,
        colorBorder: colors.borderColor,
        colorBgContainer: colors.cardBackground,
        borderRadius: 6,
        // Override link color for yellow theme
        colorLink: colors.primary,
        colorLinkHover: colors.primary,
        colorLinkActive: colors.primary,
      },
      components: {
        Button: {
          colorPrimary: colors.buttonBackground,
          colorText: colors.textPrimary,
          colorBgContainer: colors.cardBackground,
          primaryColor: colors.buttonText,
          // For primary buttons in yellow theme
          colorPrimaryHover: isYellowTheme ? '#cccc00' : undefined,
          colorPrimaryActive: isYellowTheme ? '#999900' : undefined,
          // Text color on primary buttons
          colorTextLightSolid: colors.buttonText,
        },
        Input: {
          colorBgContainer: colors.inputBackground,
          colorBorder: colors.inputBorder,
          colorText: colors.textPrimary,
        },
        Card: {
          colorBgContainer: colors.cardBackground,
          colorBorderSecondary: colors.borderColor,
          colorText: colors.textPrimary,
        },
        Layout: {
          colorBgBody: colors.background,
          colorBgHeader: colors.headerBackground,
        },
        Radio: {
          colorPrimary: colors.primary,
          colorText: colors.textPrimary,
        },
        Checkbox: {
          colorPrimary: colors.primary,
          colorText: colors.textPrimary,
        },
        Typography: {
          colorText: colors.textPrimary,
          colorTextSecondary: colors.textSecondary,
        },
        Select: {
          colorBgContainer: colors.inputBackground,
          colorBorder: colors.inputBorder,
          colorText: colors.textPrimary,
        },
        Modal: {
          colorBgElevated: colors.cardBackground,
          colorText: colors.textPrimary,
        },
        Dropdown: {
          colorBgElevated: colors.cardBackground,
          colorText: colors.textPrimary,
        },
        Pagination: {
          colorPrimary: colors.primary,
          colorText: colors.textPrimary,
        },
        Tag: {
          colorText: colors.textPrimary,
        },
      },
    }
  }

  return (
    <ConfigProvider theme={getAntdTheme()}>
      {children}
    </ConfigProvider>
  )
})
