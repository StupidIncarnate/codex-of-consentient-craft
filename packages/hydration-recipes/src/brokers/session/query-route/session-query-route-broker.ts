/**
 * PURPOSE: The session ingredient's `query` route — lists every `<sessionId>.jsonl` file directly
 * under a guild's encoded session directory, then narrows to the ones matching `where`.
 *
 * `where` must carry `cwd`: a session's directory is encoded from its `cwd`, not stored anywhere
 * else, so the scope has to be named explicitly.
 *
 * USAGE:
 * sessionQueryRouteBroker({ target, where: { cwd: '/tmp/guild-1' } });
 * // Returns every session directly under that guild's encoded directory
 */
import { claudePathSlugEncoderTransformer } from '@dungeonmaster/shared/transformers';
import { fsReadFileSyncAdapter, fsReaddirWithTypesAdapter } from '@dungeonmaster/shared/adapters';
import {
  absoluteFilePathContract,
  lineCountContract,
  sessionIdContract,
} from '@dungeonmaster/shared/contracts';

import { isJsonlFileGuard } from '../../../guards/is-jsonl-file/is-jsonl-file-guard';
import { matchesWhereClauseGuard } from '../../../guards/matches-where-clause/matches-where-clause-guard';
import { stripJsonlExtensionTransformer } from '../../../transformers/strip-jsonl-extension/strip-jsonl-extension-transformer';
import { sessionRecordContract } from '../../../contracts/session-record/session-record-contract';
import type { SessionRecord } from '../../../contracts/session-record/session-record-contract';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const sessionQueryRouteBroker = ({
  target,
  where,
}: {
  target: DmTarget;
  where: Record<string, unknown>;
}): SessionRecord[] => {
  const { cwd: cwdValue, ...rest } = where;
  const cwd = absoluteFilePathContract.parse(cwdValue);
  const sessionsDir = claudePathSlugEncoderTransformer({
    homeDir: target.claudeHome,
    projectPath: cwd,
  });

  const entries = fsReaddirWithTypesAdapter({ dirPath: sessionsDir });
  const sessionFiles = entries.filter(
    (entry) => entry.isFile() && isJsonlFileGuard({ filename: entry.name }),
  );

  const records = sessionFiles.map((entry) => {
    const sessionId = sessionIdContract.parse(
      stripJsonlExtensionTransformer({ filename: entry.name }),
    );
    const filePath = absoluteFilePathContract.parse(`${sessionsDir}/${entry.name}`);
    const contents = fsReadFileSyncAdapter({ filePath });
    const lineCount = lineCountContract.parse(
      contents.split('\n').filter((line) => line.length > 0).length,
    );

    return sessionRecordContract.parse({ sessionId, cwd, filePath, lineCount });
  });

  return records.filter((record) => matchesWhereClauseGuard({ record, where: rest }));
};
