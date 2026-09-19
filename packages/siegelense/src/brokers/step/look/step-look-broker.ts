/**
 * PURPOSE: Drives the `look` step — the KEY, a tree of every addressable element on the page with an
 * element-bound `ref` per row. It is the answer to BOTH "what is on this screen" and "how do I
 * address the second of two identical controls" (siegelense-tooling.md line 2587), and rung 1 of the
 * reading ladder: reach for it first, and for `dom` last. Reach for this over `stepEvalSourceBroker`
 * whenever the question is what the page HOLDS: `eval` answers a question you already knew to ask,
 * while the key is what tells you which questions there are.
 *
 * **The SHOT is the dispatcher's job, not this broker's.** `look` sits in `stepStatics.verbs.capturing`,
 * so `runExecuteBroker` resolves a shot path for it and `stepDispatchBroker` captures, measures
 * `blank` and `pixelChange`, and stamps the path onto the reading — exactly as it does for an acting
 * verb. Capturing here as well would be a second write of one picture, which chunk 3 already had to
 * fix once for `screenshot`.
 *
 * `within` goes through `withinSelectorNormaliseTransformer` first, so the spec's own shorthand
 * (`within: 'SUBAGENT_CHAIN'`, line 2593) and the explicit `[data-testid="…"]` form every other step
 * takes both reach the same element. Without it a bare testId would silently match an element TAG of
 * that name — zero rows back, which reads exactly like an empty region and is the wrong-selector
 * failure the whole addressing design exists to remove.
 *
 * USAGE:
 * await stepLookBroker({ session, within: null });
 * // Returns the rendered key as this step's own reading
 *
 * await stepLookBroker({ session, within: 'SUBAGENT_CHAIN_HEADER' });
 * // The same reading, scoped to one region — rung 2
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { selectorContract } from '../../../contracts/selector/selector-contract';
import { withinSelectorNormaliseTransformer } from '../../../transformers/within-selector-normalise/within-selector-normalise-transformer';

export const stepLookBroker = async ({
  session,
  within,
}: {
  session: BrowserSession;
  within: string | null;
}): Promise<ContentText> => {
  const scope =
    within === null
      ? null
      : withinSelectorNormaliseTransformer({ within: selectorContract.parse(within) });

  const listing = await session.look({ within: scope });

  return listing.rendered;
};
