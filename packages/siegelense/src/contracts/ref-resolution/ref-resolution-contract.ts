/**
 * PURPOSE: What the page answers when asked about one `ref` — whether it still reaches an element,
 * and, when it does not, WHICH boundary it crossed. Reach for this over throwing inside the session
 * adapter: `adapters/` may not import `errors/`, so the adapter reports a state and the broker that
 * reads it raises `RefStaleError` or `RefUnknownError` — the same split `describeMatches` and
 * `stepTargetResolveBroker` already use for the ambiguity rule.
 *
 * Three states and no fourth, because a ref has exactly three fates: it resolves; it was YOURS and
 * its element is gone (`stale`, with the boundary naming which of navigation and detachment did
 * it); or it was never minted here at all (`unknown`), which is the cross-instance case and the one
 * whose recovery is different. `highestMinted` rides along because an unknown ref's error names it —
 * the number is what tells a reader they are holding a handle from somewhere else rather than one
 * that merely expired.
 *
 * USAGE:
 * refResolutionContract.parse({ state: 'stale', boundary: 'navigation', highestMinted: 41 });
 * // Returns a validated RefResolution
 */

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { readingCountContract } from '../reading-count/reading-count-contract';

export const refResolutionContract = z.object({
  state: z.enum(['live', 'stale', 'unknown']).brand<'RefResolutionState'>(),
  boundary: contentTextContract.nullable(),
  highestMinted: readingCountContract,
});

export type RefResolution = z.infer<typeof refResolutionContract>;
