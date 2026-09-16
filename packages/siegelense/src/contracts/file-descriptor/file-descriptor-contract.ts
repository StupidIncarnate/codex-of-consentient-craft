/**
 * PURPOSE: The OS-level file descriptor `openSync` hands back, needed anywhere a spawned process's
 * `stdio` array wants a real fd rather than a stream — `openSync`/`closeSync` are the only primitives
 * that produce one, so `fsOpenFdAdapter` and its companion `fsCloseFdAdapter` are the only place this
 * package touches them. Reach for this over `ProcessId` (`@dungeonmaster/shared/contracts`): a
 * `ProcessId` names a whole OS process, while a `FileDescriptor` names one open handle a process
 * holds and is meaningless once that process closes or exits.
 *
 * USAGE:
 * fileDescriptorContract.parse(3);
 * // Returns a branded FileDescriptor
 */

import { z } from 'zod';

export const fileDescriptorContract = z.number().int().nonnegative().brand<'FileDescriptor'>();

export type FileDescriptor = z.infer<typeof fileDescriptorContract>;
