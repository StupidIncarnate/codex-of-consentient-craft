/**
 * PURPOSE: What #gateway/bin/kill's killPid reported for one pid a port-kill swept up — R1: a
 * caller gets back killPid's own exitCode/output per pid, never an invented `{success: true}`, so it
 * can tell "already gone" from a real refusal.
 *
 * USAGE:
 * const result = portKillListenerResultContract.parse({ pid: 12345, exitCode: 0, output: '' });
 */

import { z } from 'zod';

import { errorMessageContract } from '../error-message/error-message-contract';
import { exitCodeContract } from '../exit-code/exit-code-contract';

export const portKillListenerResultContract = z.object({
  pid: z.number().int().positive().brand<'PortListenerPid'>(),
  exitCode: exitCodeContract,
  output: errorMessageContract,
});

export type PortKillListenerResult = z.infer<typeof portKillListenerResultContract>;
