// `import()` is a language primitive, not an npm package boundary — the colocated test drives it
// for real (a genuinely missing path, a genuinely broken file on disk) rather than mocking it, the
// same reasoning `resolve-package-root.proxy.ts` gives for its own empty proxy.
export const dynamicImportProxy = (): Record<PropertyKey, never> => ({});
