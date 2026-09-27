// Real TCP sockets against loopback, not registerMock — see is-port-free.proxy.ts's own note.
export const freePortPairProxy = (): Record<PropertyKey, never> => ({});
