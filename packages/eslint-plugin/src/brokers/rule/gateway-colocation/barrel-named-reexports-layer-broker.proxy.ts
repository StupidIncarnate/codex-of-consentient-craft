// NO mocking — barrelNamedReexportsLayerBroker is a pure AST walk and runs real in every test.
export const barrelNamedReexportsLayerBrokerProxy = (): Record<PropertyKey, never> => ({});
