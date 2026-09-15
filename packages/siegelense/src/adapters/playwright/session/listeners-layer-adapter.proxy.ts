// listenersLayerAdapter is pure — every method takes plain values and returns a ContentText JSON
// line, with no npm package or global underneath it to mock.
export const listenersLayerAdapterProxy = (): Record<PropertyKey, never> => ({});
