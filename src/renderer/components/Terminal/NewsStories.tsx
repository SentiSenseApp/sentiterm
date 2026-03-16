import React from 'react'
import { useAppStore } from '../../store'
import { useSentiSenseQuery } from '../../hooks/useSentiSense'
import { fetchStories, fetchStoriesByTicker } from '../../lib/api'
import type { TerminalStory } from '../../lib/types'

interface Props { ticker?: string }

export function NewsStories({ ticker }: Props) {
  const { navigate, settings } = useAppStore()
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
        {stories?.map(story => (
          <div
            key={story.id}
            className="terminal-card p-4 hover:border-terminal-accent/30 transition-colors cursor-pointer"
            onClick={() => { if (story.tickers?.[0]) navigate(`/stocks/${story.tickers[0]}`, { ticker: story.tickers[0] }) }}
          >
            {/* Row 1: Sentiment + Category + Time */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                story.sentimentLabel === 'bullish' ? 'badge-bullish'
                : story.sentimentLabel === 'bearish' ? 'badge-bearish'
                : 'badge-neutral'
              }`}>
                {story.sentimentLabel.toUpperCase()}
              </span>
              <span className="text-terminal-muted text-[10px] font-mono">{story.category}</span>
              <span className="text-terminal-muted/40 text-[10px] font-mono">{'\u2022'}</span>
              <span className="text-terminal-muted/40 text-[10px] font-mono">
                {new Date(story.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-terminal-muted/40 text-[10px] font-mono">{'\u2022'}</span>
              <span className="text-terminal-muted/40 text-[10px] font-mono">{story.sourceCount} sources</span>
            </div>

            {/* Row 2: Title (full width) */}
            <h3 className="text-sm font-medium text-terminal-text mb-1.5 leading-snug line-clamp-2">
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
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-terminal-accent/10 text-terminal-accent hover:bg-terminal-accent/20 transition-colors"
                  >
                    {t}
                  </button>
                ))}
                {(story.tickers ?? []).length > 5 && (
                  <span className="text-[10px] font-mono text-terminal-muted/50">
                    +{(story.tickers ?? []).length - 5} more
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
