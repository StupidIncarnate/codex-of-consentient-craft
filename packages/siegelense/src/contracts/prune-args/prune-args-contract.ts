/**
 * PURPOSE: What `dungeonmaster siegelense prune`'s argv parses into — the three selectors, plus the
 * one flag that decides which of the two renderers the responder reaches for. The selectors stay in
 * a nested `query` rather than flattened beside `human`, so the responder hands `pruneRunBroker`
 * that object whole and no broker ever sees a rendering opinion. Reach for this over `PruneQuery`
 * once the responder receives `--json`/`--human`; `PruneQuery` is what the broker takes.
 *
 * USAGE:
 * pruneArgsContract.parse({
 *   query: { instanceId: null, kind: null, olderThan: '7d' },
 *   human: false,
 * });
 * // Returns a validated PruneArgs
 */

import { z } from 'zod';

import { pruneQueryContract } from '../prune-query/prune-query-contract';

export const pruneArgsContract = z
  .object({
    query: pruneQueryContract,
    human: z.boolean(),
  })
  .strict();

export type PruneArgs = z.infer<typeof pruneArgsContract>;
