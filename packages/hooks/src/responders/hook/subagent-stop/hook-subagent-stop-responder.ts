/**
 * PURPOSE: SubagentStop hook responder — reads the stopping sub-agent's transcript and, when a work-item agent is ending its turn without having called signal-back, returns a block decision that forces it to signal before it can stop
 *
 * USAGE:
 * const result = await HookSubagentStopResponder({ hookInput: parsedStdin });
 * // Returns ExecResult: exitCode 0 with empty stdout to allow the stop, or exitCode 0 with
 * //   `{"decision":"block","reason":...}` stdout to force a signal-back
 */

import {
  execResultContract,
  type ExecResult,
} from '../../../contracts/exec-result/exec-result-contract';
import { subagentStopHookDataContract } from '../../../contracts/subagent-stop-hook-data/subagent-stop-hook-data-contract';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { transcriptToolInvocationsExtractTransformer } from '../../../transformers/transcript-tool-invocations-extract/transcript-tool-invocations-extract-transformer';
import { subagentStopNeedsBlockGuard } from '../../../guards/subagent-stop-needs-block/subagent-stop-needs-block-guard';
import { subagentStopBlockMessageStatics } from '../../../statics/subagent-stop-block-message/subagent-stop-block-message-statics';

export const HookSubagentStopResponder = async ({
  hookInput,
}: {
  hookInput: unknown;
}): Promise<ExecResult> => {
  const allowResult = execResultContract.parse({ stdout: '', stderr: '', exitCode: 0 });

  const parseResult = subagentStopHookDataContract.safeParse(hookInput);
  if (!parseResult.success) {
    return allowResult;
  }

  // For SubagentStop, `transcript_path` is the PARENT session transcript; the stopping
  // sub-agent's OWN transcript (where its get-agent-prompt + signal-back calls live) is
  // `agent_transcript_path`. Read that; fall back to transcript_path only if absent.
  const transcriptPath = filePathContract.parse(
    parseResult.data.agent_transcript_path ?? parseResult.data.transcript_path,
  );

  const transcript = await fsReadFileAdapter({ filePath: transcriptPath }).catch(() => null);
  if (transcript === null) {
    return allowResult;
  }

  const invocations = transcriptToolInvocationsExtractTransformer({ transcript });

  const needsBlock = subagentStopNeedsBlockGuard({
    invocations,
    stopHookActive: parseResult.data.stop_hook_active ?? false,
  });

  if (!needsBlock) {
    return allowResult;
  }

  return execResultContract.parse({
    stdout: JSON.stringify({
      decision: 'block',
      reason: subagentStopBlockMessageStatics.blockMessage,
    }),
    stderr: '',
    exitCode: 0,
  });
};
