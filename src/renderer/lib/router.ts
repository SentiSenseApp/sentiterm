export function matchRoute(route: string, pattern: string): Record<string, string> | null {
  const routeParts = route.split('/')
  const patternParts = pattern.split('/')

  if (routeParts.length !== patternParts.length) return null

  const params: Record<string, string> = {}
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = routeParts[i]
    } else if (patternParts[i] !== routeParts[i]) {
      return null
    }
  }
  return params
}

export function buildRoute(pattern: string, params: Record<string, string>): string {
  return pattern.replace(/:(\w+)/g, (_, key) => params[key] || '')
}
