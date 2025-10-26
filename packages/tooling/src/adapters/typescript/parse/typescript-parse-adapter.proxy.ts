// Proxy for TypeScript parse adapter - runs real TypeScript parsing
// No mocking needed since it's a DSL/parser adapter that should validate logic

export const typescriptParseAdapterProxy = (): Record<PropertyKey, never> => ({});
