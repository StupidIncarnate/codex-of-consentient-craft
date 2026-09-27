// NO mocking — barrelNoTestSupportReexportLayerBroker only inspects the reexports list it is handed
// and calls the context it is given; there is no I/O boundary to stage.
export const barrelNoTestSupportReexportLayerBrokerProxy = (): Record<PropertyKey, never> => ({});
