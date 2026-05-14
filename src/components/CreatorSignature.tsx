'use client'

import { CREATOR } from '@/lib/creator'
import { useEffect } from 'react'

interface CreatorSignatureProps {
  variant?: 'badge' | 'inline' | 'console'
  projectName?: string
}

function ConsoleWatermark({ projectName }: { projectName: string }) {
  useEffect(() => {
    const style = `
      font-size: 14px;
      font-weight: bold;
      color: #7fffd4;
      background: #030b14;
      padding: 8px 12px;
      border-radius: 4px;
      line-height: 1.6;
    `
    const dimStyle = `
      font-size: 11px;
      color: #5a9a8a;
      background: #030b14;
      padding: 0 12px 8px 12px;
      border-radius: 0 0 4px 4px;
      line-height: 1.5;
    `
    console.log(
      `%c${projectName} - ${CREATOR.name} (${CREATOR.alias})\n\n${CREATOR.role} - ${CREATOR.location}`,
      style
    )
    console.log(
      `%c${CREATOR.github}`,
      dimStyle
    )
  }, [projectName])

  return null
}

export default function CreatorSignature({
  variant = 'badge',
  projectName = 'Sniply',
}: CreatorSignatureProps) {
  if (variant === 'console') {
    return <ConsoleWatermark projectName={projectName} />
  }

  if (variant === 'inline') {
    return (
      <span className="text-xs text-muted-foreground">
        {projectName} - {CREATOR.name} - {CREATOR.alias}
      </span>
    )
  }

  // Default: badge variant, fixed bottom-right monogram.
  return (
    <a
      href={CREATOR.github}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-50 group"
      aria-label={`${projectName} - ${CREATOR.signature}`}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/10 opacity-55 backdrop-blur-sm transition-all duration-300 hover:opacity-100 hover:bg-foreground/15 hover:scale-110 hover:shadow-lg">
        <span className="text-[11px] font-bold tracking-tight text-foreground">
          {CREATOR.shortSignature}
        </span>
      </div>
    </a>
  )
}
