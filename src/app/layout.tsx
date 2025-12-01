import type { Metadata } from 'next'
import { AntdRegistry } from '@/components/AntdRegistry'
import './globals.css'
import StoreProvider from '@/components/providers/StoreProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'

export const metadata: Metadata = {
  title: 'IELTS Mock Assessment',
  description: 'Practice your IELTS exam with realistic mock tests',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <StoreProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </StoreProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}
