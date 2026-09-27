import type { Metadata } from 'next'
import './globals.css' // Global styles

export const metadata: Metadata = {
  title: 'Chronicle Notes & Calendar',
  description:
    'A responsive mobile-first daily notes and calendar app with offline sync, rich formatting, interactive checklists, and tag organization.',
  openGraph: {
    title: 'Chronicle Notes & Calendar',
    description:
      'A responsive mobile-first daily notes and calendar app with offline sync, rich formatting, interactive checklists, and tag organization.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chronicle Notes & Calendar',
    description:
      'A responsive mobile-first daily notes and calendar app with offline sync, rich formatting, interactive checklists, and tag organization.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
