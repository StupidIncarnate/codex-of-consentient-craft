// Composes two real npm calls (@testing-library/react's own render, @mantine/core's own
// MantineProvider) with no I/O of their own — no filesystem, no network, no clock. The test
// mounts a real component and reads back real Mantine context, the same reasoning
// mantineRenderAdapterProxy gives for leaving this deterministic call unmocked.
export const renderProxy = (): Record<PropertyKey, never> => ({});
