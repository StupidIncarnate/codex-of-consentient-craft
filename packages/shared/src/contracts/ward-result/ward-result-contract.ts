/**
 * PURPOSE: Lightweight ward result ref stored in quest.json — full detail lives in quest folder
 *
 * USAGE:
 * wardResultContract.parse({id: 'f47ac10b-...', createdAt: '2024-01-15T10:00:00.000Z', exitCode: 0});
 * // Returns: WardResult object (lightweight ref, detail in {questFolder}/ward-results/{id}.json)
 *
 * `wardMode` RECORDS WHICH INVOCATION PRODUCED THE BLOB, and it is this record alone — no ledger
 * entry and no work item carries the value. The execution panel's ward detail row renders it, so the
 * enum is spelled here rather than shared: this is the only shape that persists it.
 *
 * IT ACCEPTS `changed` ON READ. Quests already on disk carry `wardMode: "changed"`, and a bare enum
 * would reject the whole quest.json rather than one field — a live quest that can no longer be
 * loaded, for a word. The preprocess maps that one value forward and nothing else; every writer emits
 * `full`, so it only ever fires on a result written before the rename.
 */

import { z } from '#gateway/npm/zod';
import { wardQueueResponseContract } from '../ward-queue-response/ward-queue-response-contract';

const LEGACY_COMMITTED = 'changed';

export const wardResultContract = z.object({
  id: z.uuid().brand<'WardResultId'>(),
  createdAt: z.iso.datetime().brand<'WardResultCreatedAt'>(),
  exitCode: z.number().int().brand<'ExitCode'>(),
  runId: wardQueueResponseContract.shape.runId.optional(),
  wardMode: z
    .preprocess(
      (value) => (value === LEGACY_COMMITTED ? 'committed' : value),
      z.enum(['committed', 'full']),
    )
    .optional(),
});

export type WardResult = z.infer<typeof wardResultContract>;
