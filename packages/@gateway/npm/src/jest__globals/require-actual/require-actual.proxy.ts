// Empty proxy — this wrapper calls jest.requireActual directly to fetch the real module; mocking
// it would defeat the one job it has.
export const requireActualProxy = (): Record<PropertyKey, never> => ({});
