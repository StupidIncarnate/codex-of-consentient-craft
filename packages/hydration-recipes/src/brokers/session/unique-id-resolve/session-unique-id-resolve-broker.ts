/**
 * PURPOSE: Bumps a session's default id to the next free "-N" suffix when the target already
 * holds a `<sessionId>.jsonl` file at the derived path — the session half of DEF-78's composition
 * fix: every recipe's own `add()` call starts its own `defaults(index)` at index 0, so composing
 * `session-single-turn` and `session-with-nested-chain` into ONE target both mint the identical
 * literal id `seed-session-1`, and the second write silently overwrites the first's transcript
 * (`appendLinesCreatingParent` appends to whatever file is already there). Reach for this from
 * `sessionWriteRouteBroker` before it derives the file path it appends to.
 *
 * DETERMINISTIC, not random — the identical mechanism `guildUniquePathResolveBroker` already uses
 * for the guild half of DEF-78: it reads the REAL FILESYSTEM STATE the target already holds and
 * increments the trailing number until a free id is found, recursing on itself rather than a
 * private helper so `sessionDefaultIdBumpTransformer` returning the id UNCHANGED (a shape it does
 * not recognise) is what lets the loop return a caller's explicit custom id untouched, colliding or
 * not.
 *
 * USAGE:
 * sessionUniqueIdResolveBroker({ target, cwd, sessionId: sessionIdContract.parse('seed-session-1') });
 * // Returns 'seed-session-2' when seed-session-1.jsonl already exists under that cwd's directory,
 * // else the original id unchanged
 */
import { claudePathSlugEncoderTransformer } from '@dungeonmaster/shared/transformers';
import { existsSync } from '#gateway/node/fs';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, SessionId } from '@dungeonmaster/shared/contracts';

import { sessionDefaultIdBumpTransformer } from '../../../transformers/session-default-id-bump/session-default-id-bump-transformer';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const sessionUniqueIdResolveBroker = ({
  target,
  cwd,
  sessionId,
}: {
  target: DmTarget;
  cwd: AbsoluteFilePath;
  sessionId: SessionId;
}): SessionId => {
  const sessionsDir = claudePathSlugEncoderTransformer({
    homeDir: target.claudeHome,
    projectPath: cwd,
  });
  const filePath = absoluteFilePathContract.parse(`${sessionsDir}/${sessionId}.jsonl`);

  if (!existsSync(filePath)) {
    return sessionId;
  }

  const bumped = sessionDefaultIdBumpTransformer({ id: sessionId, by: 1 });
  if (bumped === sessionId) {
    return sessionId;
  }

  return sessionUniqueIdResolveBroker({ target, cwd, sessionId: bumped });
};
