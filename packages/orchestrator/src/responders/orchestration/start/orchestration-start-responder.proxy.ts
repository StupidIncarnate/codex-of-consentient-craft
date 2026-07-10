import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import {
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildConfigStub,
  GuildIdStub,
  GuildStub,
  questContract,
} from '@dungeonmaster/shared/contracts';
import { isTerminalWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

import { guildGetBrokerProxy } from '../../../brokers/guild/get/guild-get-broker.proxy';
import { questBuildBugHuntGraphBrokerProxy } from '../../../brokers/quest/build-bug-hunt-graph/quest-build-bug-hunt-graph-broker.proxy';
import { questBuildPathseekerGraphBrokerProxy } from '../../../brokers/quest/build-pathseeker-graph/quest-build-pathseeker-graph-broker.proxy';
import { questFindQuestPathBrokerProxy } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../../../brokers/quest/modify/quest-modify-broker.proxy';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { questExecutionQueueStateProxy } from '../../../state/quest-execution-queue/quest-execution-queue-state.proxy';
import { OrchestrationStartResponder } from './orchestration-start-responder';

type Quest = ReturnType<typeof QuestStub>;

export const OrchestrationStartResponderProxy = (): {
  callResponder: typeof OrchestrationStartResponder;
  setupQuestApproved: (params: { quest: Quest }) => void;
  setupQuestNotApproved: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  setupModifyFailure: (params: { quest: Quest }) => void;
  setupPathseekerInsertFailure: (params: { quest: Quest }) => void;
  getAllPersistedContents: () => readonly unknown[];
  getPersistedQuestAt: (params: { index: number }) => ReturnType<typeof questContract.parse>;
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const guildProxy = guildGetBrokerProxy();
  // The graph-builder brokers are invoked transitively via the responder (pathseeker for feature
  // quests, bug-hunt for bug-hunt quests); mount both proxies so the enforce-proxy-child-creation
  // lint sees the import edges.
  questBuildPathseekerGraphBrokerProxy();
  questBuildBugHuntGraphBrokerProxy();
  const queueProxy = questExecutionQueueStateProxy();
  queueProxy.setupEmpty();
  const processesProxy = orchestrationProcessesStateProxy();
  processesProxy.setupEmpty();

  // The responder mints a couple of UUIDs per call (processId + the single pathseeker graph
  // work-item id). The proxy queues unique values via mockReturnValueOnce so each call gets a
  // distinct id (the first one is the processId asserted by callers; the rest are
  // pathseeker-graph work-item ids whose values are not asserted, only their
  // distinctness).
  const uuidSpy = registerSpyOn({ object: crypto, method: 'randomUUID' });
  uuidSpy.mockReturnValueOnce(
    'f47ac10b-58cc-4372-a567-0e02b2c3d479' as ReturnType<typeof crypto.randomUUID>,
  );
  uuidSpy.mockReturnValueOnce(
    'aaaaaaaa-1111-4222-9333-444444444444' as ReturnType<typeof crypto.randomUUID>,
  );
  uuidSpy.mockReturnValueOnce(
    'bbbbbbbb-1111-4222-9333-444444444444' as ReturnType<typeof crypto.randomUUID>,
  );
  uuidSpy.mockReturnValueOnce(
    'cccccccc-1111-4222-9333-444444444444' as ReturnType<typeof crypto.randomUUID>,
  );
  uuidSpy.mockReturnValueOnce(
    'dddddddd-1111-4222-9333-444444444444' as ReturnType<typeof crypto.randomUUID>,
  );
  uuidSpy.mockReturnValueOnce(
    'eeeeeeee-1111-4222-9333-444444444444' as ReturnType<typeof crypto.randomUUID>,
  );
  uuidSpy.mockReturnValueOnce(
    'ffffffff-1111-4222-9333-444444444444' as ReturnType<typeof crypto.randomUUID>,
  );
  uuidSpy.mockReturnValueOnce(
    '11111111-1111-4222-9333-444444444444' as ReturnType<typeof crypto.randomUUID>,
  );
  uuidSpy.mockReturnValueOnce(
    '22222222-1111-4222-9333-444444444444' as ReturnType<typeof crypto.randomUUID>,
  );
  uuidSpy.mockReturnValueOnce(
    '33333333-1111-4222-9333-444444444444' as ReturnType<typeof crypto.randomUUID>,
  );
  // Fallback for any further calls.
  uuidSpy.mockReturnValue(
    '44444444-1111-4222-9333-444444444444' as ReturnType<typeof crypto.randomUUID>,
  );

  const setupPathResolution = ({ quest }: { quest: Quest }): void => {
    const guildId = GuildIdStub();
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
    const guildPath = FilePathStub({ value: '/home/testuser/project' });

    findQuestPathProxy.setupQuestFound({
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

    const guild = GuildStub({ id: guildId, path: guildPath });
    guildProxy.setupConfig({ config: GuildConfigStub({ guilds: [guild] }) });
  };

  return {
    callResponder: OrchestrationStartResponder,

    setupQuestApproved: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      // The responder issues one modify-quest per status hop, each performing its own quest-file
      // load, so we must queue one mocked read per expected call — reflecting the status the
      // responder will have just written (the mocked filesystem does not see prior persists):
      //   hop 1 (ALWAYS): approved/design_approved → seek_scope, carrying workItems. Read sees the
      //          original status.
      //   hop 2 (fresh feature graph ONLY): write planningNotes.scopeClassification, still at
      //          seek_scope. Read sees seek_scope.
      //   hop 3 (only when NO PathSeeker will run — bug-hunt, or planning already complete):
      //          seek_scope → in_progress promote. Read sees seek_scope. A PathSeeker-planned quest
      //          RESTS at seek_scope and skips this hop (PathSeeker drives the transition itself).
      // A leftover queued read bleeds into the downstream guild-config read, so the count must be
      // exact.
      const seekScopeQuest = questContract.parse({ ...quest, status: 'seek_scope' });
      const hasExistingPathseeker = quest.workItems.some(
        (wi) =>
          wi.role === 'pathseeker' ||
          wi.role === 'pathseeker-surface' ||
          wi.role === 'pathseeker-dedup' ||
          wi.role === 'pathseeker-assertion-correctness' ||
          wi.role === 'pathseeker-walk',
      );
      const isBugHunt = quest.questType === 'bug-hunt';
      // hop 2 runs ONLY for a fresh feature pathseeker graph.
      const freshFeatureGraph = !hasExistingPathseeker && !isBugHunt;
      // Mirrors the responder's `willRunPathseeker`: a non-terminal `pathseeker` item (freshly
      // seeded, or already present) means the quest rests at seek_scope and PathSeeker drives the
      // promote, so hop 3 is skipped.
      const willRunPathseeker =
        !isBugHunt &&
        (freshFeatureGraph ||
          quest.workItems.some(
            (wi) =>
              wi.role === 'pathseeker' && !isTerminalWorkItemStatusGuard({ status: wi.status }),
          ));
      modifyProxy.setupQuestFound({ quest }); // hop 1
      if (freshFeatureGraph) {
        modifyProxy.setupQuestFound({ quest: seekScopeQuest }); // hop 2 (scopeClassification)
      }
      if (!willRunPathseeker) {
        modifyProxy.setupQuestFound({ quest: seekScopeQuest }); // hop 3 (promote to in_progress)
      }

      setupPathResolution({ quest });
    },

    setupQuestNotApproved: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
    },

    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },

    setupModifyFailure: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupEmptyFolder();
    },

    setupPathseekerInsertFailure: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupEmptyFolder();
    },

    getAllPersistedContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),

    getPersistedQuestAt: ({ index }: { index: number }): ReturnType<typeof questContract.parse> => {
      const persisted = modifyProxy.getAllPersistedContents();
      const write = persisted[index];
      return questContract.parse(JSON.parse(String(write)));
    },
  };
};
