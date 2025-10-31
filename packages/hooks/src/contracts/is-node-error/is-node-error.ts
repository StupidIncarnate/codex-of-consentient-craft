/**
 * PURPOSE: Type guard checking if error is a Node.js ErrnoException
 *
 * USAGE:
 * if (isNodeError(error) && error.code === 'ENOENT') { }
 * // Returns true if error is an Error with a code property
 */
export const isNodeError = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error && 'code' in error;
