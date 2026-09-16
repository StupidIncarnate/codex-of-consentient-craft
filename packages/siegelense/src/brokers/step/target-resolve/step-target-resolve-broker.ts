/**
 * PURPOSE: The one place `waitFor`, `click` and `type` resolve a `target` selector before acting —
 * "Nothing ever silently picks a match. Ambiguity is an ERROR" (siegelense-tooling.md line 1983).
 * One match proceeds; more than one throws `StepAmbiguousError` carrying every candidate from
 * `session.describeMatches`; zero throws `StepNoMatchError` naming the near misses from
 * `session.nearestNames`. Exists as its own broker rather than three copies of a count-and-branch
 * inside `click`, `type` and `waitFor` — three copies is three places for `.first()` to come back
 * (chunk-02-driver-and-batch.md, W13).
 *
 * USAGE:
 * await stepTargetResolveBroker({ session, target: '[data-testid="PIXEL_BTN"]', within: 'GUILD_LIST' });
 * // Returns { success: true } once the scoped target resolves to exactly one element
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { StepAmbiguousError } from '../../../errors/step-ambiguous/step-ambiguous-error';
import { StepNoMatchError } from '../../../errors/step-no-match/step-no-match-error';

export const stepTargetResolveBroker = async ({
  session,
  target,
  within,
}: {
  session: BrowserSession;
  target: string;
  within?: string;
}): Promise<AdapterResult> => {
  const matchParams = within === undefined ? { target } : { target, within };
  const count = await session.countMatches(matchParams);

  if (count === 1) {
    return adapterResultContract.parse({ success: true });
  }

  if (count > 1) {
    const candidates = await session.describeMatches(matchParams);
    throw new StepAmbiguousError({ target, within: within ?? null, candidates });
  }

  const nearest = await session.nearestNames({ target });
  throw new StepNoMatchError({ target, within: within ?? null, nearest });
};
