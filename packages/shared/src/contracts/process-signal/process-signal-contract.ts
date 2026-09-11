/**
 * PURPOSE: The POSIX signal that killed a child process, as Node reports it on `exit`. Reach for
 * this wherever a caller has to tell a process that CHOSE its exit code from one that was killed
 * from outside — the two are indistinguishable once a signal has been flattened into an exit code,
 * and the commonest killer is the kernel's out-of-memory reaper, which leaves no other trace.
 *
 * Deliberately a branded string rather than an enum of the signals this repo happens to look at.
 * The set is the platform's, `NodeJS.Signals` already spells it, and an enum here would reject a
 * real signal Node handed us rather than report it.
 *
 * USAGE:
 * processSignalContract.parse('SIGKILL');
 * // Returns: ProcessSignal
 */

import { z } from 'zod';

export const processSignalContract = z.string().min(1).brand<'ProcessSignal'>();

export type ProcessSignal = z.infer<typeof processSignalContract>;
