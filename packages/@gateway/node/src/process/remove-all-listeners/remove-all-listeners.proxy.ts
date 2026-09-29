// Read-back and restore for the real process emitter. `restoreListeners` removes whatever the
// scenario added and puts back the handlers that were registered when the proxy was built, so a
// scenario that clears every event does not strip the test runner's own handlers.
export const removeAllListenersProxy = (): {
  listenerCount: (params: { event: string | symbol }) => number;
  eventNames: () => readonly (string | symbol)[];
  restoreListeners: () => void;
} => {
  const saved = process
    .eventNames()
    .map((name) => ({ name, listeners: process.rawListeners(name) }));

  return {
    listenerCount: ({ event }: { event: string | symbol }): number => process.listenerCount(event),

    eventNames: (): readonly (string | symbol)[] => process.eventNames(),

    restoreListeners: (): void => {
      process.removeAllListeners();
      saved.forEach(({ name, listeners }) => {
        listeners.forEach((listener) => {
          // A forwarding closure, not the original function: `rawListeners` hands back plain
          // `Function` values, which `process.on` does not accept without a cast.
          process.on(name, (...args: unknown[]) => Reflect.apply(listener, process, args));
        });
      });
    },
  };
};
