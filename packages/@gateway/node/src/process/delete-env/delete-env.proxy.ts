// process.env is a plain object, not an npm dependency — the colocated test sets and reads its
// own keys directly rather than staging a mock.
export const deleteEnvProxy = (): Record<PropertyKey, never> => ({});
