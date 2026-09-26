// A captured global, not an npm dependency — the colocated test compares it to process.argv
// directly rather than staging a mock.
export const argvProxy = (): Record<PropertyKey, never> => ({});
