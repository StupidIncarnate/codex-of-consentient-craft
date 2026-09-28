// Empty proxy — this wrapper calls jest.fn directly, the same mock-construction mechanism a proxy
// would otherwise fake.
export const fnProxy = (): Record<PropertyKey, never> => ({});
