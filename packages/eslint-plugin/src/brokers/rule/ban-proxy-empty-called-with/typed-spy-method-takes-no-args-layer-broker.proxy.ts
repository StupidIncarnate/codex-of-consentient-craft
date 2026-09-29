/**
 * Proxy for typedSpyMethodTakesNoArgsLayerBroker. It resolves nothing until a full typed lint pass
 * has built a TypeScript program, so its own test runs real ESLint over a real program instead of
 * staging a mock.
 */
export const typedSpyMethodTakesNoArgsLayerBrokerProxy = (): Record<PropertyKey, never> => ({});
