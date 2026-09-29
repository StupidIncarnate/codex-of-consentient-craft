/**
 * Proxy for ban-type-aliases rule broker.
 * Empty proxy - ESLint rules run with real parsing to validate DSL logic.
 */
export const ruleBanTypeAliasesBrokerProxy = (): Record<PropertyKey, never> => ({});
