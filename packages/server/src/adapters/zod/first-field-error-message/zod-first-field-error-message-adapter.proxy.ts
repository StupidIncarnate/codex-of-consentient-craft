// This adapter wraps a pure function (z.treeifyError has no I/O to intercept) — see the
// "Empty Proxy Pattern (DSL/Query Adapters)" convention: it runs real in tests against a real
// ZodError so the field-selection logic is validated against the actual system.
export const zodFirstFieldErrorMessageAdapterProxy = (): Record<PropertyKey, never> => ({});
