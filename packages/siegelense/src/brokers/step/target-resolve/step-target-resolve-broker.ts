/**
 * PURPOSE: The one door every driving step goes through before it acts — "Nothing ever silently
 * picks a match. Ambiguity is an ERROR" (siegelense-tooling.md line 2109). One match proceeds; more
 * than one throws `StepAmbiguousError` carrying every candidate from `session.describeMatches`, each
 * with the `ref` that picks it; zero throws `StepNoMatchError` naming the near misses from
 * `session.nearestNames`. Exists as its own broker rather than three copies of a count-and-branch
 * inside `click`, `type` and `waitFor` — three copies is three places for `.first()` to come back.
 *
 * **A `ref` resolves through this same door, and that is deliberate.** A ref can never be ambiguous:
 * it binds to one element, so it has no candidate list and no near misses. What it has instead is
 * three fates, and this is the one place that turns them into errors, because `adapters/` may not
 * import `errors/`: live proceeds; `stale` is a ref that WAS this instance's and whose element is
 * gone, which a fresh `look` recovers; `unknown` is a ref from another instance, which a fresh
 * `look` does not recover and whose error says so. One door for both handle kinds is what keeps a
 * single place deciding whether a step may act at all.
 *
 * USAGE:
 * await stepTargetResolveBroker({ session, target: '[data-testid="PIXEL_BTN"]', within: 'GUILD_LIST', ref: null });
 * // Returns { success: true } once the scoped target resolves to exactly one element
 *
 * await stepTargetResolveBroker({ session, target: null, within: null, ref: 23 });
 * // Returns { success: true } once ref 23 still reaches a connected element
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { RefStaleError } from '../../../errors/ref-stale/ref-stale-error';
import { RefUnknownError } from '../../../errors/ref-unknown/ref-unknown-error';
import { StepAmbiguousError } from '../../../errors/step-ambiguous/step-ambiguous-error';
import { StepNoMatchError } from '../../../errors/step-no-match/step-no-match-error';
import { refStatics } from '../../../statics/ref/ref-statics';

export const stepTargetResolveBroker = async ({
  session,
  target,
  within,
  ref,
}: {
  session: BrowserSession;
  target: string | null;
  within: string | null;
  ref: number | null;
}): Promise<AdapterResult> => {
  if (ref !== null) {
    const resolution = await session.refState({ ref });

    if (resolution.state === 'live') {
      return adapterResultContract.parse({ success: true });
    }
    if (resolution.state === 'stale') {
      // The adapter always names a boundary on a stale answer; the fallback keeps the message
      // honest rather than blank if a future reader ever hands one back without.
      throw new RefStaleError({
        ref,
        boundary: resolution.boundary ?? refStatics.boundaries.detached,
      });
    }
    throw new RefUnknownError({ ref, highestMinted: resolution.highestMinted });
  }

  if (target === null) {
    throw new Error(
      'step-target-resolve-broker: a driving step reached the door with neither a `target` nor a `ref`. `stepContract` refuses that combination, so this means a step was built without going through it.',
    );
  }

  const matchParams = within === null ? { target } : { target, within };
  const count = await session.countMatches(matchParams);

  if (count === 1) {
    return adapterResultContract.parse({ success: true });
  }

  if (count > 1) {
    const candidates = await session.describeMatches(matchParams);
    throw new StepAmbiguousError({ target, within, candidates });
  }

  const nearest = await session.nearestNames({ target });
  throw new StepNoMatchError({ target, within, nearest });
};
