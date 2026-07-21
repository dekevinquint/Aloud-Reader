import type { Metadata, Viewport } from "next"
import { Inter, Newsreader } from "next/font/google"
import type { ReactNode } from "react"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
})

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Aloud — read your PDFs out loud",
  description:
    "Aloud pulls the text out of your PDF and reads it aloud, highlighting each line as it goes. Uses your device's built-in voices, or plug in a cloud voice for studio quality and downloadable audio.",
  applicationName: "Aloud",
  keywords: ["PDF", "text to speech", "read aloud", "TTS", "accessibility", "audiobook"],
  authors: [{ name: "Aloud" }],
  openGraph: {
    title: "Aloud — read your PDFs out loud",
    description: "Turn any PDF into speech with synced highlighting and natural voices.",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: "#14201e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable}`}>
      <body>{children}</body>
    </html>
  )
}
