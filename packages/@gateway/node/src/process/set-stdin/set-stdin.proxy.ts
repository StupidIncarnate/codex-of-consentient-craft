// process.stdin is a global property with no mockable call surface, and the wrapper itself swaps
// and restores the descriptor, so there is nothing to stage.
export const setStdinProxy = (): Record<PropertyKey, never> => ({});
