// PURPOSE: Empty. This layer builds a source STRING and translates what comes back; the parent
// adapter owns the one `page.evaluate` and `keyboard.press` calls, so there is no npm boundary here to mock.
// USAGE: keyPressLayerAdapterProxy();

export const keyPressLayerAdapterProxy = (): Record<PropertyKey, never> => ({});
