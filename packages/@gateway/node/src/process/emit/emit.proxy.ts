// process.emit runs the handlers really registered on the process — the colocated test registers
// its own handler and reads what it received, so there is nothing to stage.
export const emitProxy = (): Record<PropertyKey, never> => ({});
