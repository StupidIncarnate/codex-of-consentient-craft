// argsMatcher is a pure function — nothing to mock, so every *-run.proxy.ts composing it still
// satisfies gateway colocation without describing any boundary.
export const argMatcherProxy = (): Record<PropertyKey, never> => ({});
