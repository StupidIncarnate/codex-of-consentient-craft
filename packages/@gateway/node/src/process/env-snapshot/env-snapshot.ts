/**
 * PURPOSE: Copies the whole environment at the moment of the call. Reach for this when a child
 * process gets `{ ...envSnapshot(), EXTRA: 'x' }`; the copy is independent, so a later `setEnv`
 * never changes an object already handed to a child, and changing the copy never touches the live
 * environment. Read at call time, so a test that swaps `process.env` is seen.
 *
 * USAGE:
 * const env = envSnapshot();
 * // Returns a plain object holding every variable process.env holds right now
 */

export const envSnapshot = (): NodeJS.ProcessEnv => ({ ...process.env });
