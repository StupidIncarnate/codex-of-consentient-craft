/**
 * PURPOSE: One rendered entry of a key row's attrs column — what the element DECLARES, in the app's
 * own words (siegelense-tooling.md line 452). `data-status="failed"` answers "which one is the
 * failed row" in the same vocabulary the observable was written in, and `→ /queue` answers "where
 * does this go". Reach for this over `ElementFlag`: an attr's VALUE is the answer, while a flag's
 * presence is the whole message.
 *
 * `value` is already rendered rather than raw — a link arrives as `→ /queue`, a `target="_blank"`
 * link as `→ /docs ↗` — because the compact form is what keeps the column short enough to sit on
 * every row, and a second renderer downstream would be a second place for the arrow to drift.
 *
 * USAGE:
 * attrPairContract.parse({ name: 'data-status', value: 'failed' });
 * // Returns a validated AttrPair
 */

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

export const attrPairContract = z.object({
  name: contentTextContract,
  value: contentTextContract,
});

export type AttrPair = z.infer<typeof attrPairContract>;
