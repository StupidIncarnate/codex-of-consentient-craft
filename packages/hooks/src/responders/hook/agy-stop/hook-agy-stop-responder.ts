/**
 * PURPOSE: Responds to Antigravity Stop hook events by verifying work-item agents have called
 * signal-back, and refusing stops when uncompleted background tasks remain unless the agent
 * is waiting on child subagents
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

  const { fullyIdle, transcriptPath, executionNum } = parseResult.data;

  // If no transcript path, allow stop if idle, or continue if background tasks running
  if (!transcriptPath) {
    if (fullyIdle === false) {
      return agyStopDecisionContract.parse({
        decision: 'continue',
        reason: subagentStopBlockMessageStatics.backgroundTaskMessage,
      });
    }
    return agyStopDecisionContract.parse({ decision: 'stop' });
  }

  const transcript = await fsReadFileAdapter({
    filePath: filePathContract.parse(transcriptPath),
  }).catch(() => null);

  if (transcript === null) {
    if (fullyIdle === false) {
      return agyStopDecisionContract.parse({
        decision: 'continue',
        reason: subagentStopBlockMessageStatics.backgroundTaskMessage,
      });
    }
    return agyStopDecisionContract.parse({ decision: 'stop' });
  }

  const invocations = agyTranscriptToolInvocationsExtractTransformer({ transcript });
  const stopHookActive = typeof executionNum === 'number' && executionNum > 1;
  const needsBlock = subagentStopNeedsBlockGuard({ invocations, stopHookActive });

  if (needsBlock) {
    return agyStopDecisionContract.parse({
      decision: 'continue',
      reason: subagentStopBlockMessageStatics.blockMessage,
    });
  }

  // If fullyIdle is false, block stop ONLY when the agent is NOT waiting on child subagents.
  // Child subagents run asynchronously in the background, and the parent agent must end
  // its turn to await reactive message delivery.
  const hasSubagents = invocations.some((invocation) => invocation.name === 'invoke_subagent');
  if (fullyIdle === false && !hasSubagents) {
    return agyStopDecisionContract.parse({
      decision: 'continue',
      reason: subagentStopBlockMessageStatics.backgroundTaskMessage,
    });
  }

  return agyStopDecisionContract.parse({ decision: 'stop' });
};
