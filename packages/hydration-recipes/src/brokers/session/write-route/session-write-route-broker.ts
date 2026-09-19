/**
 * PURPOSE: The session ingredient's `write` route — encodes the session's directory from its
 * `cwd` and appends its lines to `<sessionId>.jsonl`. See `session-ingredient-broker.ts`'s own
 * header for why the ingredient's `copies` names `external:claude-cli` rather than an in-repo
 * broker.
 *
 * Reach for `target.claudeHome`, never `os.homedir()`: `claudePathSlugEncoderTransformer`
 * resolves against whatever home it is handed, and a route reading the real one would write a
 * transcript into the developer's own `~/.claude` during `npm run ward`.
 *
 * USAGE:
 * await sessionWriteRouteBroker({ target, fields: { sessionId, cwd, lines } });
 * // Returns a SessionRecord — appends to <claudeHome>/.claude/projects/<encoded-cwd>/<sessionId>.jsonl
 */
import { claudePathSlugEncoderTransformer } from '@dungeonmaster/shared/transformers';
import { absoluteFilePathContract, lineCountContract } from '@dungeonmaster/shared/contracts';

import { dmJsonlAppendAdapter } from '../../../adapters/dm-jsonl/append/dm-jsonl-append-adapter';
import { sessionFieldsContract } from '../../../contracts/session-fields/session-fields-contract';
import { sessionRecordContract } from '../../../contracts/session-record/session-record-contract';
import type { SessionRecord } from '../../../contracts/session-record/session-record-contract';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const sessionWriteRouteBroker = async ({
  target,
  fields,
}: {
  target: DmTarget;
  fields: Record<string, unknown>;
}): Promise<SessionRecord> => {
  const parsedFields = sessionFieldsContract.parse(fields);
  const sessionsDir = claudePathSlugEncoderTransformer({
    homeDir: target.claudeHome,
    projectPath: parsedFields.cwd,
  });
  const filePath = absoluteFilePathContract.parse(`${sessionsDir}/${parsedFields.sessionId}.jsonl`);

  await dmJsonlAppendAdapter({ filePath, lines: parsedFields.lines });

  return sessionRecordContract.parse({
    sessionId: parsedFields.sessionId,
    cwd: parsedFields.cwd,
    filePath,
    lineCount: lineCountContract.parse(parsedFields.lines.length),
  });
};
