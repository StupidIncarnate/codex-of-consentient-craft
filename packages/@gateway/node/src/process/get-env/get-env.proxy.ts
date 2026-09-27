// process.env is a plain object, not an npm dependency — the colocated test sets and deletes its
// own keys directly rather than staging a mock.
export const getEnvProxy = (): Record<PropertyKey, never> => ({});
