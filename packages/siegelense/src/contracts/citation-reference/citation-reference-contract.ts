/**
 * PURPOSE: ONE thing that still points at an instance's evidence, carrying the path a caller can
 * open. `citingFile` is the whole contract: "'Referenced by a prelude' is a claim; a path and a run
 * id is something the caller can open" (siegelense-tooling.md line 2436), so this shape makes the
 * path impossible to omit rather than trusting a refusal sentence to include it. `why` is the
 * rendered sentence a refusal prints verbatim (`run_7 cited by a VERIFIED prelude in
 * .quest-plans/1dac5395…/path-3.md`). Reach for this over `CitationGap`: this one records a
 * citation that was FOUND, while a gap records a kind that was never checked.
 *
 * USAGE:
 * citationReferenceContract.parse({
 *   kind: 'walked-note',
 *   instanceId: 'inst_1d09',
 *   runId: 'run_7',
 *   citingFile: '/home/u/.dungeonmaster/guilds/g1/quests/q1/quest.json',
 *   why: 'run_7 cited by a WALKED note on open quest q1 in /home/u/.dungeonmaster/…/quest.json',
 * });
 * // Returns a validated CitationReference
 */

import { z } from 'zod';

import { absoluteFilePathContract, contentTextContract } from '@dungeonmaster/shared/contracts';

import { citationKindContract } from '../citation-kind/citation-kind-contract';
import { instanceIdContract } from '../instance-id/instance-id-contract';
import { runIdContract } from '../run-id/run-id-contract';

export const citationReferenceContract = z.object({
  kind: citationKindContract,
  instanceId: instanceIdContract,
  runId: runIdContract.nullable(),
  citingFile: absoluteFilePathContract,
  why: contentTextContract,
});

export type CitationReference = z.infer<typeof citationReferenceContract>;
