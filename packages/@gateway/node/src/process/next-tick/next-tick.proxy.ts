// process.nextTick is a real scheduler with nothing to fake — the colocated test observes the
// order callbacks run in directly.
export const nextTickProxy = (): Record<PropertyKey, never> => ({});
