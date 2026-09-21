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
 * USAGE:
 * const result = await stepHandlerCleanupBroker({ args: [], questId, workItemId, onLine });
 * // { outcome: 'done' | 'empty' | 'wall', detail }
 */

import { childProcessSpawnStreamLinesAdapter } from '@dungeonmaster/shared/adapters';
import {
  absoluteFilePathContract,
  contentTextContract,
  type QuestId,
  type QuestWorkItemId,
} from '@dungeonmaster/shared/contracts';

import { cleanupAnswerContract } from '../../../contracts/cleanup-answer/cleanup-answer-contract';
import { stepHandlerResultContract } from '../../../contracts/step-handler-result/step-handler-result-contract';
import type { StepHandlerResult } from '../../../contracts/step-handler-result/step-handler-result-contract';
import { cleanupCliCallStatics } from '../../../statics/cleanup-cli-call/cleanup-cli-call-statics';
import { cleanupOutcomeClassifyTransformer } from '../../../transformers/cleanup-outcome-classify/cleanup-outcome-classify-transformer';
import { questRepoRootBroker } from '../../quest/repo-root/quest-repo-root-broker';

const CLI_SUCCESS_EXIT_CODE = 0;

export const stepHandlerCleanupBroker = async ({
  args: _args,
  questId,
  workItemId: _workItemId,
  onLine,
}: {
  args: string[];
  questId: QuestId;
  workItemId: QuestWorkItemId;
  onLine: (line: string) => void;
}): Promise<StepHandlerResult> => {
  const repoRoot = await questRepoRootBroker({ questId });
  const cwd = absoluteFilePathContract.parse(repoRoot);

  const { exitCode, output } = await childProcessSpawnStreamLinesAdapter({
    command: process.env.DUNGEONMASTER_CLI_PATH ?? cleanupCliCallStatics.call.bin,
    args: [...cleanupCliCallStatics.call.args],
    cwd,
    onLine,
  });

  if (exitCode !== CLI_SUCCESS_EXIT_CODE) {
    return stepHandlerResultContract.parse({
      outcome: 'wall',
      detail: contentTextContract.parse(output),
    });
  }

  const answer = cleanupAnswerContract.parse(JSON.parse(String(output)));

  return stepHandlerResultContract.parse({
    outcome: cleanupOutcomeClassifyTransformer({ answer }),
    detail: contentTextContract.parse(output),
  });
};
