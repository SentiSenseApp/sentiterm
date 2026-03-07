import { useState, useEffect, useCallback } from 'react'

function classifyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  const lower = msg.toLowerCase()
  if (lower.includes('401') || lower.includes('403') || lower.includes('authentication') || lower.includes('unauthorized'))
    return 'Invalid API key. Check your key in Settings.'
  if (lower.includes('429') || lower.includes('rate limit'))
    return 'Rate limited. Please wait a moment and try again.'
  if (lower.includes('404') || lower.includes('not found'))
    return 'Data not available.'
  if (lower.includes('fetch') || lower.includes('network') || lower.includes('timeout') || lower.includes('econnrefused'))
    return 'Connection failed. Check your network.'
  return msg || 'Unknown error'
}

export function useSentiSenseQuery<T>(
  queryFn: () => Promise<T>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await queryFn()
      setData(result)
    } catch (err) {
      setError(classifyError(err))
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
