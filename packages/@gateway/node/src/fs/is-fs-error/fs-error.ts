/**
 * PURPOSE: The shape `isFsError` works with, declared on its own so a caller names it through
 * `#gateway/node/fs` without importing the function.
 *
 * USAGE:
 * import type { FsError } from '#gateway/node/fs';
 */

// Extends Error (not a bare shape) because FsErrorStub builds a real `Error` instance — needed so
// `registerMock`'s `.rejects()` staging and Jest's `.toThrow()` both accept it without rewrapping
// or a type error; `isFsError` itself only ever reads `.code` off `unknown`; it never assumes this
// type going in.
export interface FsError extends Error {
  code: string;
  path?: string;
  syscall?: string;
}
