/**
 * PURPOSE: Ends the process with an optional exit code. Keeps `process.exit`'s own
 * calling shape and `never` return type, since the wrapper keeps the outside function's name.
 *
 * USAGE:
 * exit(1);
 * // Never returns; the process has already exited
 */

export const exit = (code?: number): never => process.exit(code);
