import React from 'react'

interface SparklineProps {
  data: number[]
  color?: string
  height?: number
  width?: number
}

export function SparklineChart({ data, color = '#3182CE', height = 40, width = 120 }: SparklineProps) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ── Area chart with gradient fill ──────────────────────

interface AreaChartProps {
  data: Array<{ date: string; close: number }>
  height?: number
  color?: string
}

export function AreaChart({ data, height = 160, color }: AreaChartProps) {
  if (data.length < 2) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-terminal-muted text-xs font-mono">
        No chart data available
      </div>
    )
  }

  const closes = data.map(d => d.close)
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const range = max - min || 1
  const padding = 2

  const isPositive = closes[closes.length - 1] >= closes[0]
  const strokeColor = color ?? (isPositive ? '#2DD4BF' : '#F87171')
  const gradientId = `area-grad-${isPositive ? 'up' : 'down'}`

  // SVG viewBox dimensions
  const vw = 600
  const vh = height

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (vw - padding * 2)
    const y = padding + (1 - (d.close - min) / range) * (vh - padding * 2)
    return { x, y }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = `${linePath} L${points[points.length - 1].x},${vh} L${points[0].x},${vh} Z`

  // Y-axis labels
  const yLabels = [max, (max + min) / 2, min]

  // X-axis: show ~5 date labels
  const step = Math.max(1, Math.floor(data.length / 5))
  const xLabels = data.filter((_, i) => i % step === 0 || i === data.length - 1)

  return (
    <div style={{ height }} className="relative">
      <svg viewBox={`0 0 ${vw} ${vh}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(pct => (
          <line
            key={pct}
            x1={padding} y1={padding + pct * (vh - padding * 2)}
            x2={vw - padding} y2={padding + pct * (vh - padding * 2)}
            stroke="rgba(30,32,53,0.6)" strokeWidth="1"
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Line */}
        <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>

      {/* Y-axis labels */}
      <div className="absolute top-0 right-1 h-full flex flex-col justify-between py-1 pointer-events-none">
        {yLabels.map((v, i) => (
          <span key={i} className="text-[9px] font-mono text-terminal-muted/40">
            ${v.toFixed(v >= 1000 ? 0 : 2)}
          </span>
        ))}
      </div>

      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 right-8 flex justify-between px-1 pointer-events-none">
        {xLabels.map((d, i) => (
          <span key={i} className="text-[9px] font-mono text-terminal-muted/30">
            {new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        ))}
      </div>
    </div>
  )
}
