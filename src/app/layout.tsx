import type { Metadata } from 'next'
import { Inter, Sora } from 'next/font/google'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'] })
const sora = Sora({ subsets: ['latin'], variable: '--font-sora' })

export const metadata: Metadata = {
  title: 'CCPM - Cartographie Ponthieu-Marquenterre',
  description: 'Application cartographique interactive des communes de la communauté de communes Ponthieu-Marquenterre',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🗺️</text></svg>",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🗺️</text></svg>" />
      </head>
      <body className={`${inter.className} ${sora.variable}`}>
        {children}
      </body>
    </html>
  )
} 