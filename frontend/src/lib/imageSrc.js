export const imageSrc = (value, fallback) => {
  if (typeof value === 'string' && value.trim()) return value
  if (value && typeof value === 'object' && typeof value.src === 'string') return value.src
  return fallback
}
