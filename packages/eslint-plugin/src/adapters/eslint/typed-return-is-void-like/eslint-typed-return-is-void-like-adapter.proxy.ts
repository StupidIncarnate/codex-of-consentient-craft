// A typed-linting DSL boundary, like the other typed adapters beside it: it runs fully real against
// a real TypeScript program, so there is nothing to mock here.
export const eslintTypedReturnIsVoidLikeAdapterProxy = (): Record<PropertyKey, never> => ({});
