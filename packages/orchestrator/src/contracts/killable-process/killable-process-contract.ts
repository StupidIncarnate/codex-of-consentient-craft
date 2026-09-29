/**
 * PURPOSE: Defines a process handle with kill and waitForExit capability for subprocess management
 *
 * USAGE:
 * const process: KillableProcess = { kill: () => subprocess.kill(), waitForExit: () => exitPromise };
 * process.kill();
 * await process.waitForExit();
 * // Terminates the subprocess and waits for full exit
 */

import { z } from '#gateway/npm/zod';

// `kill` and `waitForExit` are functions — a Zod object schema cannot check callability, so both
// stay out of the parse and are attached only through the type intersection below.
// `.loose()` carries them through `.parse()` unvalidated when a real caller supplies one.
export const killableProcessContract = z.object({}).loose();

export type KillableProcess = z.infer<typeof killableProcessContract> & {
  kill: () => boolean;
  waitForExit: () => Promise<void>;
};
