/**
 * PURPOSE: One row of an AMBIGUOUS error — the index, the nearest testId ancestor, the visible text
 * and the rect of ONE element among several that matched a `target`. Reach for this over a `ref`:
 * chunk 2 mints no refs, so `within` is the only recovery a caller has — a candidate names the scope
 * that WOULD have disambiguated it, so re-issuing the step with that `within` is one step rather than
 * a hunt (siegelense-tooling.md lines 1991, 2049). `within: null` is a real candidate, not an absent
 * one: it is the element sitting at the document root, with no testId ancestor to narrow by.
 *
 * USAGE:
 * const candidate = stepCandidateContract.parse({
 *   index: 0,
 *   within: '[data-testid="GUILD_LIST"]',
 *   text: '+',
 *   rect: '(444,348) 27x25',
 * });
 * // Returns a validated StepCandidate
 */

import { z } from 'zod';

import { arrayIndexContract, contentTextContract } from '@dungeonmaster/shared/contracts';

import { selectorContract } from '../selector/selector-contract';

export const stepCandidateContract = z.object({
  index: arrayIndexContract,
  within: selectorContract.nullable(),
  text: contentTextContract,
  rect: contentTextContract,
});

export type StepCandidate = z.infer<typeof stepCandidateContract>;
