/**
 * PURPOSE: One line of `console.jsonl`, `network.jsonl` or `ws.jsonl` — the buffers `results`
 * reads back, continuous for an instance's whole life rather than reset per run. `runId` and
 * `step` are BOTH `null` for an entry that arrived between two runs (the listeners are armed once
 * at boot and never stop), which is a real, writable answer rather than a shape only the
 * run-attributed case can produce. Reach for this over StepReading: a StepReading is one step's
 * own recorded outcome inside `runs/run_N.jsonl`, while a BufferEntry is a line in a buffer the
 * step never wrote to directly.
 *
 * USAGE:
 * bufferEntryContract.parse({ runId: 'run_2', step: 4, atMs: 1700000000000, text: '{"status":200}' });
 * // Returns a validated BufferEntry
 */

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { epochMsContract } from '../epoch-ms/epoch-ms-contract';
import { runIdContract } from '../run-id/run-id-contract';
import { stepIndexContract } from '../step-index/step-index-contract';

export const bufferEntryContract = z.object({
  runId: runIdContract.nullable(),
  step: stepIndexContract.nullable(),
  atMs: epochMsContract,
  text: contentTextContract,
});

export type BufferEntry = z.infer<typeof bufferEntryContract>;
