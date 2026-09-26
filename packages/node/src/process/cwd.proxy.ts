// process.cwd() is a real read with nothing to fake — the colocated test compares its own
// call against process.cwd() directly, allowed here by the same no-bare-process-cwd
// exemption that covers this whole folder.
export const cwdProxy = (): Record<PropertyKey, never> => ({});
