/**
 * PURPOSE: Wires a bare CLI command name and target id to the one broker-then-transformer chain
 * that command needs, so a caller holding only an argv-shaped `{command, target}` never has to know
 * which of the three id kinds `target` names or which renderer pairs with which command. Reach for
 * this over calling the brokers and transformers directly whenever the caller starts from a command
 * name rather than already knowing the digest shape it wants.
 *
 * USAGE:
 * DigestRunResponder({ command: DigestCommandStub({ value: 'summary' }), target: 'abc-123' });
 * // Returns the rendered ContentText for the `summary` command
 */
import { sessionIdContract, questIdContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { transcriptLoadBroker } from '../../../brokers/transcript/load/transcript-load-broker';
import { transcriptResolveBroker } from '../../../brokers/transcript/resolve/transcript-resolve-broker';
import { subagentRosterLoadBroker } from '../../../brokers/subagent/roster-load/subagent-roster-load-broker';
import { questLoadBroker } from '../../../brokers/quest/load/quest-load-broker';

import { recordsToSummaryTransformer } from '../../../transformers/records-to-summary/records-to-summary-transformer';
import { summaryToTextTransformer } from '../../../transformers/summary-to-text/summary-to-text-transformer';
import { recordsToBucketsTransformer } from '../../../transformers/records-to-buckets/records-to-buckets-transformer';
import { bucketsToTextTransformer } from '../../../transformers/buckets-to-text/buckets-to-text-transformer';
import { recordsToGapsTransformer } from '../../../transformers/records-to-gaps/records-to-gaps-transformer';
import { gapReportToTextTransformer } from '../../../transformers/gap-report-to-text/gap-report-to-text-transformer';
import { questToCoverageTransformer } from '../../../transformers/quest-to-coverage/quest-to-coverage-transformer';
import { coverageToTextTransformer } from '../../../transformers/coverage-to-text/coverage-to-text-transformer';

import { subagentWindowContract } from '../../../contracts/subagent-window/subagent-window-contract';
import type { SubagentWindow } from '../../../contracts/subagent-window/subagent-window-contract';
import type { DigestCommand } from '../../../contracts/digest-command/digest-command-contract';

export const DigestRunResponder = ({
  command,
  target,
}: {
  command: DigestCommand;
  target: string;
}): ContentText => {
  if (command === 'coverage') {
    const questId = questIdContract.parse(target);
    const flows = questLoadBroker({ questId });
    const coverage = questToCoverageTransformer({ flows });
    return coverageToTextTransformer({ coverage });
  }

  const sessionId = sessionIdContract.parse(target);
  const records = transcriptLoadBroker({ target: sessionId });

  if (command === 'buckets') {
    const buckets = recordsToBucketsTransformer({ records });
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
    const report = recordsToGapsTransformer({ records, subagentWindows });
    return gapReportToTextTransformer({ report });
  }

  const summary = recordsToSummaryTransformer({ records, subagentCount: roster.length });
  return summaryToTextTransformer({ summary });
};
