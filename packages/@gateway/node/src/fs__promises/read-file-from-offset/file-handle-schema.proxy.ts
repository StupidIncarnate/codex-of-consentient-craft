// A zod chain over `custom`, no I/O to mock — the colocated test drives real `.parse()` calls
// against FileHandleStub(), the same way a contract's own schema needs no proxy.
export const fileHandleSchemaProxy = (): Record<PropertyKey, never> => ({});
