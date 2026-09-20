/**
 * PURPOSE: One citation kind the resolver could NOT check, and why — the field that keeps a prune
 * honest. "Referenced by a prelude" is a claim rather than a check (siegelense-tooling.md line
 * 2436), and the mirror failure is worse: a resolver that omits a kind it never asked about answers
 * "nothing cites this", which is the quiet deletion the whole retention section exists to prevent.
 * Carrying the gap in the ANSWER means a caller reading `refused: []` also reads which question was
 * never put. Reach for this over `CitationReference`: that one records a citation that was found,
 * while this records a question that was never asked.
 *
 * USAGE:
 * citationGapContract.parse({
 *   kind: 'open-issue',
 *   why: 'no issue record exists on disk to check: nothing in this repo stores an issue with a typed instanceId/runId',
 * });
 * // Returns a validated CitationGap
 */

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { citationKindContract } from '../citation-kind/citation-kind-contract';

export const citationGapContract = z.object({
  kind: citationKindContract,
  why: contentTextContract,
});

export type CitationGap = z.infer<typeof citationGapContract>;
