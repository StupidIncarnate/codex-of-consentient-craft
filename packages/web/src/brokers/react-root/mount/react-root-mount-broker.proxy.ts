// createRoot runs for real against jsdom: the element it mounts into is the test's own, and what it
// renders is read back from the document, so nothing here is staged.
export const reactRootMountBrokerProxy = (): Record<PropertyKey, never> => ({});
