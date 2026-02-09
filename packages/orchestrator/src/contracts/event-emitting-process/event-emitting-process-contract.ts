/**
 * PURPOSE: Defines a process handle with event emitter capabilities for monitoring subprocess
 *
 * USAGE:
 * process.on('exit', (code) => { ... });
 * process.on('error', (error) => { ... });
 * process.kill();
 * // Listen for events and control the subprocess
 */

import { z } from 'zod';

export const eventEmittingProcessContract = z.object({
  kill: z.function().args().returns(z.boolean()),
  on: z.function(),
});

export type EventEmittingProcess = z.infer<typeof eventEmittingProcessContract>;
