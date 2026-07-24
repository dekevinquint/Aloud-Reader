import { ImageResponse } from 'next/og'
import React from 'react'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
    return new ImageResponse(
          React.createElement(
                  'div',
            {
                      style: {
                                  width: '100%',
                                  height: '100%',
                                  background: '#4f46e5',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: 96,
                                  fontWeight: 700,
                                  fontFamily: 'sans-serif',
                      },
            },
                  'A'
                ),
      { ...size }
        )
}
