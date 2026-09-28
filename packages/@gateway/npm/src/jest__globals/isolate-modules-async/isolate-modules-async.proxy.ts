// Empty proxy — this wrapper calls jest.isolateModulesAsync directly, the same test-sandboxing
// mechanism a proxy would otherwise fake.
export const isolateModulesAsyncProxy = (): Record<PropertyKey, never> => ({});
