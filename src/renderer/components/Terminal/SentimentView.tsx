import React from 'react'
import { useAppStore } from '../../store'
import { useSentiSenseQuery } from '../../hooks/useSentiSense'
import { fetchSentiment, fetchAISummary } from '../../lib/api'
import type { TerminalSentimentData, TerminalBullBearAnalysis } from '../../lib/types'

interface Props {
  ticker?: string
}

export function SentimentView({ ticker = 'AAPL' }: Props) {
  const apiKey = useAppStore().settings.sentiSenseApiKey
  const { data: sentiment } = useSentiSenseQuery<TerminalSentimentData>(
    async () => fetchSentiment(apiKey, ticker), [apiKey, ticker]
  )
  const { data: analysis } = useSentiSenseQuery<TerminalBullBearAnalysis>(
    async () => fetchAISummary(apiKey, ticker), [apiKey, ticker]
  )

  return (
    <div className="space-y-4">
      {sentiment && (
        <div className="terminal-card p-4">
          <div className="data-label mb-4">Sentiment Score</div>
          <div className="flex items-center gap-8">
            <div className="flex-1">
              <div className="flex justify-between text-sm font-mono mb-2">
                <span className="text-terminal-green font-semibold">{'\u2191'} Bull {sentiment.bullScore}%</span>
                <span className="text-terminal-red font-semibold">{'\u2193'} Bear {sentiment.bearScore}%</span>
              </div>
              <div className="h-4 bg-terminal-bg rounded-full overflow-hidden flex">
                <div className="bg-gradient-to-r from-terminal-green/90 to-terminal-green/60 h-full transition-all" style={{ width: `${sentiment.bullScore}%` }} />
                <div className="bg-gradient-to-r from-terminal-red/60 to-terminal-red/90 h-full transition-all" style={{ width: `${sentiment.bearScore}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 shrink-0">
              <div className="text-center"><div className="data-label">Confidence</div><div className="text-xl font-mono font-semibold text-terminal-text">{(sentiment.confidence * 100).toFixed(0)}%</div></div>
              <div className="text-center"><div className="data-label">Mentions</div><div className="text-xl font-mono font-semibold text-terminal-text">{sentiment.volume.toLocaleString()}</div></div>
              <div className="text-center"><div className="data-label">Trend</div><div className={`text-xl font-mono font-semibold ${sentiment.trend === 'rising' ? 'text-terminal-green' : sentiment.trend === 'falling' ? 'text-terminal-red' : 'text-terminal-muted'}`}>{sentiment.trend === 'rising' ? '\u2191 Rising' : sentiment.trend === 'falling' ? '\u2193 Falling' : '\u2194 Stable'}</div></div>
            </div>
          </div>
        </div>
      )}

      {analysis && (
        <div className="grid grid-cols-2 gap-4">
          <div className="terminal-card p-4">
            <div className="flex items-center gap-2 mb-3"><span className="text-terminal-green text-lg">{'\u2191'}</span><span className="data-label text-terminal-green">Bull Case</span></div>
            <div className="space-y-3">
              {analysis.bullCase.map((point, i) => (
                <div key={i} className="flex items-start gap-2 text-sm"><span className="text-terminal-green/50 shrink-0">{'\u25B8'}</span><span className="text-terminal-text/80">{point}</span></div>
              ))}
            </div>
          </div>
          <div className="terminal-card p-4">
            <div className="flex items-center gap-2 mb-3"><span className="text-terminal-red text-lg">{'\u2193'}</span><span className="data-label text-terminal-red">Bear Case</span></div>
            <div className="space-y-3">
              {analysis.bearCase.map((point, i) => (
                <div key={i} className="flex items-start gap-2 text-sm"><span className="text-terminal-red/50 shrink-0">{'\u25B8'}</span><span className="text-terminal-text/80">{point}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {analysis && (
        <div className="terminal-card p-4">
          <div className="flex items-center justify-between">
            <div><div className="data-label mb-1">Consensus</div><span className={`text-sm font-mono font-semibold ${analysis.consensus === 'bullish' ? 'text-terminal-green' : analysis.consensus === 'bearish' ? 'text-terminal-red' : 'text-terminal-amber'}`}>{analysis.consensus.toUpperCase()}</span></div>
            <div className="text-right"><div className="data-label mb-1">Analyst Rating</div><span className="text-lg font-mono font-semibold text-terminal-text">{analysis.analystRating.toFixed(1)}/5.0</span></div>
          </div>
        </div>
      )}

      <p className="text-terminal-muted/40 text-[10px] font-mono text-center">Sentiment data provided by SentiSense. Not financial advice.</p>
    </div>
  )
}
