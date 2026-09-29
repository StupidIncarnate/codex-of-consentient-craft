/**
 * PURPOSE: Gathers what a step that could not find its target leaves behind, so the first reading
 * of the failure is enough to diagnose it: the page's testIds ranked by likeness to the missing
 * name (the top few plus a count of the rest), and the page's whole KEY as `look` renders it, read
 * at the moment of failure rather than by a later run that sees the page as it is by then. Used by
 * both targeting failures — `stepTargetResolveBroker`'s NO MATCH and `stepWaitForBroker`'s ceiling
 * hit — so the two can never disagree about what a miss reports.
 *
 * Names come from `session.nearestNames` AND from the key's own rows: the adapter caps the first
 * list, while the key lists every addressable element, so ranking over both keeps a close name that
 * sits late on a dense page. A `nearestNames` rejection propagates — "could not find out" must never
 * read as "nothing similar". A `look` failure degrades `key` to `null` and is logged: the key is
 * extra evidence and must never replace the failure it explains.
 *
 * USAGE:
 * await stepMissEvidenceBroker({ session, target: '[data-testid="NOPE"]' });
 * // Returns { nearest: ['NODE', ...up to 5], more: 13, key: 'key: 18 rows\n...' }
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { readingCountContract } from '../../../contracts/reading-count/reading-count-contract';
import type { ReadingCount } from '../../../contracts/reading-count/reading-count-contract';
import type { KeyListing } from '../../../contracts/key-listing/key-listing-contract';
import { nearestNamesStatics } from '../../../statics/nearest-names/nearest-names-statics';
import { nameLikenessRankTransformer } from '../../../transformers/name-likeness-rank/name-likeness-rank-transformer';

export const stepMissEvidenceBroker = async ({
  session,
  target,
}: {
  session: BrowserSession;
  target: string;
}): Promise<{ nearest: readonly ContentText[]; more: ReadingCount; key: ContentText | null }> => {
  const [names, listing] = await Promise.all([
    session.nearestNames({ target }),
    session.look({ within: null }).catch((lookError: unknown): KeyListing | null => {
      process.stderr.write(
        `[step-miss-evidence] key read failed for missing target ${target}: ${String(lookError)}\n`,
      );
      return null;
    }),
  ]);

  const keyNames =
    listing === null
      ? []
      : listing.rows.map((row) => row.testId).filter((testId) => testId !== null);

  const ranked = nameLikenessRankTransformer({ target, names: [...names, ...keyNames] });
  const { shown } = nearestNamesStatics.limits;

  return {
    nearest: ranked.slice(0, shown),
    more: readingCountContract.parse(Math.max(0, ranked.length - shown)),
    key: listing === null ? null : listing.rendered,
  };
};
