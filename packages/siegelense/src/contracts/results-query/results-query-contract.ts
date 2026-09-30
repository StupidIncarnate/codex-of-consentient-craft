/**
 * PURPOSE: The whole shape of a `results` call — `{ instance, run, step, kind, where, fields,
 * since }` (siegelense-tooling.md line 2222-2226) — `.strict()` so a caller's typo (`instanceId`
 * for `instance`, or a field this call never had) is a parse error naming the stray key rather
 * than a query that silently runs with the typo'd field dropped and no error to explain the
 * mismatch. `instanceId` is the only required member; every other field narrows an otherwise
 * broad read, and omitting all of them plus `since` is what falls to the "no run, no since"
 * resolution `instanceStateResolveBroker` reads off the registry. Reach for this over
 * ResultWhere: a ResultWhere is one clause NESTED inside `where`, while a ResultsQuery is the
 * whole call this contract's caller submits.
 *
 * USAGE:
 * resultsQueryContract.parse({
 *   instanceId: 'inst_7f3a9c21', runId: null, step: null, kind: 'console', where: null,
 *   fields: null, since: 'boot',
 * });
 * // Returns a validated ResultsQuery
 */

import { z } from '#gateway/npm/zod';

import { resultFieldContract } from '../result-field/result-field-contract';
import { resultKindContract } from '../result-kind/result-kind-contract';
import { resultWhereContract } from '../result-where/result-where-contract';
import { sinceMarkerContract } from '../since-marker/since-marker-contract';
import { stepIndexContract } from '../step-index/step-index-contract';
import { siegeInstanceContract, siegeRunContract } from '@dungeonmaster/shared/contracts';

export const resultsQueryContract = z
  .object({
    instanceId: siegeInstanceContract.shape.id,
    runId: siegeRunContract.shape.id.nullable(),
    step: stepIndexContract.nullable(),
    kind: resultKindContract.nullable(),
    where: resultWhereContract.nullable(),
    fields: z.array(resultFieldContract).readonly().nullable(),
    since: sinceMarkerContract.nullable(),
  })
  .strict();

export type ResultsQuery = z.infer<typeof resultsQueryContract>;
