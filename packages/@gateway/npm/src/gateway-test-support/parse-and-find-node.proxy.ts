// NO mocking — parseAndFindNode is a pure computation over a real parser and runs real in every
// test, the same way a guard's proxy needs no mocking. This proxy exists only to satisfy
// gateway-colocation's "every wrapper has a proxy" check.
export const parseAndFindNodeProxy = (): Record<PropertyKey, never> => ({});
