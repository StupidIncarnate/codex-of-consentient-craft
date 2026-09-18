// PURPOSE: Empty. This layer builds a page-side source STRING and translates what comes back; the
// parent adapter owns `page.evaluate`, so there is no npm boundary here to mock.
// USAGE: rootCheckLayerAdapterProxy();

export const rootCheckLayerAdapterProxy = (): Record<PropertyKey, never> => ({});
