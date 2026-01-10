/**
 * PURPOSE: Defines a process handle with kill and waitForExit capability for subprocess management
 *
 * USAGE:
 * const process: KillableProcess = { kill: () => subprocess.kill(), waitForExit: () => exitPromise };
 * process.kill();
 * await process.waitForExit();
 * // Terminates the subprocess and waits for full exit
 */

import { z } from 'zod';

export const killableProcessContract = z.object({
  kill: z.function().args().returns(z.boolean()),
  waitForExit: z.function().args().returns(z.promise(z.void())),
});

export type KillableProcess = z.infer<typeof killableProcessContract>;
