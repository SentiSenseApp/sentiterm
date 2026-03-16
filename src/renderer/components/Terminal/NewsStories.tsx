import React from 'react'
import { useAppStore } from '../../store'
import { useSentiSenseQuery } from '../../hooks/useSentiSense'
import { fetchStories, fetchStoriesByTicker } from '../../lib/api'
import type { TerminalStory } from '../../lib/types'

interface Props { ticker?: string }

function timeAgo(publishedAt: string): string {
  const diff = Date.now() - new Date(publishedAt).getTime()
  const hrs = Math.floor(diff / 3_600_000)
  if (hrs < 1) return 'Just now'
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function StoryCard({ story }: { story: TerminalStory }) {
  const { navigate } = useAppStore()

  return (
    <div
      className="terminal-card p-4 hover:border-terminal-accent/30 transition-colors cursor-pointer"
      onClick={() => navigate(`/stories/${story.id}`, { clusterId: story.id })}
    >
      {/* Row 1: Metadata */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
          story.sentimentLabel === 'bullish' ? 'badge-bullish'
          : story.sentimentLabel === 'bearish' ? 'badge-bearish'
          : 'badge-neutral'
        }`}>
          {story.sentimentLabel.toUpperCase()}
        </span>
        <span className="text-terminal-muted/50 text-[10px] font-mono">
          {story.sourceCount} sources {'\u00B7'} {timeAgo(story.publishedAt)}
        </span>
      </div>

      {/* Row 2: Title */}
      <h3 className="text-sm font-medium text-terminal-text leading-snug mb-1.5 line-clamp-2">
        {story.title}
      </h3>

      {/* Row 3: Summary */}
      <p className="text-xs text-terminal-muted leading-relaxed line-clamp-2 mb-2">
        {story.summary}
      </p>

      {/* Row 4: Ticker chips */}
      {(story.tickers ?? []).length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {(story.tickers ?? []).slice(0, 5).map(t => (
            <button
              key={t}
              onClick={(e) => { e.stopPropagation(); navigate(`/stocks/${t}`, { ticker: t }) }}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-terminal-accent/10 text-terminal-accent hover:bg-terminal-accent/20 transition-colors"
            >
              {t}
            </button>
          ))}
          {(story.tickers ?? []).length > 5 && (
            <span className="text-[10px] font-mono text-terminal-muted/50">
              +{(story.tickers ?? []).length - 5}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export function NewsStories({ ticker }: Props) {
  const { settings } = useAppStore()
  const apiKey = settings.sentiSenseApiKey
  const { data: stories } = useSentiSenseQuery<TerminalStory[]>(
    async () => ticker ? fetchStoriesByTicker(apiKey, ticker) : fetchStories(apiKey),
    [apiKey, ticker]
  )

  return (
    <div className={ticker ? 'space-y-3' : 'p-6 space-y-4'}>
      {!ticker && <h1 className="text-xl font-semibold text-terminal-text">AI News Stories</h1>}
      {!stories?.length && <div className="text-terminal-muted text-sm font-mono p-4">No stories found.</div>}
      <div className="space-y-3">
        {stories?.map(story => <StoryCard key={story.id} story={story} />)}
      </div>
    </div>
  )
}
