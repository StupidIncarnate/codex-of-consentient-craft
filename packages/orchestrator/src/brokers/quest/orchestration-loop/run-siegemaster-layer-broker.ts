/**
 * PURPOSE: Executes siegemaster phase — optional build preflight + dev server lifecycle, then runs integration/e2e tests, skips pending on failure and spawns pathseeker replan
 *
 * USAGE:
 * await runSiegemasterLayerBroker({questId, workItem, startPath});
 * // Runs build preflight (if devServer config present), starts dev server, runs siegemaster agent.
 * // On failure: skips pending work items, creates pathseeker replan. Dev server always stopped in finally.
 */

import { environmentStatics } from '@dungeonmaster/shared/statics';
import {
  absoluteFilePathContract,
  adapterResultContract,
  errorMessageContract,
  type AdapterResult,
  type FilePath,
  type QuestId,
  type SessionId,
  type WorkItem,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import { isPendingWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

import { dungeonmasterConfigResolveAdapter } from '../../../adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter';
import type { OnAgentEntryCallback } from '../../../contracts/orchestration-callbacks/orchestration-callbacks-contract';
import { devServerUrlContract } from '../../../contracts/dev-server-url/dev-server-url-contract';
import { slotIndexContract } from '../../../contracts/slot-index/slot-index-contract';
import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';
import { buildWorkUnitForRoleTransformer } from '../../../transformers/build-work-unit-for-role/build-work-unit-for-role-transformer';
import { resolveRelatedDataItemTransformer } from '../../../transformers/resolve-related-data-item/resolve-related-data-item-transformer';
import { devServerStopBroker } from '../../dev-server/stop/dev-server-stop-broker';
import { agentSpawnByRoleBroker } from '../../agent/spawn-by-role/agent-spawn-by-role-broker';
import { questGetBroker } from '../get/quest-get-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';
import { buildPreflightLoopLayerBroker } from './build-preflight-loop-layer-broker';
import { devServerStartLoopLayerBroker } from './dev-server-start-loop-layer-broker';

const MAX_BUILD_ATTEMPTS = 3;
const MAX_DEV_SERVER_START_ATTEMPTS = 3;

type DevServerStartLoopResult = Awaited<ReturnType<typeof devServerStartLoopLayerBroker>>;
type DevServerProcess = Extract<DevServerStartLoopResult, { success: true }>['process'];

export const runSiegemasterLayerBroker = async ({
  questId,
  workItem,
  startPath,
  onAgentEntry,
  abortSignal,
}: {
  questId: QuestId;
  workItem: WorkItem;
  startPath: FilePath;
  onAgentEntry: OnAgentEntryCallback;
  abortSignal: AbortSignal;
}): Promise<AdapterResult> => {
  const result = adapterResultContract.parse({ success: true });
  const questInput = getQuestInputContract.parse({ questId });
  const questResult = await questGetBroker({ input: questInput });
  if (!questResult.success || !questResult.quest) {
    throw new Error(`Quest not found: ${questId}`);
  }
  const { quest } = questResult;

  // Resolve the single flow this siege work item targets via relatedDataItems[0]
  const [ref] = workItem.relatedDataItems;
  if (!ref) {
    throw new Error(`Siegemaster work item ${String(workItem.id)} has no relatedDataItems`);
  }
  const resolved = resolveRelatedDataItemTransformer({ ref, quest });
  if (resolved.collection !== 'flows') {
    throw new Error(
      `Siegemaster work item ${String(workItem.id)} expected flows reference, got ${resolved.collection}`,
    );
  }
  const { item: flow } = resolved;

  // Load project config to check for devServer.
  // Absence of a config file (ConfigNotFoundError) is a legitimate "no devServer" state.
  // Any other error (malformed JSON, zod validation, fs permission, etc.) MUST surface —
  // silent fallback hides real problems.
  const config: Awaited<ReturnType<typeof dungeonmasterConfigResolveAdapter>> | null =
    await (async () => {
      try {
        return await dungeonmasterConfigResolveAdapter({ startPath });
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'ConfigNotFoundError') {
          return null;
        }
        throw error;
      }
    })();

  let devServerProcess: DevServerProcess | null = null;
  let devServerUrl: ReturnType<typeof devServerUrlContract.parse> | null = null;

  // Smoketest short-circuit: when a canned override prompt is present, the spawned agent does
  // NOT exercise the integration surface — it only calls signal-back. Running the build preflight
  // + dev-server lifecycle in that mode is both wasted work and dangerous (the smoketest itself
  // usually runs inside the very dev-server process siegemaster would otherwise try to restart).
  const hasSmoketestOverride = workItem.smoketestPromptOverride !== undefined;

  if (!hasSmoketestOverride && config?.devServer !== undefined) {
    const { buildCommand, devCommand, port, readinessPath, readinessTimeoutMs } = config.devServer;
    const absoluteStartPath = absoluteFilePathContract.parse(startPath);

    // BUILD PREFLIGHT — recursive retry up to MAX_BUILD_ATTEMPTS via layer broker
    const buildResult = await buildPreflightLoopLayerBroker({
      buildCommand,
      cwd: absoluteStartPath,
      startPath,
      abortSignal,
      attempt: 0,
      maxAttempts: MAX_BUILD_ATTEMPTS,
    });

    if (!buildResult.success) {
      if (abortSignal.aborted) {
        return result;
      }
      // Exhausted retries — mark failed and replan
      const preflightQuestInput = getQuestInputContract.parse({ questId });
      const preflightQuestResult = await questGetBroker({ input: preflightQuestInput });
      const completedAt = new Date().toISOString();

      if (preflightQuestResult.success && preflightQuestResult.quest) {
        const pendingItems = preflightQuestResult.quest.workItems.filter(
          (wi) => isPendingWorkItemStatusGuard({ status: wi.status }) && wi.id !== workItem.id,
        );
        const skippedItems = pendingItems.map((wi) => ({
          id: wi.id,
          status: 'skipped' as const,
          completedAt,
        }));
        const pathseekerReplan = workItemContract.parse({
          id: crypto.randomUUID(),
          role: 'pathseeker',
          status: 'pending',
          spawnerType: 'agent',
          dependsOn: [workItem.id],
          maxAttempts: 3,
          createdAt: new Date().toISOString(),
          insertedBy: workItem.id,
        });
        await questModifyBroker({
          input: {
            questId,
            workItems: [
              {
                id: workItem.id,
                status: 'failed',
                completedAt,
                errorMessage: errorMessageContract.parse('build_preflight_exhausted'),
              },
              ...skippedItems,
              pathseekerReplan,
            ],
          } as ModifyQuestInput,
        });
      }
      return result;
    }

    // START DEV SERVER — recursive retry loop with spiritmender between attempts
    const serverResult = await devServerStartLoopLayerBroker({
      devCommand,
      port,
      hostname: environmentStatics.hostname,
      readinessPath,
      readinessTimeoutMs,
      cwd: absoluteStartPath,
      startPath,
      abortSignal,
      attempt: 0,
      maxAttempts: MAX_DEV_SERVER_START_ATTEMPTS,
    });

    if (!serverResult.success) {
      if (abortSignal.aborted) {
        return result;
      }
      // Exhausted retries — mark failed and replan
      const serverQuestInput = getQuestInputContract.parse({ questId });
      const serverQuestResult = await questGetBroker({ input: serverQuestInput });
      const completedAt = new Date().toISOString();

      if (serverQuestResult.success && serverQuestResult.quest) {
        const pendingItems = serverQuestResult.quest.workItems.filter(
          (wi) => isPendingWorkItemStatusGuard({ status: wi.status }) && wi.id !== workItem.id,
        );
        const skippedItems = pendingItems.map((wi) => ({
          id: wi.id,
          status: 'skipped' as const,
          completedAt,
        }));
        const pathseekerReplan = workItemContract.parse({
          id: crypto.randomUUID(),
          role: 'pathseeker',
          status: 'pending',
          spawnerType: 'agent',
          dependsOn: [workItem.id],
          maxAttempts: 3,
          createdAt: new Date().toISOString(),
          insertedBy: workItem.id,
        });
        await questModifyBroker({
          input: {
            questId,
            workItems: [
              {
                id: workItem.id,
                status: 'failed',
                completedAt,
                errorMessage: errorMessageContract.parse('dev_server_start_exhausted'),
              },
              ...skippedItems,
              pathseekerReplan,
            ],
          } as ModifyQuestInput,
        });
      }
      return result;
    }

    devServerProcess = serverResult.process;
    devServerUrl = devServerUrlContract.parse(`http://${environmentStatics.hostname}:${port}`);
  }

  const slotIndex = slotIndexContract.parse(0);
  let trackedSessionId: SessionId | null = null;

  const workUnit = buildWorkUnitForRoleTransformer({
    role: 'siegemaster',
    flow,
    quest,
    ...(devServerUrl === null ? {} : { devServerUrl }),
    ...(workItem.smoketestPromptOverride === undefined
      ? {}
      : { smoketestPromptOverride: workItem.smoketestPromptOverride }),
  });

  try {
    const spawnResult = await agentSpawnByRoleBroker({
      workUnit,
      startPath,
      abortSignal,
      onLine: ({ line }: { line: string }) => {
        onAgentEntry({
          slotIndex,
          entry: { raw: line },
          ...(trackedSessionId === null ? {} : { sessionId: trackedSessionId }),
        });
      },
      onSessionId: ({ sessionId }) => {
        trackedSessionId = sessionId;
        questModifyBroker({
          input: {
            questId,
            workItems: [{ id: workItem.id, sessionId }],
          } as ModifyQuestInput,
        }).catch((error: unknown) => {
          process.stderr.write(`[siegemaster] session-id update failed: ${String(error)}\n`);
        });
      },
    });

    if (abortSignal.aborted) {
      return result;
    }

    const agentSummary = spawnResult.signal?.summary ?? undefined;
    const agentSignal = spawnResult.signal?.signal ?? undefined;
    const isComplete = agentSignal === 'complete';

    const sessionId = spawnResult.sessionId ?? undefined;

    if (isComplete) {
      await questModifyBroker({
        input: {
          questId,
          workItems: [
            {
              id: workItem.id,
              status: 'complete',
              completedAt: new Date().toISOString(),
              ...(sessionId === undefined ? {} : { sessionId }),
              ...(agentSummary === undefined ? {} : { summary: agentSummary }),
              actualSignal: 'complete',
            },
          ],
        } as ModifyQuestInput,
      });
      return result;
    }

    // Siegemaster reported failures or crashed — mark as failed, skip pending, spawn pathseeker replan
    const completedAt = new Date().toISOString();
    const summaryText = agentSummary ?? '';
    const errorMessage =
      summaryText.length > 0
        ? errorMessageContract.parse(summaryText)
        : errorMessageContract.parse('siege_check_failed');

    // Fetch fresh quest state — work items may have been added since the initial fetch
    const freshQuestInput = getQuestInputContract.parse({ questId });
    const freshQuestResult = await questGetBroker({ input: freshQuestInput });
    const freshWorkItems =
      freshQuestResult.success && freshQuestResult.quest
        ? freshQuestResult.quest.workItems
        : quest.workItems;

    const pendingItems = freshWorkItems.filter(
      (wi) => isPendingWorkItemStatusGuard({ status: wi.status }) && wi.id !== workItem.id,
    );

    const skippedItems = pendingItems.map((wi) => ({
      id: wi.id,
      status: 'skipped' as const,
      completedAt,
    }));

    const pathseekerReplan = workItemContract.parse({
      id: crypto.randomUUID(),
      role: 'pathseeker',
      status: 'pending',
      spawnerType: 'agent',
      dependsOn: [workItem.id],
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
      insertedBy: workItem.id,
    });

    await questModifyBroker({
      input: {
        questId,
        workItems: [
          {
            id: workItem.id,
            status: 'failed',
            completedAt,
            errorMessage,
            ...(sessionId === undefined ? {} : { sessionId }),
            ...(agentSummary === undefined ? {} : { summary: agentSummary }),
            ...(agentSignal === undefined ? {} : { actualSignal: agentSignal }),
          },
          ...skippedItems,
          pathseekerReplan,
        ],
      } as ModifyQuestInput,
    });
  } finally {
    if (devServerProcess !== null) {
      await devServerStopBroker({ process: devServerProcess });
    }
  }
  return result;
};
