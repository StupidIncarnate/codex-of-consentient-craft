// React is not mocked - it runs real in tests via the __mocks__ passthrough
export const reactModuleAdapterProxy = (): Record<PropertyKey, never> => ({});
