/**
 * PURPOSE: Bumps a session's default id (`seed-session-<n>`, the shape `sessionIngredientBroker`'s
 * own `defaults(index)` always mints) forward by `by`, or returns it UNCHANGED when it does not
 * match that shape — an explicit custom id a caller `set()`s never matches. Reach for this from
 * `sessionUniqueIdResolveBroker`'s own retry loop rather than hand-parsing the id at the call site:
 * returning the input unchanged (instead of `undefined`) is what lets that loop tell "not a default
 * id" apart from "still occupied" with a single equality check, no second return shape to carry —
 * the identical mechanism `guildDefaultPathBumpTransformer` already uses for DEF-78's guild half.
 *
 * USAGE:
 * sessionDefaultIdBumpTransformer({ id: sessionIdContract.parse('seed-session-1'), by: 1 });
 * // Returns 'seed-session-2'
 * sessionDefaultIdBumpTransformer({ id: sessionIdContract.parse('my-custom-session'), by: 1 });
 * // Returns 'my-custom-session' unchanged
 */
import { sessionContract } from '@dungeonmaster/shared/contracts';
import type { Session } from '@dungeonmaster/shared/contracts';

const DEFAULT_ID_PATTERN = /^(seed-session-)(\d+)$/u;

export const sessionDefaultIdBumpTransformer = ({
  id,
  by,
}: {
  id: Session['id'];
  by: number;
}): Session['id'] => {
  const match = DEFAULT_ID_PATTERN.exec(id);
  if (match === null) {
    return id;
  }

  const [, prefix, digits] = match;
  return sessionContract.shape.id.parse(`${prefix ?? ''}${Number(digits) + by}`);
};
