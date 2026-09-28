// Empty proxy — this wrapper calls jest.resetModules directly, the same registry a proxy would
// otherwise fake.
export const resetModulesProxy = (): Record<PropertyKey, never> => ({});
