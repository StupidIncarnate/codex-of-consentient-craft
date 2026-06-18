/**
 * PURPOSE: Drives a smoketest scenario end-to-end in-process — no `claude -p` spawn, no execution-queue
 * runner, no scenario-driver stamp loop. Calls `questGetNextStepBroker` to fetch the next dispatch
 * decision, simulates each Task() sub-agent in-process by invoking `agentPromptGetBroker` (validates
 * the prompt-fetch flow) and mutating the work item via `questModifyBroker` per the scenario's signal
 * script. Handles `pathseeker-walk` completion by firing `questPostWalkHookBroker` directly. Handles
 * `run-ward` by mutating the ward work item to a stubbed complete (no subprocess). Exits when the
 * quest reaches a terminal status, when `idle` arrives, or when the dispatch cap is hit.
 *
 * USAGE:
 * const result = await smoketestInProcessDriverBroker({ questId, scenario });
 * // Loops until terminal. Returns AdapterResult.
 *
 * WHEN-TO-USE: From smoketestRunCaseBroker (orchestration suite). The driver is the new replacement
 * for the spawn-and-stream pipeline retired by the `/dumpster-launch` model.
 * WHEN-NOT-TO-USE: Anywhere outside smoketest. Production sub-agents are dispatched by the user's
 * interactive Claude session via Task(); this in-process simulator only exists so smoketests can
 * validate state-machine transitions without API spend.
 */

import type {
  AdapterResult,
  ModifyQuestInput,
  QuestId,
  WardResult,
  WorkItemRole,
} from '@dungeonmaster/shared/contracts';
// QuestId is imported for the public API signature; the inert facade signature uses raw string
// (the zod function contract that defines ActiveQuestFacade uses unbranded string for setActive's
// questId, matching how QuestGetNextStepResponder builds the singleton facade).
import {
  adapterResultContract,
  getQuestInputContract,
  wardResultContract,
} from '@dungeonmaster/shared/contracts';
import {
  isFailureWorkItemStatusGuard,
  isTerminalQuestStatusGuard,
  satisfiesDependencyWorkItemStatusGuard,
} from '@dungeonmaster/shared/guards';

import type { ActiveQuestFacade } from '../../../contracts/active-quest-facade/active-quest-facade-contract';
import {
  dispatchCountContract,
  type DispatchCount,
} from '../../../contracts/dispatch-count/dispatch-count-contract';
import type { SmoketestScenario } from '../../../contracts/smoketest-scenario/smoketest-scenario-contract';
import { agentPromptGetBroker } from '../../agent-prompt/get/agent-prompt-get-broker';
import { questGetNextStepBroker } from '../../quest/get-next-step/quest-get-next-step-broker';
import { questGetBroker } from '../../quest/get/quest-get-broker';
import { questModifyBroker } from '../../quest/modify/quest-modify-broker';
import { questPostWalkHookBroker } from '../../quest/post-walk-hook/quest-post-walk-hook-broker';
import { smoketestInProcessDriverStatics } from '../../../statics/smoketest-in-process-driver/smoketest-in-process-driver-statics';

const INERT_ACTIVE_QUEST_FACADE: ActiveQuestFacade = {
  setActive: (_: { questId: string | null }): void => undefined,
  clear: (): void => undefined,
};

export const smoketestInProcessDriverBroker = async ({
  questId,
  scenario,
  maxDispatches,
  ordinals,
  dispatchCount,
}: {
  questId: QuestId;
  scenario: SmoketestScenario;
  maxDispatches?: DispatchCount;
  ordinals?: Map<WorkItemRole, DispatchCount>;
  dispatchCount?: DispatchCount;
}): Promise<AdapterResult> => {
  const cap =
    maxDispatches ??
    dispatchCountContract.parse(smoketestInProcessDriverStatics.defaultMaxDispatches);
  const ordinalMap = ordinals ?? new Map<WorkItemRole, DispatchCount>();
  const current = dispatchCount ?? dispatchCountContract.parse(0);
  const nextCount = dispatchCountContract.parse(Number(current) + 1);

  if (Number(nextCount) > Number(cap)) {
    throw new Error(`smoketestInProcessDriverBroker: dispatch cap reached (${String(cap)})`);
  }

  const questResult = await questGetBroker({
    input: getQuestInputContract.parse({ questId }),
  });
  if (!questResult.success || !questResult.quest) {
    throw new Error(`smoketestInProcessDriverBroker: quest not found: ${questId}`);
  }
  const { quest } = questResult;

  if (isTerminalQuestStatusGuard({ status: quest.status })) {
    return adapterResultContract.parse({ success: true });
  }

  const step = await questGetNextStepBroker({
    activeQuest: INERT_ACTIVE_QUEST_FACADE,
    longPollTotalMs: smoketestInProcessDriverStatics.shortPollTotalMs,
    longPollIntervalMs: smoketestInProcessDriverStatics.shortPollIntervalMs,
  });

  if (step.type === 'idle') {
    // Nothing ready. If every work item is terminal, finalize quest status; otherwise exit cleanly.
    const anyFailed = quest.workItems.some((item) =>
      isFailureWorkItemStatusGuard({ status: item.status }),
    );
    const allTerminal =
      quest.workItems.length > 0 &&
      quest.workItems.every((item) =>
        satisfiesDependencyWorkItemStatusGuard({ status: item.status }),
      );
    if (allTerminal && !isTerminalQuestStatusGuard({ status: quest.status })) {
      const status = anyFailed ? 'blocked' : 'complete';
      await questModifyBroker({
        input: { questId, status } as ModifyQuestInput,
      });
    }
    return adapterResultContract.parse({ success: true });
  }

  if (step.type === 'run-ward') {
    // Stubbed ward — append a synthetic WardResult and mark the work item complete.
    // Mirrors questRunWardBroker's persistence pattern without the subprocess.
    const stubbedWardResult: WardResult = wardResultContract.parse({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      exitCode: 0,
      wardMode: 'changed',
    });
    await questModifyBroker({
      input: { questId, wardResults: [stubbedWardResult] } as ModifyQuestInput,
    });
    await questModifyBroker({
      input: {
        questId,
        workItems: [
          {
            id: step.workItemId,
            status: 'complete',
            completedAt: new Date().toISOString(),
          },
        ],
      } as ModifyQuestInput,
    });
    return smoketestInProcessDriverBroker({
      questId,
      scenario,
      ...(maxDispatches === undefined ? {} : { maxDispatches }),
      ordinals: ordinalMap,
      dispatchCount: nextCount,
    });
  }

  // step.type === 'spawn-agents'
  // Phase 1 (synchronous): pre-compute the resolved (instruction, role, signal) triples so the
  // ordinal map mutates serially in deterministic order; the async dispatch is then a single
  // Promise.all on stable inputs.
  const resolvedDispatches = step.agents
    .filter((instruction) => instruction.questId === questId)
    .map((instruction) => {
      const workItem = quest.workItems.find((wi) => wi.id === instruction.workItemId);
      const role: WorkItemRole = workItem?.role ?? (instruction.role as WorkItemRole);
      const script = scenario.scripts[role];
      const ordinal = ordinalMap.get(role) ?? dispatchCountContract.parse(0);
      const promptName =
        script !== undefined && Number(ordinal) < script.length
          ? (script[Number(ordinal)] ?? null)
          : null;
      ordinalMap.set(role, dispatchCountContract.parse(Number(ordinal) + 1));
      const signal: 'complete' | 'failed' =
        promptName === 'signalFailed' || promptName === 'signalFailedReplan'
          ? 'failed'
          : 'complete';
      return { instruction, role, signal };
    });

  // Phase 2 (async, parallel): invoke each agent simulation. questModifyBroker serializes its own
  // read-modify-write per questId via withQuestModifyLockLayerBroker, so parallel calls are safe.
  // pathseeker-walk's post-walk hook is the only ordering-sensitive piece, and it only fires for
  // pathseeker-* roles which always batch together (or run alone), so the hook fires inside each
  // resolved dispatch's promise.
  await Promise.all(
    resolvedDispatches.map(async ({ instruction, role, signal }) => {
      // Exercise the prompt-fetch flow that a real sub-agent would hit as its first action.
      await agentPromptGetBroker({
        agent: instruction.role,
        questId: instruction.questId,
        workItemId: instruction.workItemId,
      });

      await questModifyBroker({
        input: {
          questId: instruction.questId,
          workItems: [
            {
              id: instruction.workItemId,
              status: signal === 'complete' ? 'complete' : 'failed',
              completedAt: new Date().toISOString(),
              actualSignal: signal,
              ...(signal === 'failed' ? { errorMessage: 'smoketest-failed-script' } : {}),
            },
          ],
        } as ModifyQuestInput,
      });

      // pathseeker-walk completion triggers the downstream chain hook — same as MCP signal-back path.
      // The work-item role (from quest.json) is the source of truth; instruction.role narrows to
      // AgentRole (which excludes pathseeker-* variants), so we check role here rather than
      // instruction.role.
      if (signal === 'complete' && (role === 'pathseeker-walk' || role === 'pathseeker')) {
        await questPostWalkHookBroker({
          questId: instruction.questId,
          walkWorkItemId: instruction.workItemId,
        });
      }
    }),
  );

  return smoketestInProcessDriverBroker({
    questId,
    scenario,
    ...(maxDispatches === undefined ? {} : { maxDispatches }),
    ordinals: ordinalMap,
    dispatchCount: nextCount,
  });
};
