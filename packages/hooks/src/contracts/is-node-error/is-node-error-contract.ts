/**
 * PURPOSE: Type guard checking if error is a Node.js ErrnoException
 *
 * USAGE:
 * if (isNodeErrorContract({ error })) { const nodeError = error as NodeJS.ErrnoException; }
 * // Returns true if error is an Error with a code property (use type assertion after check)
 *
 * NOTE: TypeScript does not support type predicates with destructured parameters.
 * After checking with this guard, use type assertion: error as NodeJS.ErrnoException
 */
export const isNodeErrorContract = ({ error }: { error: unknown }): boolean =>
  error instanceof Error && 'code' in error;
