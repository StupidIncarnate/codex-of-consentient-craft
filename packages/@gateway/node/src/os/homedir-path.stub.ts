/**
 * PURPOSE: A real absolute path, produced by actually calling `#gateway/node/os`'s own
 * re-exported `homedir()` — for a caller that needs a genuine OS path rather than a hand-typed one.
 *
 * USAGE:
 * const path = HomedirPathStub();
 * // Returns the real home directory of the process running the test
 */
import { homedir } from './os';

export const HomedirPathStub = (): string => homedir();
