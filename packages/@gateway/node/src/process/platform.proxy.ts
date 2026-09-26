// A captured global, not an npm dependency — the colocated test compares it to process.platform
// directly rather than staging a mock.
export const platformProxy = (): Record<PropertyKey, never> => ({});
