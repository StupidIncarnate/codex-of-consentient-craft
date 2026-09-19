/**
 * PURPOSE: One row of an AMBIGUOUS error — the ref, the nearest testId ancestor, the visible text
 * and the rect of ONE element among several that matched a `target`. Reach for this over `KeyRow`: a
 * KeyRow is one line of the page's own listing, read BEFORE anything is targeted, while a
 * StepCandidate exists only to recover from a target that already failed, and carries exactly the
 * four things that recovery needs.
 *
 * **`ref` and `within` are both here because neither alone is enough** (siegelense-tooling.md lines
 * 2137-2142). A `within` is DURABLE — it means the same element on the next run, so it is what a
 * caller writes into a saved batch — but it cannot separate two candidates that already share one,
 * which is the measured dead end at `scrolls/seigelense/HANDOFF.md` lines 206-214. A `ref` always
 * can, because it binds to one element and can never be ambiguous; it is ephemeral, so it drives and
 * is never stored. `ref: null` is a candidate described before any `look` minted one.
 *
 * `within: null` is a real candidate, not an absent one: it is the element sitting at the document
 * root, with no testId ancestor to narrow by.
 *
 * USAGE:
 * const candidate = stepCandidateContract.parse({
 *   index: 0,
 *   ref: 16,
 *   within: '[data-testid="GUILD_LIST"]',
 *   text: '+',
 *   rect: '(444,348) 27x25',
 * });
 * // Returns a validated StepCandidate
 */

import { z } from 'zod';

import { arrayIndexContract, contentTextContract } from '@dungeonmaster/shared/contracts';

import { refContract } from '../ref/ref-contract';
import { selectorContract } from '../selector/selector-contract';

export const stepCandidateContract = z.object({
  index: arrayIndexContract,
  ref: refContract.nullable().default(null),
  within: selectorContract.nullable(),
  text: contentTextContract,
  rect: contentTextContract,
});

export type StepCandidate = z.infer<typeof stepCandidateContract>;
