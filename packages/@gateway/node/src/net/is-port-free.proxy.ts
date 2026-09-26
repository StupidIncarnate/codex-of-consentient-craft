// Real TCP sockets against loopback, not registerMock — a port bind is exactly the kind of
// small, deterministic, no-network-hop I/O that is more honestly proven by doing it than by
// staging `net.createServer`'s event-emitter shape. The colocated test drives real servers.
export const isPortFreeProxy = (): Record<PropertyKey, never> => ({});
