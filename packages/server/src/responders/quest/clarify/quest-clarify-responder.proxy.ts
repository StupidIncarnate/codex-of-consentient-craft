import { join } from '#gateway/node/path';
import { questFindQuestPathBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { pastedImagePersistBrokerProxy } from '../../../brokers/pasted-image/persist/pasted-image-persist-broker.proxy';
import { QuestClarifyResponder } from './quest-clarify-responder';

type Quest = ReturnType<typeof QuestStub>;
type ProcessId = string;
type GuildId = ReturnType<typeof GuildIdStub>;
type AbsoluteFilePath = string;

export const QuestClarifyResponderProxy = (): {
  setupQuestLoad: (params: { quest: Quest }) => void;
  setupQuestLoadError: (params: { questId: Quest['id']; error: Error }) => void;
  setupFindQuestPath: (params: {
    questId: Quest['id'];
    guildId: GuildId;
    questPath: AbsoluteFilePath;
    homePath?: string;
  }) => void;
  setupClarify: (params: { questId: Quest['id']; chatProcessId: ProcessId }) => void;
  setupClarifyError: (params: { questId: Quest['id']; message: string }) => void;
  setupPastedImageHome: (params: { homePath: string }) => void;
  stagePastedImageIds: (params: { ids: readonly string[] }) => void;
  getWrittenImagePaths: () => unknown[];
  getWrittenPayloadFor: (params: { filePath: AbsoluteFilePath }) => unknown;
  getClarifyAnswerCallArgs: () => unknown[];
  callResponder: typeof QuestClarifyResponder;
} => {
  const orchestrator = StartOrchestratorProxy();
  // questFindQuestPathBroker is a specific-broker forward, composed via ITS OWN proxy —
  // setupQuestPath runs the REAL broker through its own staged fs dependencies (readdir,
  // path.join, existsSync), the same way questListBrokerProxy's setupDirectList composes the real
  // questListBroker. That proxy also wires the bare `@dungeonmaster/orchestrator` barrel export
  // this responder calls through, so no separate passthrough is needed here.
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  // pastedImagePersistBroker is APPLICATION code and runs REAL; this proxy only stages the fs,
  // randomUUID and homedir boundary underneath it.
  const persistProxy = pastedImagePersistBrokerProxy();
  const joinHandle = registerMock({ fn: join });

  return {
    setupQuestLoad: ({ quest }: { quest: Quest }): void => {
      orchestrator.loadQuestReturns({ questId: quest.id, quest });
    },
    setupQuestLoadError: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
      orchestrator.loadQuestThrows({ questId, error });
    },
    setupFindQuestPath: ({
      questId,
      guildId,
      questPath,
      homePath,
    }: {
      questId: Quest['id'];
      guildId: GuildId;
      questPath: AbsoluteFilePath;
      // Pass the SAME homePath given to setupPastedImageHome so both real chains resolve through
      // the identical homedir() answer.
      homePath?: string;
    }): void => {
      findQuestPathProxy.setupQuestPath({
        questId,
        guildId,
        questPath,
        ...(homePath === undefined ? {} : { homeDir: homePath }),
      });

      if (homePath !== undefined) {
        // The persist broker's locations chain calls join() with this exact 3-arg tuple; pinning it
        // outranks findQuestPathProxy's own 2-arg guildsDir stage that shares the same prefix.
        const dungeonmasterHomePath = `${homePath}/.dungeonmaster`;
        joinHandle
          .calledWith([dungeonmasterHomePath, dungeonmasterHomeStatics.paths.guildsDir, guildId])
          .returns(
            `${dungeonmasterHomePath}/${dungeonmasterHomeStatics.paths.guildsDir}/${String(guildId)}`,
          );
      }
    },
    setupClarify: ({
      questId,
      chatProcessId,
    }: {
      questId: Quest['id'];
      chatProcessId: ProcessId;
    }): void => {
      orchestrator.clarifyAnswerReturns({ questId, chatProcessId });
    },
    setupClarifyError: ({ questId, message }: { questId: Quest['id']; message: string }): void => {
      orchestrator.clarifyAnswerThrows({ questId, error: new Error(message) });
    },
    setupPastedImageHome: ({ homePath }: { homePath: string }): void => {
      persistProxy.setupHome({ homePath });
    },
    stagePastedImageIds: ({ ids }: { ids: readonly string[] }): void => {
      persistProxy.stageImageIds({ ids });
    },
    getWrittenImagePaths: (): unknown[] => persistProxy.writtenImagePaths(),
    getWrittenPayloadFor: ({ filePath }: { filePath: AbsoluteFilePath }): unknown =>
      persistProxy.writtenPayloadFor({ filePath }),
    getClarifyAnswerCallArgs: (): unknown[] => [...orchestrator.clarifyAnswerGetCalls()],
    callResponder: QuestClarifyResponder,
  };
};
