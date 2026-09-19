// Pure: the bytes arrive as a parameter and nothing here reads disk, a clock or the registry, so
// the layer runs real in every test with nothing to stage.
export const questRecordParseLayerBrokerProxy = (): Record<PropertyKey, never> => ({});
