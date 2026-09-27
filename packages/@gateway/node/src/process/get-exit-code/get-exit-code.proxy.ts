// process.exitCode is a plain property, not an npm dependency — the colocated test sets and
// restores it directly rather than staging a mock.
export const getExitCodeProxy = (): Record<PropertyKey, never> => ({});
