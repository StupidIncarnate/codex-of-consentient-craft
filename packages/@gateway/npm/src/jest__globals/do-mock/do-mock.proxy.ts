// Empty proxy — this wrapper calls jest.doMock directly, the same test-mocking mechanism a proxy
// would otherwise fake.
export const doMockProxy = (): Record<PropertyKey, never> => ({});
