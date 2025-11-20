/**
 * Empty proxy - This adapter mocks child_process itself
 * No proxy needed because childProcessMockerAdapter returns methods that mock child_process.spawn directly
 */

export const childProcessMockerAdapterProxy = (): Record<PropertyKey, never> => ({});
