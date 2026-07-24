import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
          name: 'Aloud - read your PDFs out loud',
          short_name: 'Aloud',
          description: 'Turn any PDF into natural-sounding speech, right in your browser.',
          start_url: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#4f46e5',
          icons: [
            { src: '/icon', sizes: '32x32', type: 'image/png' },
            { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
                ],
    }
}
