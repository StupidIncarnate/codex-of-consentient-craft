// A zod chain over `instanceof`, no I/O to mock — the colocated test drives real `.parse()` calls
// against ChildProcessStub(), the same way a contract's own schema needs no proxy.
export const childProcessSchemaProxy = (): Record<PropertyKey, never> => ({});
