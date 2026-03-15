import React, { useEffect, useState, useRef } from 'react'

interface Props {
  url: string
  source: string
  onClose: () => void
  anchorRect: DOMRect
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' }
}

function isXUrl(url: string): boolean {
  const d = extractDomain(url)
  return d === 'x.com' || d === 'twitter.com'
}

function isRedditUrl(url: string): boolean {
  return extractDomain(url).includes('reddit.com')
}

export function FeedPreview({ url, source, onClose, anchorRect }: Props) {
  const [embedHtml, setEmbedHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Position the preview relative to the anchor
  const top = Math.min(anchorRect.top, window.innerHeight - 420)
  const left = anchorRect.right + 12

  useEffect(() => {
    let cancelled = false

    async function fetchEmbed() {
      try {
        const html = await window.api?.titles.oembed(url)
        if (!cancelled && html) {
          setEmbedHtml(html)
        } else if (!cancelled) {
          setError(true)
        }
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchEmbed()
    return () => { cancelled = true }
  }, [url])

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  const showEmbed = isXUrl(url) || isRedditUrl(url)

  if (!showEmbed) {
    // For news/substack: just open in browser
    window.open(url, '_blank')
    onClose()
    return null
  }

  return (
    <div
      ref={ref}
      className="fixed z-50 w-[400px] max-h-[400px] overflow-hidden rounded-xl border border-terminal-border bg-terminal-panel shadow-2xl shadow-black/50"
      style={{
        top: `${top}px`,
        left: `${Math.min(left, window.innerWidth - 420)}px`,
        animation: 'previewFadeIn 0.2s ease-out both',
      }}
    >
      <style>{`
        @keyframes previewFadeIn {
          from { opacity: 0; transform: translateX(-8px) scale(0.97); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-terminal-border/50">
        <span className="text-[10px] font-mono text-terminal-muted">
          {isXUrl(url) ? 'X POST PREVIEW' : 'REDDIT POST PREVIEW'}
        </span>
        <button onClick={onClose} className="text-terminal-muted hover:text-terminal-text text-xs">
          {'\u2715'}
        </button>
      </div>

      {/* Content */}
      <div className="p-3 overflow-auto max-h-[340px]">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-terminal-accent text-xs font-mono animate-pulse">Loading embed...</div>
          </div>
        )}

        {error && (
          <div className="text-center py-6 space-y-2">
            <p className="text-terminal-muted text-xs font-mono">Preview unavailable</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-terminal-accent text-xs font-mono hover:underline"
            >
              Open in browser {'\u2192'}
            </a>
          </div>
        )}

        {embedHtml && (
          <div
            className="embed-content [&_blockquote]:border-none [&_blockquote]:p-0 [&_blockquote]:m-0"
            dangerouslySetInnerHTML={{ __html: embedHtml }}
          />
        )}
      </div>
    </div>
  )
}
