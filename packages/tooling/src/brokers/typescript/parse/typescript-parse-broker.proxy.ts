// `#gateway/npm/typescript` is a pure pass-through with no proxy of its own — nothing to mock, so
// this broker's parsing runs for real in its own test.
export const typescriptParseBrokerProxy = (): Record<PropertyKey, never> => ({});
