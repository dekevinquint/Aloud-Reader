import { ImageResponse } from 'next/og'
import React from 'react'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
    return new ImageResponse(
          React.createElement(
                  'div',
            {
                      style: {
                                  width: '100%',
                                  height: '100%',
                                  background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontFamily: 'sans-serif',
                      },
            },
                  React.createElement(
                            'div',
                    { style: { fontSize: 120, fontWeight: 800 } },
                            'Aloud'
                          ),
                  React.createElement(
                            'div',
                    { style: { fontSize: 36, marginTop: 20, opacity: 0.9 } },
                            'Turn any PDF into natural-sounding speech'
                          )
                ),
      { ...size }
        )
}
