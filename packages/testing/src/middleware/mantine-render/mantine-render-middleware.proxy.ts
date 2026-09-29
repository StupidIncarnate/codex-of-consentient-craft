// The gateway's `render` and Mantine's `MantineProvider` do no I/O — no filesystem, no network, no
// clock — so the test mounts a real component and reads back real Mantine context.
export const mantineRenderMiddlewareProxy = (): Record<PropertyKey, never> => ({});
