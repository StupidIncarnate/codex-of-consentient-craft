// createHash is deterministic and pure over its input — nothing to mock. The test runs the real
// digest, the same reasoning `crypto-hash-files-adapter.proxy.ts` in @dungeonmaster/ward gives for
// leaving createHash unmocked while mocking only the actual I/O it composes with.
export const cryptoHashAdapterProxy = (): Record<PropertyKey, never> => ({});
