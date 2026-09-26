// A captured global, not an npm dependency — the colocated test compares it to process.pid
// directly rather than staging a mock.
export const pidProxy = (): Record<PropertyKey, never> => ({});
