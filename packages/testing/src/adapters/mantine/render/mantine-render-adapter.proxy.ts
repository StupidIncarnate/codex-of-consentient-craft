// Composes two real calls (the gateway's own `render`, itself a pass-through of
// @testing-library/react's `render`, and @mantine/core's own `MantineProvider`) with no I/O of
// their own — no filesystem, no network, no clock. The test mounts a real component and reads back
// real Mantine context, the same reasoning the gateway's own (now-deleted) render proxy gave for
// leaving this deterministic call unmocked.
export const mantineRenderAdapterProxy = (): Record<PropertyKey, never> => ({});
