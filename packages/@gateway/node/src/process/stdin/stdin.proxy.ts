// A captured global, not an npm dependency — the colocated test compares it to process.stdin
// directly rather than staging a mock.
export const stdinProxy = (): Record<PropertyKey, never> => ({});
