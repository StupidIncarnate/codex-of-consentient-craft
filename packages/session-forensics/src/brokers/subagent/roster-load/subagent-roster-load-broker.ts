/**
 * PURPOSE: A parent transcript records that it dispatched a sub-agent, never what that sub-agent
 * cost or how long it ran — that lives in the `.meta.json` and transcript Claude Code writes beside
 * each one, in a directory nothing else reads. Reach for this when the question is what a fan-out
 * actually spent, not what the parent asked for.
 *
 * USAGE:
 * subagentRosterLoadBroker({ sessionFilePath: AbsoluteFilePathStub({ value: '/h/.claude/projects/p/s.jsonl' }) });
 * // Returns every sub-agent row under that session's subagents dir, sorted by start time ascending
 */

import {
  fsExistsSyncAdapter,
  fsReaddirWithTypesAdapter,
  fsReadFileSyncAdapter,
  pathJoinAdapter,
} from '@dungeonmaster/shared/adapters';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { safeJsonParseTransformer } from '@dungeonmaster/shared/transformers';
import {
  absoluteFilePathContract,
  filePathContract,
  agentIdContract,
} from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { subagentMetaContract } from '../../../contracts/subagent-meta/subagent-meta-contract';
import { isoTimestampContract } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import {
  subagentRosterRowContract,
  type SubagentRosterRow,
} from '../../../contracts/subagent-roster-row/subagent-roster-row-contract';
import { jsonlToRecordsTransformer } from '../../../transformers/jsonl-to-records/jsonl-to-records-transformer';

const JSONL_FILE_SUFFIX = '.jsonl';
const META_FILE_SUFFIX = '.meta.json';

export const subagentRosterLoadBroker = ({
  sessionFilePath,
}: {
  sessionFilePath: AbsoluteFilePath;
}): readonly SubagentRosterRow[] => {
  const sessionDirBase = sessionFilePath.slice(0, -JSONL_FILE_SUFFIX.length);
  const subagentsDir = absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [sessionDirBase, locationsStatics.userHome.claude.subagentsDir] }),
  );

  if (!fsExistsSyncAdapter({ filePath: filePathContract.parse(subagentsDir) })) {
    return [];
  }

  const metaEntries = fsReaddirWithTypesAdapter({ dirPath: subagentsDir }).filter(
    (entry) => entry.isFile() && entry.name.endsWith(META_FILE_SUFFIX),
  );

  const rows = metaEntries.flatMap((entry): SubagentRosterRow[] => {
    const agentIdValue = entry.name.slice(0, -META_FILE_SUFFIX.length);
    const metaFilePath = absoluteFilePathContract.parse(
      pathJoinAdapter({ paths: [subagentsDir, entry.name] }),
    );
    const metaContents = fsReadFileSyncAdapter({ filePath: metaFilePath });

    const parsedMetaJson = safeJsonParseTransformer({ value: metaContents });
    if (!parsedMetaJson.ok) {
      return [];
    }

    const metaResult = subagentMetaContract.safeParse(parsedMetaJson.value);
    if (!metaResult.success) {
      return [];
    }

    const transcriptFilePath = absoluteFilePathContract.parse(
      pathJoinAdapter({ paths: [subagentsDir, `${agentIdValue}${JSONL_FILE_SUFFIX}`] }),
    );

    const records = fsExistsSyncAdapter({ filePath: filePathContract.parse(transcriptFilePath) })
      ? jsonlToRecordsTransformer({
          contents: fsReadFileSyncAdapter({ filePath: transcriptFilePath }),
        })
      : [];

    const timestamps = records
      .map((record) => record.timestamp)
      .filter((timestamp): timestamp is NonNullable<typeof timestamp> => timestamp !== undefined)
      .map((timestamp) => isoTimestampContract.parse(timestamp))
      .sort();

    const turnCount = records.filter((record) => record.type === 'assistant').length;

    return [
      subagentRosterRowContract.parse({
        agentId: agentIdContract.parse(agentIdValue),
        meta: metaResult.data,
        ...(timestamps.length > 0
          ? { startedAt: timestamps[0], endedAt: timestamps[timestamps.length - 1] }
          : {}),
        turnCount,
        records,
      }),
    ];
  });

  return rows.sort((a, b) => (a.startedAt ?? '').localeCompare(b.startedAt ?? ''));
};
