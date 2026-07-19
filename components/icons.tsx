import type { SVGProps } from "react"

export function PlayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.29-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
    </svg>
  )
}

export function PauseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M8 5a1 1 0 0 0-1 1v12a1 1 0 0 0 2 0V6a1 1 0 0 0-1-1Zm8 0a1 1 0 0 0-1 1v12a1 1 0 0 0 2 0V6a1 1 0 0 0-1-1Z" />
    </svg>
  )
}

export function PrevIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M7 6a1 1 0 0 1 2 0v4.6l8.4-5.25A1 1 0 0 1 19 6.1v11.8a1 1 0 0 1-1.6.8L9 13.4V18a1 1 0 1 1-2 0V6Z" />
    </svg>
  )
}

export function NextIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M17 6a1 1 0 0 0-2 0v4.6L6.6 5.35A1 1 0 0 0 5 6.1v11.8a1 1 0 0 0 1.6.8L15 13.4V18a1 1 0 1 0 2 0V6Z" />
    </svg>
  )
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M12 4a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6V5a1 1 0 0 1 1-1Z" />
    </svg>
  )
}

export function GearIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" />
      <path
        d="M10.6 2.4a1 1 0 0 1 .98-.8h.84a1 1 0 0 1 .98.8l.3 1.5a7.9 7.9 0 0 1 1.6.93l1.44-.5a1 1 0 0 1 1.2.46l.42.72a1 1 0 0 1-.22 1.27l-1.15.98c.06.3.09.61.09.93s-.03.63-.09.93l1.15.98a1 1 0 0 1 .22 1.27l-.42.72a1 1 0 0 1-1.2.46l-1.44-.5a7.9 7.9 0 0 1-1.6.93l-.3 1.5a1 1 0 0 1-.98.8h-.84a1 1 0 0 1-.98-.8l-.3-1.5a7.9 7.9 0 0 1-1.6-.93l-1.44.5a1 1 0 0 1-1.2-.46l-.42-.72a1 1 0 0 1 .22-1.27l1.15-.98a5.7 5.7 0 0 1 0-1.86l-1.15-.98a1 1 0 0 1-.22-1.27l.42-.72a1 1 0 0 1 1.2-.46l1.44.5c.5-.38 1.03-.7 1.6-.93l.3-1.5Z"
        opacity=".55"
      />
    </svg>
  )
}

export function DownloadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M12 3a1 1 0 0 1 1 1v9.585l2.293-2.292a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L11 13.585V4a1 1 0 0 1 1-1Z" />
      <path d="M5 19a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1Z" />
    </svg>
  )
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M6.4 5A1 1 0 0 0 5 6.4L10.6 12 5 17.6A1 1 0 0 0 6.4 19L12 13.4 17.6 19a1 1 0 0 0 1.4-1.4L13.4 12 19 6.4A1 1 0 0 0 17.6 5L12 10.6 6.4 5Z" />
    </svg>
  )
}
