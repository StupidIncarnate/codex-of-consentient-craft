// A real `require.resolve` walk against real node_modules, not registerMock — the test file's own
// `require` is a different per-file CommonJS binding from the implementation's, so spying on one
// never intercepts the other. The colocated test resolves real, already-installed workspace
// packages instead.
export const resolvePackageRootProxy = (): Record<PropertyKey, never> => ({});
