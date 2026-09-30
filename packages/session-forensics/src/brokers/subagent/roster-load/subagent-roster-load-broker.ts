/**
 * PURPOSE: A parent transcript records that it dispatched a sub-agent, but never what that
 * sub-agent cost or how long it ran. Claude Code writes that information into a `.meta.json` file
 * and a transcript beside each sub-agent, in a directory nothing else reads. Reach for this broker
 * when the question is what a fan-out actually spent, not what the parent asked for.
 *
 * USAGE:
 * subagentRosterLoadBroker({ sessionFilePath: AbsoluteFilePathStub({ value: '/h/.claude/projects/p/s.jsonl' }) });
 * // Returns every sub-agent row under that session's subagents dir, sorted by start time ascending
 */

import { existsSync, readdirEntriesSync, readFileSync } from '#gateway/node/fs';
import { join } from '#gateway/node/path';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { safeJsonParseTransformer } from '@dungeonmaster/shared/transformers';
import { contentTextContract, agentContract } from '@dungeonmaster/shared/contracts';
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
  sessionFilePath: string;
}): readonly SubagentRosterRow[] => {
  const sessionDirBase = sessionFilePath.slice(0, -JSONL_FILE_SUFFIX.length);
  const subagentsDir = join(sessionDirBase, locationsStatics.userHome.claude.subagentsDir);

  if (!existsSync(subagentsDir)) {
    return [];
  }

  const metaEntries = readdirEntriesSync(subagentsDir).filter(
    (entry) => entry.kind === 'file' && entry.name.endsWith(META_FILE_SUFFIX),
  );

  const rows = metaEntries.flatMap((entry): SubagentRosterRow[] => {
    const agentIdValue = entry.name.slice(0, -META_FILE_SUFFIX.length);
    const metaFilePath = join(subagentsDir, entry.name);
    const metaContents = contentTextContract.parse(readFileSync(metaFilePath));

    const parsedMetaJson = safeJsonParseTransformer({ value: metaContents });
    if (!parsedMetaJson.ok) {
      return [];
    }

    const metaResult = subagentMetaContract.safeParse(parsedMetaJson.value);
    if (!metaResult.success) {
      return [];
    }

    const transcriptFilePath = join(subagentsDir, `${agentIdValue}${JSONL_FILE_SUFFIX}`);

    const records = existsSync(transcriptFilePath)
      ? jsonlToRecordsTransformer({
          contents: contentTextContract.parse(readFileSync(transcriptFilePath)),
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
        agentId: agentContract.shape.id.parse(agentIdValue),
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
