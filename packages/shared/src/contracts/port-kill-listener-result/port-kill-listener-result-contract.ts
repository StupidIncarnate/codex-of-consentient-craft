/**
 * PURPOSE: What #gateway/bin/kill's killPid reported for one pid a port-kill swept up — R1: a
 * caller gets back killPid's own exitCode/output per pid, never an invented `{success: true}`, so it
 * can tell "already gone" from a real refusal.
 *
 * USAGE:
 * const result = portKillListenerResultContract.parse({ pid: 12345, exitCode: 0, output: '' });
 */

import { z } from '#gateway/npm/zod';

import { exitCodeContract } from '../exit-code/exit-code-contract';

export const portKillListenerResultContract = z.object({
  pid: z.number().int().positive().brand<'PortKillListenerResultPid'>(),
  exitCode: exitCodeContract,
  output: z.string().brand<'PortKillListenerResultOutput'>(),
}).brand<'PortKillListenerResult'>();

export type PortKillListenerResult = z.infer<typeof portKillListenerResultContract>;
