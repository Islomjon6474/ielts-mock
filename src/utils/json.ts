// Reusable JSON helpers: safe parse / stringify and normalization

export function safeStringifyJson(value: any): string {
  try {
    return JSON.stringify(value)
  } catch (e) {
    console.error('safeStringifyJson failed:', e)
    return ''
  }
}

export function looksLikeJson(str: string): boolean {
  if (typeof str !== 'string') return false
  const s = str.trim()
  return (s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))
}

export function safeParseJson<T = any>(value: any): T | null {
  if (value == null) return null as any
  if (typeof value !== 'string') return value as T
  const s = value.trim()
  if (!looksLikeJson(s)) return value as T // not JSON
  try {
    return JSON.parse(s) as T
  } catch (e) {
    console.warn('safeParseJson failed, returning raw string')
    return value as T
  }
}

// Some historical data may be double-encoded; attempt parsing up to maxDepth times
export function safeMultiParseJson<T = any>(value: any, maxDepth = 3): T | null {
  let current: any = value
  for (let i = 0; i < maxDepth; i++) {
    if (typeof current === 'string') {
      const s = current.trim()
      // Case 1: Looks like raw JSON
      if (looksLikeJson(s)) {
        try {
          current = JSON.parse(s)
          continue
        } catch {
          // fallthrough to try quoted unwrap
        }
      }
      // Case 2: Quoted JSON string (e.g., "{\"a\":1}")
      if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
        try {
          const unwrapped = JSON.parse(s) // parse outer quotes -> inner string
          if (typeof unwrapped === 'string' && looksLikeJson(unwrapped)) {
            try {
              current = JSON.parse(unwrapped)
              continue
            } catch {
              current = unwrapped
              continue
            }
          }
          current = unwrapped
          continue
        } catch {
          // cannot unwrap, stop
        }
      }
      // If we get here, cannot parse further
      break
    } else {
      // Already an object/array -> stop
      break
    }
  }
  return current as T
}

// Normalize arrays that may arrive as JSON strings or objects with numeric keys
export function normalizeArrayMaybeStringOrObject<T = any>(value: any): T[] {
  let result: any = value
  result = safeMultiParseJson(result)

  if (Array.isArray(result)) return result as T[]
  if (result && typeof result === 'object') return Object.values(result) as T[]
  return []
}
