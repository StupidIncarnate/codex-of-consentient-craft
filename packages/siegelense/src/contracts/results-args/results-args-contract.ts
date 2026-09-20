/**
 * PURPOSE: What `dungeonmaster siegelense results`'s argv parses into — every member of
 * `resultsQueryContract` (`instanceId`, `runId`, `step`, `kind`, `where`, `fields`, `since`),
 * `.strict()` so a stray key from a copy-pasted MCP-era field name (`instanceId` typed as
 * `instance`, or a field this call never had) fails the parse rather than running with the typo'd
 * field silently dropped. Reach for this over `ResultsQuery` once the responder receives raw argv:
 * `ResultsQuery` is the shape `resultsReadBroker` reads off disk, this one is what
 * `resultsArgsParseTransformer` hands back, and the two stay separate files because an argv layer
 * and a broker-query layer change for different reasons even when their fields agree today.
 *
 * USAGE:
 * resultsArgsContract.parse({
 *   instanceId: 'inst_7f3a9c21', runId: null, step: null, kind: null, where: null, fields: null,
 *   since: null, json: false,
 * });
 * // Returns a validated ResultsArgs
 */

import { z } from 'zod';

import { instanceIdContract } from '../instance-id/instance-id-contract';
import { resultFieldContract } from '../result-field/result-field-contract';
import { resultKindContract } from '../result-kind/result-kind-contract';
import { resultWhereContract } from '../result-where/result-where-contract';
import { runIdContract } from '../run-id/run-id-contract';
import { sinceMarkerContract } from '../since-marker/since-marker-contract';
import { stepIndexContract } from '../step-index/step-index-contract';

export const resultsArgsContract = z
  .object({
    instanceId: instanceIdContract,
    runId: runIdContract.nullable(),
    step: stepIndexContract.nullable(),
    kind: resultKindContract.nullable(),
    where: resultWhereContract.nullable(),
    fields: z.array(resultFieldContract).readonly().nullable(),
    since: sinceMarkerContract.nullable(),
    json: z.boolean(),
  })
  .strict();

export type ResultsArgs = z.infer<typeof resultsArgsContract>;
