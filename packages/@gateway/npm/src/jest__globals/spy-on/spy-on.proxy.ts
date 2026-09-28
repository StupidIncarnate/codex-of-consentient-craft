// Empty proxy — this wrapper calls jest.spyOn directly. Mocking the mocking mechanism itself would
// leave a test asserting against a fake spy rather than against Jest's own tracked one.
export const spyOnProxy = (): Record<PropertyKey, never> => ({});
