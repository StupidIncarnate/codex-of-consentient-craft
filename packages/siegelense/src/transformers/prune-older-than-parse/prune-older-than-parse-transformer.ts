/**
 * PURPOSE: Turns the window a caller types — `'7d'`, `'2d'`, `'30m'` — into the millisecond span
 * `pruneRunBroker` subtracts from now. It is the INVERSE of `elapsedRenderTransformer`, and the two
 * share `pruneStatics.olderThan.unitMs`, so a window this parser accepts always renders back as the
 * same text. Reach for this over `Number(text)` at a call site: the unit suffix is the whole value
 * of the field, and a bare number silently read as milliseconds would turn `prune --older-than 7`
 * into a prune of everything written more than seven milliseconds ago.
 *
 * USAGE:
 * pruneOlderThanParseTransformer({ olderThan: '7d' });
 * // Returns 604800000 as EpochMs
 */

import { epochMsContract } from '../../contracts/epoch-ms/epoch-ms-contract';
import type { EpochMs } from '../../contracts/epoch-ms/epoch-ms-contract';
import type { ElapsedText } from '../../contracts/elapsed-text/elapsed-text-contract';
import { pruneStatics } from '../../statics/prune/prune-statics';

const WINDOW_PATTERN = /^([0-9]+)([a-z])$/u;

export const pruneOlderThanParseTransformer = ({
  olderThan,
}: {
  olderThan: ElapsedText;
}): EpochMs => {
  const match = WINDOW_PATTERN.exec(String(olderThan));

  if (match === null) {
    throw new Error(
      `Unreadable window: ${olderThan}. A window is a whole number followed by one of ` +
        `${pruneStatics.olderThan.unitNames.join(', ')} — for example ` +
        `${pruneStatics.window.defaultOlderThan}.`,
    );
  }

  const [, amountText, unit] = match;
  const unitMs = Object.entries(pruneStatics.olderThan.unitMs).find(([name]) => name === unit)?.[1];

  if (unitMs === undefined) {
    throw new Error(
      `Unknown window unit: ${unit} in ${olderThan}. Accepted units are ` +
        `${pruneStatics.olderThan.unitNames.join(', ')}.`,
    );
  }

  return epochMsContract.parse(Number(amountText) * unitMs);
};
