/**
 * PURPOSE: Responds to Antigravity Stop hook events by verifying no background tasks are running
 * and work-item agents have called signal-back before stopping
 *
 * USAGE:
 * const result = await HookAgyStopResponder({ hookInput: parsedStdin });
 * // Returns AgyStopDecision indicating continue or stop
 */

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import { agyTranscriptToolInvocationsExtractTransformer } from '../../../transformers/agy-transcript-tool-invocations-extract/agy-transcript-tool-invocations-extract-transformer';
import { subagentStopNeedsBlockGuard } from '../../../guards/subagent-stop-needs-block/subagent-stop-needs-block-guard';
import { subagentStopBlockMessageStatics } from '../../../statics/subagent-stop-block-message/subagent-stop-block-message-statics';
import { agyStopHookDataContract } from '../../../contracts/agy-stop-hook-data/agy-stop-hook-data-contract';
import {
  agyStopDecisionContract,
  type AgyStopDecision,
} from '../../../contracts/agy-stop-decision/agy-stop-decision-contract';

export const HookAgyStopResponder = async ({
  hookInput,
}: {
  hookInput: unknown;
}): Promise<AgyStopDecision> => {
  const parseResult = agyStopHookDataContract.safeParse(hookInput);
  if (!parseResult.success) {
    return agyStopDecisionContract.parse({ decision: 'stop' });
  }

  const { fullyIdle, transcriptPath } = parseResult.data;

  // If there are still background tasks running, block stop and instruct agent to wait or shut down
  if (fullyIdle === false) {
    return agyStopDecisionContract.parse({
      decision: 'continue',
      reason: subagentStopBlockMessageStatics.backgroundTaskMessage,
    });
  }

  // If no transcript path, allow stop
  if (!transcriptPath) {
    return agyStopDecisionContract.parse({ decision: 'stop' });
  }

  const transcript = await fsReadFileAdapter({
    filePath: filePathContract.parse(transcriptPath),
  }).catch(() => null);

  if (transcript === null) {
    return agyStopDecisionContract.parse({ decision: 'stop' });
  }

  const invocations = agyTranscriptToolInvocationsExtractTransformer({ transcript });
  const needsBlock = subagentStopNeedsBlockGuard({ invocations });

  if (needsBlock) {
    return agyStopDecisionContract.parse({
      decision: 'continue',
      reason: subagentStopBlockMessageStatics.blockMessage,
    });
  }

  return agyStopDecisionContract.parse({ decision: 'stop' });
};
