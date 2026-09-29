// process.env is a plain object, not an npm dependency — the colocated test reads it back and
// deletes its own keys directly rather than staging a mock.
export const setEnvProxy = (): Record<PropertyKey, never> => ({});
