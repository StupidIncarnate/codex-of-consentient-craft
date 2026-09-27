// A zod chain over a pure predicate, no I/O to mock — the colocated test drives real `.parse()`
// calls, the same way a contract's own schema needs no proxy.
export const walkedFileSchemaProxy = (): Record<PropertyKey, never> => ({});
