import type { Metadata, Viewport } from "next"
import { Inter, Newsreader } from "next/font/google"
import type { ReactNode } from "react"
import React from "react"
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

const siteUrl = "https://www.hearaloud.com"

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: "Aloud - read your PDFs out loud",
    description:
          "Aloud pulls the text out of your PDF and reads it aloud, highlighting each line as it goes. Uses your device's built-in voices, or plug in a cloud voice for studio quality and downloadable audio.",
    applicationName: "Aloud",
    keywords: ["PDF", "text to speech", "read aloud", "TTS", "accessibility", "audiobook"],
    authors: [{ name: "Aloud" }],
    alternates: {
          canonical: siteUrl,
    },
    robots: {
          index: true,
          follow: true,
    },
    openGraph: {
          title: "Aloud - read your PDFs out loud",
          description: "Turn any PDF into speech with synced highlighting and natural voices.",
          url: siteUrl,
          siteName: "Aloud",
          type: "website",
          locale: "en_US",
          images: [
            {
                      url: "/opengraph-image",
                      width: 1200,
                      height: 630,
                      alt: "Aloud - read your PDFs out loud",
            },
                ],
    },
    twitter: {
          card: "summary_large_image",
          title: "Aloud - read your PDFs out loud",
          description: "Turn any PDF into speech with synced highlighting and natural voices.",
          images: ["/opengraph-image"],
    },
}

export const viewport: Viewport = {
    themeColor: "#14201e",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    viewportFit: "cover",
}

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Aloud",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    description: "Aloud turns any PDF into natural-sounding speech, right in your browser.",
    offers: [
      {
              "@type": "Offer",
              name: "Pro membership",
              price: "5",
              priceCurrency: "EUR",
      },
      {
              "@type": "Offer",
              name: "Pro one-time",
              price: "9",
              priceCurrency: "EUR",
      },
        ],
}

export default function RootLayout({ children }: { children: ReactNode }) {
    return React.createElement(
          "html",
      { lang: "en", className: `${inter.variable} ${newsreader.variable}` },
          React.createElement(
                  "body",
                  null,
                  React.createElement("script", {
                            type: "application/ld+json",
                            dangerouslySetInnerHTML: { __html: JSON.stringify(jsonLd) },
                  }),
                  children
                )
        )
}
