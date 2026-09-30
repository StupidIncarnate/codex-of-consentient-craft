/**
 * PURPOSE: The session ingredient's `write` route — encodes the session's directory from its
 * `cwd` and appends its lines to `<sessionId>.jsonl`. See `session-ingredient-broker.ts`'s own
 * header for why the ingredient's `copies` names `external:claude-cli` rather than an in-repo
 * broker.
 *
 * Reach for `target.claudeHome`, never `os.homedir()`: `claudePathSlugEncoderTransformer`
 * resolves against whatever home it is handed, and this route runs against whatever `DmTarget` its
 * caller builds, not the ambient process environment — a jest run's own `HOME` sandbox
 * (`jest.setup-global.js`, assigned once for the whole run) is a single value shared by every
 * worker and every test file, not one scoped per target, so reading it directly here would silently
 * ignore a test's own `claudeHome` and write wherever that shared sandbox points instead.
 *
 * `cwd`/`sessionId` are parsed off the raw `fields` FIRST, separately from the full
 * `sessionFieldsContract.parse(fields)` below — computing `filePath` before the full parse is what
 * lets a caller's missing/invalid `lines` (the field with no honest default,
 * `session-ingredient-broker.ts`'s own header) throw `HydrationWriteFailedError` naming the REAL
 * path it was aimed at, instead of `op-create-apply-layer-broker.ts`'s `(unknown path)` fallback —
 * `writeFailureTransformer` mines `.path` off whatever the write threw, and a bare ZodError from the
 * full parse carries none on its own.
 *
 * `sessionUniqueIdResolveBroker` runs on the raw `sessionId` BEFORE `filePath` is derived — DEF-78
 * — so composing `session-single-turn` and `session-with-nested-chain` into one target never
 * appends onto the same `seed-session-1.jsonl` twice: the second seed's default id bumps to
 * `seed-session-2` because the first one's file already exists under this same target. The
 * returned `SessionRecord.sessionId` carries the RESOLVED id, never the one the caller asked for,
 * so a recipe's own `saveRecordAs` sees the id that actually landed on disk.
 *
 * USAGE:
 * await sessionWriteRouteBroker({ target, fields: { sessionId, cwd, lines } });
 * // Returns a SessionRecord — appends to <claudeHome>/.claude/projects/<encoded-cwd>/<sessionId>.jsonl
 */
import { claudePathSlugEncoderTransformer } from '@dungeonmaster/shared/transformers';
import { absoluteFilePathContract, lineCountContract, sessionContract } from '@dungeonmaster/shared/contracts';

import { appendLinesCreatingParent } from '#gateway/node/fs__promises';
import { sessionUniqueIdResolveBroker } from '../unique-id-resolve/session-unique-id-resolve-broker';
import { sessionFieldsContract } from '../../../contracts/session-fields/session-fields-contract';
import { sessionRecordContract } from '../../../contracts/session-record/session-record-contract';
import type { SessionFields } from '../../../contracts/session-fields/session-fields-contract';
import type { SessionRecord } from '../../../contracts/session-record/session-record-contract';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const sessionWriteRouteBroker = async ({
  target,
  fields,
}: {
  target: DmTarget;
  fields: Record<string, unknown>;
}): Promise<SessionRecord> => {
  const cwd = absoluteFilePathContract.parse(fields.cwd);
  const requestedSessionId = sessionContract.shape.id.parse(fields.sessionId);
  const sessionId = sessionUniqueIdResolveBroker({ target, cwd, sessionId: requestedSessionId });
  const sessionsDir = claudePathSlugEncoderTransformer({
    homeDir: target.claudeHome,
    projectPath: cwd,
  });
  const filePath = absoluteFilePathContract.parse(`${sessionsDir}/${sessionId}.jsonl`);

  const parsedFields = ((): SessionFields => {
    try {
      return sessionFieldsContract.parse(fields);
    } catch (cause) {
      throw Object.assign(new Error(String(cause), { cause }), { path: filePath });
    }
  })();

  await appendLinesCreatingParent({ path: filePath, lines: parsedFields.lines });

  return sessionRecordContract.parse({
    sessionId,
    cwd: parsedFields.cwd,
    filePath,
    lineCount: lineCountContract.parse(parsedFields.lines.length),
  });
};
