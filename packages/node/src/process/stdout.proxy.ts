// A captured global, not an npm dependency — the colocated test compares it to process.stdout
// directly rather than staging a mock.
export const stdoutProxy = (): Record<PropertyKey, never> => ({});
