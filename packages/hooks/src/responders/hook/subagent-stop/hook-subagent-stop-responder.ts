/**
 * PURPOSE: SubagentStop hook responder — refuses a sub-agent's stop on two independent grounds: a backgrounded command THIS agent started that is still running (which the stop would terminate, and which binds every sub-agent rather than work-item agents alone), and a work-item agent ending its turn without having called signal-back (which strands the work item)
 *
 * USAGE:
 * const result = await HookSubagentStopResponder({ hookInput: parsedStdin });
 * // Returns ExecResult: exitCode 0 with empty stdout to allow the stop, or exitCode 0 with
 * //   `{"decision":"block","reason":...}` stdout to force a signal-back
 */

import { execResultContract, type ExecResult } from '@dungeonmaster/shared/contracts';
import { subagentStopHookDataContract } from '../../../contracts/subagent-stop-hook-data/subagent-stop-hook-data-contract';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { transcriptToolInvocationsExtractTransformer } from '../../../transformers/transcript-tool-invocations-extract/transcript-tool-invocations-extract-transformer';
import { subagentStopNeedsBlockGuard } from '../../../guards/subagent-stop-needs-block/subagent-stop-needs-block-guard';
import { hasRunningBackgroundTaskGuard } from '../../../guards/has-running-background-task/has-running-background-task-guard';
import { backgroundTasksOwnedSelectTransformer } from '../../../transformers/background-tasks-owned-select/background-tasks-owned-select-transformer';
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

  // `background_tasks` is SESSION-wide and names no owner, so the array carries every sibling's,
  // every child's and the top-level session's commands alongside this agent's own. Scoping it to
  // the ids this transcript started is what keeps the refusal on the one agent that can clear it:
  // unscoped, one lane blocks every agent in the session on an entry none of them can touch, and
  // no sub-agent has a tool that kills a `shell` — `TaskStop` reaches agents only.
  //
  // An unreadable transcript cannot answer the ownership question, so it falls back to the whole
  // array: a needless refusal costs one re-entry, a missed one costs the command.
  //
  // `stop_hook_active` is deliberately NOT consulted here, unlike the signal-back block below. That
  // one nudges once and lets go to avoid spinning on a wedged agent; this one must keep refusing,
  // because the whole point is to outlast a command that is still running, and the message sends the
  // agent away to WAIT or to KILL rather than to retry — so each re-entry costs wall clock, not a
  // loop.
  const { background_tasks: backgroundTasks } = parseResult.data;
  const ownedBackgroundTasks =
    transcript === null || backgroundTasks === undefined
      ? backgroundTasks
      : backgroundTasksOwnedSelectTransformer({ backgroundTasks, transcript });

  if (hasRunningBackgroundTaskGuard({ backgroundTasks: ownedBackgroundTasks })) {
    return execResultContract.parse({
      stdout: JSON.stringify({
        decision: 'block',
        reason: subagentStopBlockMessageStatics.backgroundTaskMessage,
      }),
      stderr: '',
      exitCode: 0,
    });
  }

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
