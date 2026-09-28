// PURPOSE: Empty proxy — resetClearStorageLayerBroker takes an already-built BrowserSession and
// calls its own `clearStorage`/catches its own guard, with no adapter of its own to mock. A test
// builds the session directly with `BrowserSessionStub({ clearStorage: jest.fn()... })`.
// USAGE: resetClearStorageLayerBrokerProxy(); // satisfies enforce-proxy-child-creation only

export const resetClearStorageLayerBrokerProxy = (): Record<PropertyKey, never> => ({});
