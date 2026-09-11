/**
 * PURPOSE: Defines the raw process output structure with stdout, stderr, exit code and killing signal
 *
 * USAGE:
 * rawOutputContract.parse({stdout: 'output', stderr: '', exitCode: 0});
 * // Returns: RawOutput validated object
 */

import { z } from 'zod';
import { processSignalContract } from '@dungeonmaster/shared/contracts';

export const rawOutputContract = z.object({
  stdout: z.string().brand<'Stdout'>(),
  stderr: z.string().brand<'Stderr'>(),
  exitCode: z.number().brand<'ExitCode'>(),
  // The signal that killed the process, where one did. `exitCode` cannot carry this: a child killed
  // from outside chose no code of its own and is handed back as 1, which is what an ordinary tool
  // failure looks like — so a check the out-of-memory reaper SIGKILLed reads as lint errors.
  // `isOutOfMemoryFailureGuard` is the reader.
  //
  // `null` rather than absent, so one value means "this process was not killed" whether the field
  // was written, left off by an early return that spawned nothing, or saved to `.ward/` before the
  // field existed. Three ways of saying the same thing would each need their own branch downstream.
  signal: processSignalContract.nullable().default(null),
});

export type RawOutput = z.infer<typeof rawOutputContract>;
