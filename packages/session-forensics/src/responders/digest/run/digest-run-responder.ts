/**
 * PURPOSE: Wires a bare CLI command name and target id to the broker-then-transformer chain that
 * command needs. A caller holding only an argv-shaped `{command, target}` never has to know which
 * of the three id kinds `target` names. It also never has to know which renderer pairs with which
 * command. This responder decides both. Reach for this responder over calling the brokers and
 * transformers directly whenever the caller starts from a command name rather than already knowing
 * the digest shape it wants.
 *
 * `bucketMinutes` and `gapFloorSeconds` are the parsed `--minutes`/`--floor-seconds` CLI flags,
 * threaded straight to `recordsToBucketsTransformer`/`recordsToGapsTransformer`. Both are optional
 * and unused outside their own command — omitting either keeps that transformer's own
 * `digestDefaultStatics` default.
 *
 * USAGE:
 * DigestRunResponder({ command: DigestCommandStub({ value: 'summary' }), target: 'abc-123' });
 * // Returns the rendered ContentText for the `summary` command
 */
import { fsReadFileSyncAdapter } from '@dungeonmaster/shared/adapters';
import { sessionIdContract, questIdContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { transcriptLoadBroker } from '../../../brokers/transcript/load/transcript-load-broker';
import { transcriptResolveBroker } from '../../../brokers/transcript/resolve/transcript-resolve-broker';
import { subagentRosterLoadBroker } from '../../../brokers/subagent/roster-load/subagent-roster-load-broker';
import { questLoadBroker } from '../../../brokers/quest/load/quest-load-broker';
import { questIndexLoadBroker } from '../../../brokers/quest/index-load/quest-index-load-broker';

import { recordsToSummaryTransformer } from '../../../transformers/records-to-summary/records-to-summary-transformer';
import { summaryToTextTransformer } from '../../../transformers/summary-to-text/summary-to-text-transformer';
import { recordsToBucketsTransformer } from '../../../transformers/records-to-buckets/records-to-buckets-transformer';
import { bucketsToTextTransformer } from '../../../transformers/buckets-to-text/buckets-to-text-transformer';
import { recordsToGapsTransformer } from '../../../transformers/records-to-gaps/records-to-gaps-transformer';
import { gapReportToTextTransformer } from '../../../transformers/gap-report-to-text/gap-report-to-text-transformer';
import { questToCoverageTransformer } from '../../../transformers/quest-to-coverage/quest-to-coverage-transformer';
import { coverageToTextTransformer } from '../../../transformers/coverage-to-text/coverage-to-text-transformer';
import { workItemToIndexRowTransformer } from '../../../transformers/work-item-to-index-row/work-item-to-index-row-transformer';
import { questIndexToTextTransformer } from '../../../transformers/quest-index-to-text/quest-index-to-text-transformer';

import { subagentWindowContract } from '../../../contracts/subagent-window/subagent-window-contract';
import type { SubagentWindow } from '../../../contracts/subagent-window/subagent-window-contract';
import type { DigestCommand } from '../../../contracts/digest-command/digest-command-contract';
import type { BucketMinutes } from '../../../contracts/bucket-minutes/bucket-minutes-contract';
import type { GapFloorSeconds } from '../../../contracts/gap-floor-seconds/gap-floor-seconds-contract';
import type { WorkItemIndexRow } from '../../../contracts/work-item-index-row/work-item-index-row-contract';

export const DigestRunResponder = ({
  command,
  target,
  bucketMinutes,
  gapFloorSeconds,
}: {
  command: DigestCommand;
  target: string;
  bucketMinutes?: BucketMinutes;
  gapFloorSeconds?: GapFloorSeconds;
}): ContentText => {
  if (command === 'coverage') {
    const questId = questIdContract.parse(target);
    const { flows, workItems } = questLoadBroker({ questId });
    const coverage = questToCoverageTransformer({ flows, workItems });
    return coverageToTextTransformer({ coverage });
  }

  if (command === 'quest') {
    const questId = questIdContract.parse(target);
    const { userRequest, workItems, operations, wardResults, riftcarverResults } =
      questIndexLoadBroker({ questId });

    const rows: WorkItemIndexRow[] = workItems.map((workItem) => {
      const transcriptPath =
        workItem.sessionId === undefined
          ? undefined
          : transcriptResolveBroker({ target: workItem.sessionId });

      const transcriptSizeBytes =
        transcriptPath === undefined
          ? 0
          : fsReadFileSyncAdapter({ filePath: transcriptPath }).length;

      const subagentCount =
        transcriptPath === undefined
          ? 0
          : subagentRosterLoadBroker({ sessionFilePath: transcriptPath }).length;

      return workItemToIndexRowTransformer({
        workItem,
        operations,
        wardResults,
        riftcarverResults,
        transcriptSizeBytes,
        subagentCount,
      });
    });

    return questIndexToTextTransformer({
      ...(userRequest === undefined ? {} : { userRequest }),
      rows,
    });
  }

  const sessionId = sessionIdContract.parse(target);
  const records = transcriptLoadBroker({ target: sessionId });

  if (command === 'buckets') {
    const buckets = recordsToBucketsTransformer({
      records,
      ...(bucketMinutes === undefined ? {} : { bucketMinutes }),
    });
    return bucketsToTextTransformer({ buckets });
  }

  const transcriptPath = transcriptResolveBroker({ target: sessionId });
  const roster =
    transcriptPath === undefined
      ? []
      : subagentRosterLoadBroker({ sessionFilePath: transcriptPath });

  if (command === 'gaps') {
    const subagentWindows: readonly SubagentWindow[] = roster.flatMap((row) =>
      row.startedAt === undefined || row.endedAt === undefined
        ? []
        : [
            subagentWindowContract.parse({
              agentId: row.agentId,
              startedAt: row.startedAt,
              endedAt: row.endedAt,
            }),
          ],
    );
    const report = recordsToGapsTransformer({
      records,
      subagentWindows,
      ...(gapFloorSeconds === undefined ? {} : { floorSeconds: gapFloorSeconds }),
    });
    return gapReportToTextTransformer({
      report,
      ...(gapFloorSeconds === undefined ? {} : { floorSeconds: gapFloorSeconds }),
    });
  }

  const summary = recordsToSummaryTransformer({ records, subagentCount: roster.length });
  return summaryToTextTransformer({ summary });
};
