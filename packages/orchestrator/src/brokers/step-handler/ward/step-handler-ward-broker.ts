/**
 * PURPOSE: Runs ward with a deterministic step's own `args`, verbatim, and classifies the exit
 * into one of the four `Outcome` words. Reuses `questRunWardBroker`'s non-routing parts — the cwd
 * resolve, the spawn, the run-id transformer and the detail-blob persist plus the `wardResults`
 * ref append — and drops everything from `quest-run-ward-broker.ts:198-320`: that block is
 * terminal work-item status, operation-item completion and the spiritmender splice, which is
 * routing the router (story 15) owns now.
 *
 * `args` carries no `run` subcommand — that is ward's own subcommand, this handler's own
 * constant, prepended here so `step.args` never has to name it.
 *
 * A ward exit of 2 (`wardExitCodeStatics.exitCodes.crash`) classifies `wall`: ward could not run a
 * check at all, so there is no failing file for a `repair` step to fix.
 *
 * `workItemId` rides the signature for symmetry with the other three handlers, but this handler
 * never reads it — the terminal work-item write it would have justified is routing, and the router
 * owns that now.
 *
 * USAGE:
 * const result = await stepHandlerWardBroker({
 *   args: ['--committed', '--uncommitted'],
 *   questId,
 *   workItemId,
 *   onLine,
 * });
 * // { outcome: 'done' | 'empty' | 'unmet' | 'wall', detail, resultRef: 'wardResults/<id>' }
 */

import {
  childProcessSpawnStreamLinesAdapter,
  fsMkdirAdapter,
  pathJoinAdapter,
} from '@dungeonmaster/shared/adapters';
import {
  absoluteFilePathContract,
  contentTextContract,
  exitCodeContract,
  fileContentsContract,
  filePathContract,
  relatedDataItemContract,
  wardResultContract,
  type ModifyQuestInput,
  type QuestId,
  type QuestWorkItemId,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics, wardExitCodeStatics } from '@dungeonmaster/shared/statics';

import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { stepHandlerResultContract } from '../../../contracts/step-handler-result/step-handler-result-contract';
import type { StepHandlerResult } from '../../../contracts/step-handler-result/step-handler-result-contract';
import { wardOutputToRunIdTransformer } from '../../../transformers/ward-output-to-run-id/ward-output-to-run-id-transformer';
import { wardDetailBroker } from '../../ward/detail/ward-detail-broker';
import { questCwdResolveBroker } from '../../quest/cwd-resolve/quest-cwd-resolve-broker';
import { questFindQuestPathBroker } from '../../quest/find-quest-path/quest-find-quest-path-broker';
import { questModifyBroker } from '../../quest/modify/quest-modify-broker';

const WARD_COMMAND = 'dungeonmaster-ward';
const RUN_SUBCOMMAND = 'run';

export const stepHandlerWardBroker = async ({
  args,
  questId,
  workItemId: _workItemId,
  onLine,
}: {
  args: string[];
  questId: QuestId;
  workItemId: QuestWorkItemId;
  onLine: (line: string) => void;
}): Promise<StepHandlerResult> => {
  // Resolve the quest's cwd BEFORE any spawn. A missing worktree is a wall at THIS boundary — the
  // step that carves one runs before this one ever dispatches, so reaching this branch means
  // something removed it out from under an already-dispatched step.
  const resolution = await questCwdResolveBroker({ questId });
  if (resolution.kind === 'missing-worktree') {
    throw new Error(
      `Cannot run ward for quest ${questId}: worktree not found: ${resolution.worktreePath}`,
    );
  }
  const startPath = absoluteFilePathContract.parse(resolution.cwd);

  const { questPath } = await questFindQuestPathBroker({ questId });

  const { exitCode: rawExitCode, output } = await childProcessSpawnStreamLinesAdapter({
    command: process.env.WARD_CLI_PATH ?? WARD_COMMAND,
    args: [RUN_SUBCOMMAND, ...args],
    cwd: startPath,
    onLine,
  });

  const exitCode = rawExitCode ?? exitCodeContract.parse(wardExitCodeStatics.exitCodes.failing);
  // A 0-file scope is `empty`, not green — `runId === null` is the machine-readable signal.
  // `commandRunBroker` returns before any check runs and saves no result on that path, so no
  // `run: <id>` line is ever printed; string-matching the message it prints instead would be
  // fragile where this transformer's regex is exact.
  const runId = wardOutputToRunIdTransformer({ output });

  const detailJson = runId ? await wardDetailBroker({ startPath, runId }) : null;
  const wardResultId = crypto.randomUUID();

  if (detailJson) {
    const wardResultsDir = pathJoinAdapter({
      paths: [questPath, locationsStatics.quest.wardResultsDir],
    });
    await fsMkdirAdapter({ filepath: wardResultsDir });
    const detailFilePath = filePathContract.parse(
      pathJoinAdapter({ paths: [wardResultsDir, `${wardResultId}.json`] }),
    );
    await fsWriteFileAdapter({
      filePath: detailFilePath,
      contents: fileContentsContract.parse(detailJson),
    });
  }

  const wardResult = wardResultContract.parse({
    id: wardResultId,
    createdAt: new Date().toISOString(),
    exitCode,
    ...(runId ? { runId: String(runId) } : {}),
  });

  const modifyResult = await questModifyBroker({
    input: { questId, wardResults: [wardResult] } as ModifyQuestInput,
  });
  if (!modifyResult.success) {
    throw new Error(
      `Failed to persist ward result for quest ${questId}: ${modifyResult.error ?? 'unknown'}`,
    );
  }

  // Exit 1 with a run id is `unmet`, not `wall` — a deterministic step exits green, red or empty;
  // only the `repair` step it routes to can wall on its own account.
  const outcome =
    exitCode === wardExitCodeStatics.exitCodes.crash
      ? 'wall'
      : exitCode === wardExitCodeStatics.exitCodes.pass
        ? runId === null
          ? 'empty'
          : 'done'
        : 'unmet';

  return stepHandlerResultContract.parse({
    outcome,
    detail: contentTextContract.parse(output),
    resultRef: relatedDataItemContract.parse(`wardResults/${wardResult.id}`),
  });
};
