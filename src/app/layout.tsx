import type { Metadata } from 'next'
import { AntdRegistry } from '@/components/AntdRegistry'
import { ConfigProvider } from 'antd'
import './globals.css'
import StoreProvider from '@/components/providers/StoreProvider'

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
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: '#1677ff',
                borderRadius: 6,
              },
            }}
          >
            <StoreProvider>
              {children}
            </StoreProvider>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}
