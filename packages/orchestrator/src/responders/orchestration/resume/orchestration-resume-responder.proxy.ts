import type { ProcessId, QuestStub } from '@dungeonmaster/shared/contracts';
import {
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildConfigStub,
  GuildIdStub,
  GuildStub,
} from '@dungeonmaster/shared/contracts';
import { questContract } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { guildGetBrokerProxy } from '../../../brokers/guild/get/guild-get-broker.proxy';
import { questFindQuestPathBrokerProxy } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../../../brokers/quest/modify/quest-modify-broker.proxy';
import { questOrchestrationLoopBrokerProxy } from '../../../brokers/quest/orchestration-loop/quest-orchestration-loop-broker.proxy';
import type { CapturedOrchestrationEmit } from '../../../contracts/captured-orchestration-emit/captured-orchestration-emit-contract';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { OrchestrationResumeResponder } from './orchestration-resume-responder';

type Quest = ReturnType<typeof QuestStub>;

export const OrchestrationResumeResponderProxy = (): {
  callResponder: typeof OrchestrationResumeResponder;
  setupQuestFound: (params: { quest: Quest; rearmWrites?: number }) => void;
  setupQuestNotFound: () => void;
  setupModifyReject: (params: { error: Error }) => void;
  getAllPersistedContents: () => readonly unknown[];
  getLastPersistedQuest: () => ReturnType<typeof questContract.parse>;
  getPersistedQuestAt: (params: { index: number }) => ReturnType<typeof questContract.parse>;
  getRegisteredProcessIds: () => readonly ProcessId[];
  getEmittedResumeEvents: () => readonly CapturedOrchestrationEmit[];
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const guildGetProxy = guildGetBrokerProxy();
  questOrchestrationLoopBrokerProxy();
  const eventsProxy = orchestrationEventsStateProxy();
  const emittedResumeEvents = eventsProxy.captureEmits({ type: 'quest-resumed' });
  const stateProxy = orchestrationProcessesStateProxy();
  stateProxy.setupEmpty();

  registerSpyOn({ object: crypto, method: 'randomUUID' })
    .calledWith([])
    .returns('f47ac10b-58cc-4372-a567-0e02b2c3d479');

  return {
    callResponder: OrchestrationResumeResponder,

    // The whole chain is FIFO-queued file I/O, so slots must be staged in the order the responder
    // calls them. `rearmWrites` is how many work-item rearm modifies the blocked path performs
    // BEFORE the status flip (1 when the quest has resumable wreckage, 0 otherwise) — a paused
    // quest never rearms, so it defaults to none.
    setupQuestFound: ({ quest, rearmWrites = 0 }: { quest: Quest; rearmWrites?: number }): void => {
      // Initial questGetBroker load.
      getProxy.setupQuestFound({ quest });
      // questModifyBroker work-item rearm (blocked path only).
      Array.from({ length: rearmWrites }).forEach(() => {
        modifyProxy.setupQuestFound({ quest });
      });
      // questModifyBroker flip-status + clear pausedAtStatus.
      modifyProxy.setupQuestFound({ quest });
      // Re-fetch after modify.
      getProxy.setupQuestFound({ quest });

      // Inline launch dispatch mirrors RecoverGuildLayerResponder. Wire the full chain:
      // - questFindQuestPathBroker → guildId
      // - guildGetBroker → guild.path
      // - questModifyBroker additional call (inline orphan reset, conditional on orphaned
      //   active work items)
      // - questOrchestrationLoopBroker (layer brokers auto-resolve to undefined)

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

      guildGetProxy.setupConfig({
        config: GuildConfigStub({
          guilds: [
            GuildStub({
              id: guildId,
              path: FilePathStub({ value: '/home/user/test-guild' }) as never,
            }),
          ],
        }),
      });

      // Spare modify slots. Beyond the status flip, a resume fires up to two more
      // modifyQuestBroker calls — the blocked-path work-item rearm and the inline orphan reset —
      // each conditional on there being something to write, so unused slots are just headroom.
      modifyProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },

    setupModifyReject: ({ error }: { error: Error }): void => {
      modifyProxy.setupReject({ error });
    },

    getAllPersistedContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),

    getLastPersistedQuest: (): ReturnType<typeof questContract.parse> => {
      const persisted = modifyProxy.getAllPersistedContents();
      const lastWrite = persisted[persisted.length - 1];
      return questContract.parse(JSON.parse(String(lastWrite)));
    },

    // A resume writes in a fixed order — rearm (blocked path only), then the status flip — so the
    // index is what lets a test assert the rearm landed BEFORE the quest became dispatchable.
    getPersistedQuestAt: ({ index }: { index: number }): ReturnType<typeof questContract.parse> => {
      const persisted = modifyProxy.getAllPersistedContents();
      return questContract.parse(JSON.parse(String(persisted[index])));
    },

    getRegisteredProcessIds: (): readonly ProcessId[] => orchestrationProcessesState.getAll(),

    getEmittedResumeEvents: (): readonly CapturedOrchestrationEmit[] => emittedResumeEvents,
  };
};
