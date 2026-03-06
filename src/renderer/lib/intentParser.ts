import { FUNCTION_REGISTRY, type FunctionDef } from '../components/CommandBar/registry'

export interface ParsedIntent {
  fn: FunctionDef
  route: string
  params: Record<string, string>
}

export function parseIntent(query: string): ParsedIntent | null {
  const trimmed = query.trim()
  if (!trimmed) return null

  // Check aliases first (exact match, case insensitive)
  const upperQuery = trimmed.toUpperCase()
  for (const fn of FUNCTION_REGISTRY) {
    if (fn.aliases.includes(upperQuery)) {
      return { fn, route: fn.route, params: {} }
    }
    // Check "ALIAS TICKER" pattern like "HDS AAPL"
    for (const alias of fn.aliases) {
      const aliasPattern = new RegExp(`^${alias}\\s+([A-Z]{1,5})$`, 'i')
      const aliasMatch = trimmed.match(aliasPattern)
      if (aliasMatch && fn.params) {
        const params = fn.params(aliasMatch)
        const route = fn.route.replace(/:(\w+)/g, (_, key) => params[key] || '')
        return { fn, route, params }
      }
    }
  }

  // Check regex patterns
  for (const fn of FUNCTION_REGISTRY) {
    for (const pattern of fn.patterns) {
      const match = trimmed.match(pattern)
      if (match) {
        const params = fn.params ? fn.params(match) : {}
        const route = fn.route.replace(/:(\w+)/g, (_, key) => params[key] || '')
        return { fn, route, params }
      }
    }
  }

  return null
}
