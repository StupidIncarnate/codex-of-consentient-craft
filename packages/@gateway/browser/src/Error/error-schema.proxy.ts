// A zod chain over `instanceof`, no I/O to mock — the colocated test drives real `.parse()` calls
// against ErrorStub(), the same way a contract's own schema needs no proxy.
export const errorSchemaProxy = (): Record<PropertyKey, never> => ({});
