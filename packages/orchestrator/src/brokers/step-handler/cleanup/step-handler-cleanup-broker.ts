/**
 * PURPOSE: Runs `dungeonmaster siegelense cleanup --json` from the quest's repo root and classifies
 * what it reaped, released and aged. Spawns the CLI rather than importing
 * `@dungeonmaster/siegelense` directly — the orchestrator cannot depend on that package without
 * closing the cycle `orchestrator → siegelense → cli → orchestrator` (`@dungeonmaster/siegelense`
 * lists `@dungeonmaster/cli` in its own dependencies, and `@dungeonmaster/cli` lists
 * `@dungeonmaster/orchestrator`) — and the spawn route gives `onLine` its lines for nothing, since
 * this handler is already a "run a command, classify what it printed" shape. Story 23's `capacity`
 * and `start` handlers need STRUCTURED answers from calls with no `--json`-equivalent flag, so they
 * reach for the runtime-dynamic-import route instead; that split is deliberate, not an
 * inconsistency.
 *
 * `cleanupRunBroker` (the call this spawns) takes NO arguments, so `args` is `[]` on both the
 * `sweepIn` and `sweepOut` steps and this handler never reads it. `workItemId` rides the signature
 * for symmetry with the other three handlers and is never read either — cleanup is a machine-wide
 * fleet operation, not a per-work-item one.
 *
 * A nonzero exit classifies `wall` directly — the call itself failed, which is the closest a spawn
 * boundary comes to `cleanupRunBroker`'s own "the call threw". A zero exit hands the printed JSON
 * to `cleanupOutcomeClassifyTransformer`.
 *
 * `streamLines` rejects with `RunNotFoundError` when the OS never starts the CLI at all (a missing
 * `dungeonmaster` binary), rather than resolving a result the way the adapter this replaced did —
 * caught below and folded into the same failed-run shape so a missing binary still classifies `wall`.
 *
 * USAGE:
 * const result = await stepHandlerCleanupBroker({ args: [], questId, workItemId, onLine });
 * // { outcome: 'done' | 'empty' | 'wall', detail }
 */

import { streamLines, RunNotFoundError } from '#gateway/node/child_process';
import { getEnv } from '#gateway/node/process';

import { cleanupCliAnswerContract } from '../../../contracts/cleanup-cli-answer/cleanup-cli-answer-contract';
import { stepHandlerResultContract } from '../../../contracts/step-handler-result/step-handler-result-contract';
import type { StepHandlerResult } from '../../../contracts/step-handler-result/step-handler-result-contract';
import { cleanupCliCallStatics } from '../../../statics/cleanup-cli-call/cleanup-cli-call-statics';
import { cleanupOutcomeClassifyTransformer } from '../../../transformers/cleanup-outcome-classify/cleanup-outcome-classify-transformer';
import { questRepoRootBroker } from '../../quest/repo-root/quest-repo-root-broker';
import type { Quest, WorkItem } from '@dungeonmaster/shared/contracts';

const CLI_SUCCESS_EXIT_CODE = 0;

export const stepHandlerCleanupBroker = async ({
  args: _args,
  questId,
  workItemId: _workItemId,
  onLine,
}: {
  args: string[];
  questId: Quest['id'];
  workItemId: WorkItem['id'];
  onLine: (line: string) => void;
}): Promise<StepHandlerResult> => {
  const repoRoot = await questRepoRootBroker({ questId });
  const cwd = repoRoot;

  const { exitCode, output } = await streamLines({
    command: getEnv('DUNGEONMASTER_CLI_PATH') ?? cleanupCliCallStatics.call.bin,
    args: [...cleanupCliCallStatics.call.args],
    cwd,
    onLine,
  }).catch((error: unknown) => {
    if (!(error instanceof RunNotFoundError)) {
      throw error;
    }
    return { exitCode: 1, output: '', signal: null };
  });

  if (exitCode !== CLI_SUCCESS_EXIT_CODE) {
    return stepHandlerResultContract.parse({
      outcome: 'wall',
      detail: output,
    });
  }

  const answer = cleanupCliAnswerContract.parse(JSON.parse(output));

  return stepHandlerResultContract.parse({
    outcome: cleanupOutcomeClassifyTransformer({ answer }),
    detail: output,
  });
};
