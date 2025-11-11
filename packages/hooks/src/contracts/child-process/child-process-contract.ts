/**
 * PURPOSE: Zod schema for Node.js ChildProcess with minimal required properties
 *
 * USAGE:
 * const process = childProcessContract.parse({ pid: 1234 });
 * // Returns validated ChildProcess object
 */
import { z } from 'zod';

export const childProcessContract = z.object({
  pid: z.number().int().brand<'ProcessId'>().optional(),
  stdin: z.unknown().nullable().optional(),
  stdout: z.unknown().nullable().optional(),
  stderr: z.unknown().nullable().optional(),
  stdio: z.unknown().optional(),
});

export type ChildProcess = z.infer<typeof childProcessContract>;
