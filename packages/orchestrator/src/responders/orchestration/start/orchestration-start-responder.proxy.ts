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

import { guildGetBrokerProxy } from '../../../brokers/guild/get/guild-get-broker.proxy';
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
  // The build-pathseeker-graph broker is invoked transitively via the responder; mount its
  // proxy so the enforce-proxy-child-creation lint sees the import edge.
  questBuildPathseekerGraphBrokerProxy();
  const queueProxy = questExecutionQueueStateProxy();
  queueProxy.setupEmpty();
  const processesProxy = orchestrationProcessesStateProxy();
  processesProxy.setupEmpty();

  // The responder mints several UUIDs per call (processId + 4..N pathseeker graph
  // ids). The proxy queues unique values via mockReturnValueOnce so each call gets a
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
      // The responder mints either TWO modify-quest calls (when the quest already has a
      // pathseeker work item — the planningNotes graph build is skipped: status flip to
      // seek_scope, then promote to in_progress) or THREE modify-quest calls (status+
      // workItems → planningNotes.scopeClassification → promote to in_progress). Each
      // call performs its own quest-file load and consumes the file-read queue, so we
      // must queue one load per expected call.
      //
      // Critical: the modify broker's per-status allowlist gate checks `loadedQuest.status`
      // on every call. The proxy's filesystem read is mocked, so it does NOT see the prior
      // persist's status flip — we must hand-craft the queued reads so each one reflects
      // the status the responder will have just written. The first call lands on the
      // original status (approved or design_approved); every subsequent call lands on
      // seek_scope (the responder's intermediate state during the planningNotes write and
      // the seek_scope → in_progress promote).
      const seekScopeQuest = questContract.parse({ ...quest, status: 'seek_scope' });
      const hasExistingPathseeker = quest.workItems.some(
        (wi) =>
          wi.role === 'pathseeker' ||
          wi.role === 'pathseeker-surface' ||
          wi.role === 'pathseeker-dedup' ||
          wi.role === 'pathseeker-assertion-correctness' ||
          wi.role === 'pathseeker-walk',
      );
      modifyProxy.setupQuestFound({ quest });
      if (!hasExistingPathseeker) {
        modifyProxy.setupQuestFound({ quest: seekScopeQuest });
      }
      // Third call: seek_scope → in_progress promote — loads see seek_scope on disk.
      modifyProxy.setupQuestFound({ quest: seekScopeQuest });

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
