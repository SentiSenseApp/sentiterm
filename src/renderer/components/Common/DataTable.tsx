import React from 'react'

interface Column<T> {
  key: string
  header: string
  render: (item: T) => React.ReactNode
  align?: 'left' | 'right' | 'center'
  width?: string
}

interface Props<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (item: T) => void
}

export function DataTable<T>({ columns, data, onRowClick }: Props<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-mono">
        <thead>
          <tr className="border-b border-terminal-border">
            {columns.map(col => (
              <th
                key={col.key}
                className={`px-3 py-2 text-xs text-terminal-muted font-normal uppercase tracking-wider text-${col.align || 'left'}`}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(item)}
              className={`border-b border-terminal-border/50 ${onRowClick ? 'cursor-pointer hover:bg-terminal-surface/50' : ''} transition-colors`}
            >
              {columns.map(col => (
                <td key={col.key} className={`px-3 py-2 text-${col.align || 'left'}`}>
                  {col.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
