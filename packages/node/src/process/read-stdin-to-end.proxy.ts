// process.stdin itself is replaced per-test via Reflect.set (a global, not an npm dependency
// with its own mockable call surface) — the colocated test drives a real Readable in its place.
export const readStdinToEndProxy = (): Record<PropertyKey, never> => ({});
