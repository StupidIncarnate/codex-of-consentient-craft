/**
 * PURPOSE: Layer helper for spawnOneAgentLayerBroker — decides what follows a child that hit a wall it
 * could not report, or that EXITED CLEANLY. A wall reason read off the child's stdout is recorded at
 * once. A clean exit re-reads the work item: a terminal one signalled, and nothing follows; a live one
 * ended its turn without signalling, and gets ONE resume that says so
 * (`agentUnsignalledExitPromptTransformer`). Past that budget, or with no session to resume, this
 * records a `wall` for it instead. Without this layer a clean exit is left to orphan recovery, which
 * resumes it as KILLED ("CUT OFF") until the reset budget blocks the quest under a crash-loop reason
 * that names nothing the session reported.
 *
 * USAGE:
 * const shouldNudge = await sessionEndLayerBroker({ instruction, sessionId, nudgesSpent: 0 });
 * // Returns true when the caller should resume the session with the unsignalled-exit prompt
 */

import { stderr } from '#gateway/node/process';
import type { Session } from '@dungeonmaster/shared/contracts';
import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import { isTerminalWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

import type { SpawnInstruction } from '../../../contracts/spawn-instruction/spawn-instruction-contract';
import { agentSessionWallStatics } from '../../../statics/agent-session-wall/agent-session-wall-statics';
import { questGetBroker } from '../get/quest-get-broker';
import { questSessionWallRecordBroker } from '../session-wall-record/quest-session-wall-record-broker';

export const sessionEndLayerBroker = async ({
  instruction,
  sessionId,
  nudgesSpent,
  wallReason,
}: {
  instruction: SpawnInstruction;
  sessionId: Session['id'] | undefined;
  nudgesSpent: number;
  wallReason?: string;
}): Promise<boolean> => {
  if (wallReason !== undefined) {
    stderr.write(
      `[node-dispatch] ${instruction.role} work item ${instruction.workItemId} hit a wall it could not report: ${wallReason}\n`,
    );
    await questSessionWallRecordBroker({
      questId: instruction.questId,
      workItemId: instruction.workItemId,
      reason: wallReason,
    });
    return false;
  }

  const refreshed = await questGetBroker({
    input: getQuestInputContract.parse({ questId: instruction.questId }),
  });
  const workItem = refreshed.quest?.workItems.find((item) => item.id === instruction.workItemId);

  if (workItem === undefined || isTerminalWorkItemStatusGuard({ status: workItem.status })) {
    return false;
  }

  if (sessionId !== undefined && nudgesSpent < agentSessionWallStatics.unsignalledExit.maxNudges) {
    stderr.write(
      `[node-dispatch] ${instruction.role} work item ${instruction.workItemId} ended its turn without signalling — resuming it once to say so\n`,
    );
    return true;
  }

  const reason =
    sessionId === undefined
      ? `the ${instruction.role} session exited cleanly without signalling and before it reported a session id, so there is nothing to resume`
      : `the ${instruction.role} session ended ${String(nudgesSpent + 1)} turns without signalling or naming a wall, including one after it was told it had not signalled — read its transcript (session ${sessionId}) for why it stopped`;

  stderr.write(
    `[node-dispatch] ${instruction.role} work item ${instruction.workItemId} recorded as a wall: ${reason}\n`,
  );
  await questSessionWallRecordBroker({
    questId: instruction.questId,
    workItemId: instruction.workItemId,
    reason,
  });

  return false;
};
