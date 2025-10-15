import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Study Materials',
  description: 'Manage and organize your study materials',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
