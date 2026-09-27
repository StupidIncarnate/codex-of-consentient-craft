// Pure predicate, no I/O to mock — a WalkedFile-shaped object is trivial to build inline, so unlike
// isFsErrorProxy (which builds realm-safe Error values) this proxy needs no semantic builder either.
export const isWalkedFileProxy = (): Record<PropertyKey, never> => ({});
