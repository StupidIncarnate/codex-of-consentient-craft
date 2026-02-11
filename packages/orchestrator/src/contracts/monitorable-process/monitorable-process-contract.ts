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

export const monitorableProcessContract = z.object({
  kill: z.function(),
  on: z.function(),
});

export interface MonitorableProcess {
  kill: () => boolean;
  on: (event: 'exit', listener: (code: number | null) => void) => void;
}
