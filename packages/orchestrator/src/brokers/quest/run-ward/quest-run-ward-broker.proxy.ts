/**
 * PURPOSE: Proxy for questRunWardBroker — composes the dependency proxies and exposes semantic
 *   setup methods plus inspectors for what the broker wrote to the quest file.
 *
 * USAGE:
 * const proxy = questRunWardBrokerProxy();
 * proxy.setupWardPass({ quest, runId: 'run-123' });
 * await questRunWardBroker({ questId, workItemId, mode: 'changed' });
 * expect(proxy.getPersistedWorkItemStatus({ workItemId })).toBe('complete');
 */

import {
  childProcessSpawnStreamLinesAdapterProxy,
  fsMkdirAdapterProxy,
  pathJoinAdapterProxy,
  processCwdAdapterProxy,
} from '@dungeonmaster/shared/testing';
import {
  ExitCodeStub,
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildIdStub,
  questContract,
  wardResultContract,
  type ExitCode,
  type FileName,
  type Quest,
  type QuestStub,
  type QuestWorkItemId,
  type WardResult,
  type WorkItem,
  type WorkItemStatus,
} from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { wardDetailBrokerProxy } from '../../ward/detail/ward-detail-broker.proxy';
import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { questSpliceFixerBrokerProxy } from '../splice-fixer/quest-splice-fixer-broker.proxy';
import { questSplicePathseekerReplanBrokerProxy } from '../splice-pathseeker-replan/quest-splice-pathseeker-replan-broker.proxy';

type QuestInput = ReturnType<typeof QuestStub>;

const FIXED_WARD_RESULT_UUID = 'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f0f0';
const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';

// A realistic ward-detail blob with one lint error so wardDetailToSpiritmenderBatchesTransformer
// produces a non-empty batch (one file, one error) on the ward failure recovery path.
const WARD_FAIL_DETAIL_JSON = JSON.stringify({
  checks: [
    {
      checkType: 'lint',
      projectResults: [
        {
          errors: [
            {
              filePath: '/project/src/broken.ts',
              line: 12,
              column: 4,
              message: 'Unexpected any',
              rule: 'no-explicit-any',
            },
          ],
          testFailures: [],
        },
      ],
    },
  ],
});

export const questRunWardBrokerProxy = (): {
  setupWardPass: (params: { quest: QuestInput; runId: FileName }) => void;
  setupWardFail: (params: { quest: QuestInput; exitCode: ExitCode; runId: FileName }) => void;
  setupWardFailExhausted: (params: {
    quest: QuestInput;
    exitCode: ExitCode;
    runId: FileName;
  }) => void;
  setupWardCrash: (params: { quest: QuestInput; exitCode: ExitCode }) => void;
  setupWardCrashRecover: (params: { quest: QuestInput; exitCode: ExitCode }) => void;
  getPersistedWorkItemStatus: (params: {
    workItemId: QuestWorkItemId;
  }) => WorkItemStatus | undefined;
  getPersistedLastWardRunId: (params: { workItemId: QuestWorkItemId }) => FileName | undefined;
  getPersistedWorkItemRelatedDataItems: (params: {
    workItemId: QuestWorkItemId;
  }) => WorkItem['relatedDataItems'] | undefined;
  getPersistedWardModes: () => readonly ('changed' | 'full' | undefined)[];
  getPersistedWardResultExitCode: () => ExitCode | undefined;
  getFinalPersistedWorkItems: () => readonly WorkItem[];
  getFinalPersistedQuestStatus: () => Quest['status'] | undefined;
  getReplanCalls: () => readonly (readonly unknown[])[];
  getSpawnedArgs: () => unknown;
  getFixedWardResultId: () => WardResult['id'];
} => {
  // Outermost layer setup MIRRORS run-ward-layer-broker.proxy. Critical: fsMkdir + fsWriteFile +
  // an extra pathJoinAdapterProxy must be registered here so wardPersistResultBroker has its own
  // path-join queue slot (queueWardPersistPathJoins below) that does not steal returns intended
  // for the deeper questPersistBroker chain.
  fsMkdirAdapterProxy();
  const ownWriteFileProxy = fsWriteFileAdapterProxy();
  const extraPathJoin = pathJoinAdapterProxy();
  const findProxy = questFindQuestPathBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const getProxy = questGetBrokerProxy();
  const replanProxy = questSplicePathseekerReplanBrokerProxy();
  const spliceProxy = questSpliceFixerBrokerProxy();
  const detailProxy = wardDetailBrokerProxy();
  const spawnProxy = childProcessSpawnStreamLinesAdapterProxy();
  const cwdProxy = processCwdAdapterProxy();
  cwdProxy.returns({ path: '/project' });

  const WARD_RESULTS_PATH = FilePathStub({ value: '/home/testuser/ward-results' });
  const WARD_RESULT_FILE_PATH = FilePathStub({
    value: '/home/testuser/ward-results/result.json',
  });
  const BATCHES_DIR_PATH = FilePathStub({ value: '/home/testuser/spiritmender-batches' });
  const BATCH_FILE_PATH = FilePathStub({
    value: '/home/testuser/spiritmender-batches/batch.json',
  });

  const queueWardPersistPathJoins = (): void => {
    // Broker inlines two pathJoinAdapter calls when persisting the ward detail blob:
    // wardResultsDir + the detail file path. Queue both BEFORE the modify queue so they
    // don't steal modify's queued returns.
    extraPathJoin.returns({ result: WARD_RESULTS_PATH });
    extraPathJoin.returns({ result: WARD_RESULT_FILE_PATH });
  };

  const queueBatchPathJoins = ({ batchCount }: { batchCount: number }): void => {
    // On the ward failure recovery path the broker inlines pathJoin for the batches dir +
    // one per spiritmender batch file.
    extraPathJoin.returns({ result: BATCHES_DIR_PATH });
    Array.from({ length: batchCount }).forEach(() => {
      extraPathJoin.returns({ result: BATCH_FILE_PATH });
    });
  };

  // Pin crypto.randomUUID + Date.prototype.toISOString so result objects are deterministic.
  // The FIRST randomUUID call is the wardResultId (preserved as FIXED_WARD_RESULT_UUID so the
  // happy-path tests keep matching getFixedWardResultId()); every subsequent call (spiritmender
  // ids, ward-retry id) gets a distinct valid UUID so the recovery splice produces non-colliding
  // ids whose exact dependency wiring the tests can assert.
  const uuidCounter = { value: 0 };
  const uuidSuffixWidth = 2;
  const uuidSpy = registerSpyOn({ object: crypto, method: 'randomUUID' });
  uuidSpy.mockImplementation(((): ReturnType<typeof crypto.randomUUID> => {
    const index = uuidCounter.value;
    uuidCounter.value += 1;
    const value =
      index === 0
        ? FIXED_WARD_RESULT_UUID
        : `f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f0${String(index).padStart(uuidSuffixWidth, '0')}`;
    return value as ReturnType<typeof crypto.randomUUID>;
  }) as typeof crypto.randomUUID);
  registerSpyOn({ object: Date.prototype, method: 'toISOString' }).mockReturnValue(FIXED_TIMESTAMP);

  const setupFindQuestPathForBroker = ({ quest }: { quest: QuestInput }): void => {
    const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
    const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
    const guildsDir = FilePathStub({ value: '/home/testuser/.dungeonmaster/guilds' });
    const questsDirPath = FilePathStub({
      value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
    });
    const questFolderPath = FilePathStub({
      value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`,
    });
    const questFilePath = FilePathStub({
      value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json`,
    });

    findProxy.setupQuestFound({
      homeDir: '/home/testuser',
      homePath,
      guildsDir,
      guilds: [
        {
          dirName: FileNameStub({ value: guildId }),
          questsDirPath,
          questFolders: [
            {
              folderName: FileNameStub({ value: quest.folder }),
              questFilePath,
              questFolderPath,
              contents: FileContentsStub({ value: JSON.stringify(quest) }),
            },
          ],
        },
      ],
    });
  };

  const parseAllPersistedQuests = (): readonly Quest[] =>
    ownWriteFileProxy
      .getAllWrittenFiles()
      .filter(({ path }) => {
        const pathStr = String(path);
        return pathStr.endsWith('quest.json') || pathStr.endsWith('quest.json.tmp');
      })
      .map(({ content }) => {
        const parsed = typeof content === 'string' ? (JSON.parse(content) as unknown) : content;
        return questContract.parse(parsed);
      });

  // The authoritative post-recovery quest on the RECOVER path is whatever questSpliceFixerBroker
  // (real) persisted last — the spliced + rewired workItems. The EXHAUSTION path delegates to
  // questSplicePathseekerReplanBroker (stubbed here; its own test proves the mark-failed + skip +
  // splice), so this returns undefined there and the exhaustion tests assert the delegation instead.
  const resolveFinalRecoveryQuest = (): Quest | undefined => {
    const spliced = spliceProxy.getPersistedQuests();
    return spliced[spliced.length - 1];
  };

  const findWorkItemInLatestQuest = ({
    workItemId,
  }: {
    workItemId: QuestWorkItemId;
  }): WorkItem | undefined => {
    const quests = parseAllPersistedQuests();
    const reversed = [...quests].reverse();
    for (const quest of reversed) {
      const found = quest.workItems.find((w) => w.id === workItemId);
      if (found && found.status !== 'in_progress') {
        return found;
      }
    }
    return undefined;
  };

  return {
    setupWardPass: ({ quest, runId }: { quest: QuestInput; runId: FileName }): void => {
      // Queue order matters — must match broker's call order so each consumer pops the
      // pathJoin return intended for it.
      // 1. questFindQuestPathBroker (direct) — 4 pathJoins
      setupFindQuestPathForBroker({ quest });
      // 2. wardPersistResultBroker — 2 pathJoins
      queueWardPersistPathJoins();
      // 3-4. questModifyBroker × 2 — each queues a questFilePath + outbox pathJoin
      modifyProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });

      spawnProxy.setupSuccess({
        exitCode: ExitCodeStub({ value: 0 }),
        stdoutLines: [`run: ${runId}`, 'lint: PASS'],
      });
      detailProxy.setupSuccess({ output: '{"checks":[]}' });
    },

    setupWardFail: ({
      quest,
      exitCode,
      runId,
    }: {
      quest: QuestInput;
      exitCode: ExitCode;
      runId: FileName;
    }): void => {
      setupFindQuestPathForBroker({ quest });
      queueWardPersistPathJoins();
      // 3-4. questModifyBroker × 2 (wardResults + work-item terminal)
      modifyProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      // 5. questGetBroker — load quest for failure routing (retry budget + blightwarden check)
      getProxy.setupQuestFound({ quest });
      // 6. spiritmender batch sidecar writes (one batch from WARD_FAIL_DETAIL_JSON)
      queueBatchPathJoins({ batchCount: 1 });
      // 7. questSpliceFixerBroker → questWorkItemInsertBroker → questModifyBroker (real splice)
      spliceProxy.setupQuestModify({ quest });
      // Exhausted-retry routing instead escalates to questSplicePathseekerReplanBroker — stubbed so
      // the recover path never triggers a real replan.
      replanProxy.setupReplanned();

      spawnProxy.setupSuccess({
        exitCode,
        stdoutLines: [`run: ${runId}`, 'lint: FAIL'],
      });
      // Inject a realistic ward-detail blob so the batch transformer produces a non-empty
      // batch (the broker's recovery path then splices a spiritmender + ward retry).
      detailProxy.setupSuccess({ output: WARD_FAIL_DETAIL_JSON });
    },

    setupWardFailExhausted: ({
      quest,
      exitCode,
      runId,
    }: {
      quest: QuestInput;
      exitCode: ExitCode;
      runId: FileName;
    }): void => {
      // Same prefix as setupWardFail up to the failure-routing fork. The ward item here is on its
      // last attempt (attempt >= maxAttempts - 1), so the broker escalates to
      // questSplicePathseekerReplanBroker instead of splicing spiritmenders. The broker still marks
      // the ward item `failed` via its own work-item-terminal modify; the replan is stubbed, so the
      // exhaustion tests assert the ward-failed persist + the replan delegation.
      setupFindQuestPathForBroker({ quest });
      queueWardPersistPathJoins();
      // 3-4. questModifyBroker × 2 (wardResults + work-item terminal → failed)
      modifyProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      // 5. questGetBroker — load quest for failure routing (retry budget check)
      getProxy.setupQuestFound({ quest });
      // 6. questSplicePathseekerReplanBroker (stubbed escalation).
      replanProxy.setupReplanned();

      spawnProxy.setupSuccess({
        exitCode,
        stdoutLines: [`run: ${runId}`, 'lint: FAIL'],
      });
      detailProxy.setupSuccess({ output: WARD_FAIL_DETAIL_JSON });
    },

    setupWardCrash: ({ quest, exitCode }: { quest: QuestInput; exitCode: ExitCode }): void => {
      // No runId => no wardPersistResultBroker calls => skip queueWardPersistPathJoins.
      setupFindQuestPathForBroker({ quest });
      modifyProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });

      spawnProxy.setupSuccess({
        exitCode,
        stdoutLines: ['fatal error'],
      });
    },

    setupWardCrashRecover: ({
      quest,
      exitCode,
    }: {
      quest: QuestInput;
      exitCode: ExitCode;
    }): void => {
      // Ward crashes before emitting a runId => detailJson is null => zero structured batches.
      // With the failure-routing quest load wired, the broker must STILL splice a fallback
      // spiritmender (one batch) so the ward-retry never depends on an empty set.
      setupFindQuestPathForBroker({ quest });
      modifyProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      getProxy.setupQuestFound({ quest });
      queueBatchPathJoins({ batchCount: 1 });
      spliceProxy.setupQuestModify({ quest });
      replanProxy.setupReplanned();

      spawnProxy.setupSuccess({
        exitCode,
        stdoutLines: ['fatal error'],
      });
    },

    getPersistedWorkItemStatus: ({
      workItemId,
    }: {
      workItemId: QuestWorkItemId;
    }): WorkItemStatus | undefined => findWorkItemInLatestQuest({ workItemId })?.status,

    getPersistedLastWardRunId: ({
      workItemId,
    }: {
      workItemId: QuestWorkItemId;
    }): FileName | undefined => findWorkItemInLatestQuest({ workItemId })?.lastWardRunId,

    getPersistedWorkItemRelatedDataItems: ({
      workItemId,
    }: {
      workItemId: QuestWorkItemId;
    }): WorkItem['relatedDataItems'] | undefined =>
      findWorkItemInLatestQuest({ workItemId })?.relatedDataItems,

    getPersistedWardModes: (): readonly ('changed' | 'full' | undefined)[] => {
      const quests = parseAllPersistedQuests();
      const reversed = [...quests].reverse();
      const found = reversed.find((q) => q.wardResults.length > 0);
      return found ? found.wardResults.map((r) => r.wardMode) : [];
    },

    getPersistedWardResultExitCode: (): ExitCode | undefined => {
      const quests = parseAllPersistedQuests();
      const reversed = [...quests].reverse();
      const found = reversed.find((q) => q.wardResults.length > 0);
      return found?.wardResults[found.wardResults.length - 1]?.exitCode;
    },

    getFinalPersistedWorkItems: (): readonly WorkItem[] => {
      const recovered = resolveFinalRecoveryQuest();
      return recovered ? recovered.workItems : [];
    },

    getFinalPersistedQuestStatus: (): Quest['status'] | undefined =>
      resolveFinalRecoveryQuest()?.status,

    getReplanCalls: (): readonly (readonly unknown[])[] => replanProxy.getCalls(),

    getSpawnedArgs: (): unknown => spawnProxy.getSpawnedArgs(),

    getFixedWardResultId: (): WardResult['id'] =>
      wardResultContract.parse({
        id: FIXED_WARD_RESULT_UUID,
        createdAt: FIXED_TIMESTAMP,
        exitCode: 0,
      }).id,
  };
};
