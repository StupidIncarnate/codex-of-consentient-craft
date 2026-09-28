/**
 * PURPOSE: Defines a process handle with kill and exit-event listening for stream monitoring
 *
 * USAGE:
 * const process: MonitorableProcess = { kill: () => true, on: (event, cb) => cb(0) };
 * process.on('exit', (code) => { ... });
 * process.kill();
 * // Provides a minimal interface for monitoring a child process exit
 */

import { z } from 'zod';

// `kill` and `on` are functions — a Zod object schema cannot check callability, so both stay out
// of the parse and are attached only through the `MonitorableProcess` interface below.
// `.loose()` carries them through `.parse()` unvalidated when a real caller supplies one.
export const monitorableProcessContract = z.object({}).loose();

export type MonitorableProcess = z.infer<typeof monitorableProcessContract> & {
  kill: () => boolean;
  on: (event: 'exit', listener: (code: number | null) => void) => void;
};
