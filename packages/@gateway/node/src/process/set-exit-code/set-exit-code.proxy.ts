// process.exitCode is a plain property, not an npm dependency — the colocated test reads it
// back directly rather than staging a mock.
export const setExitCodeProxy = (): Record<PropertyKey, never> => ({});
