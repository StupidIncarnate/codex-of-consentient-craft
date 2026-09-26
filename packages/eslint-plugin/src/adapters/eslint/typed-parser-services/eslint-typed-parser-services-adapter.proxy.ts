// A typed-linting DSL boundary, like the ESLint RuleTester adapters beside it: it runs fully real
// to validate against a real TypeScript program, so there is nothing to mock here.
export const eslintTypedParserServicesAdapterProxy = (): Record<PropertyKey, never> => ({});
