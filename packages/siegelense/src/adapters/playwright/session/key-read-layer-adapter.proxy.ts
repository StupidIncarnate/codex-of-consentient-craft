// PURPOSE: Empty. This layer builds a source STRING and translates what comes back; the parent
// adapter owns the one `page.evaluate` call, so there is no npm boundary here to mock.
// USAGE: keyReadLayerAdapterProxy();

export const keyReadLayerAdapterProxy = (): Record<PropertyKey, never> => ({});
