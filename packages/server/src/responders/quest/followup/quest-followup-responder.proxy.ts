import { join } from '#gateway/node/path';
import { questFindQuestPathBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import type { ProcessIdStub } from '@dungeonmaster/shared/contracts/process-id/process-id.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { pastedImagePersistBrokerProxy } from '../../../brokers/pasted-image/persist/pasted-image-persist-broker.proxy';
import { QuestFollowupResponder } from './quest-followup-responder';

type Quest = ReturnType<typeof QuestStub>;
type ProcessId = ReturnType<typeof ProcessIdStub>;
type GuildId = ReturnType<typeof GuildIdStub>;
type AbsoluteFilePath = string;

export const QuestFollowupResponderProxy = (): {
  setupQuestLoad: (params: { quest: Quest }) => void;
  setupQuestLoadError: (params: { questId: Quest['id']; error: Error }) => void;
  setupFindQuestPath: (params: {
    questId: Quest['id'];
    guildId: GuildId;
    // A real process has one home. Pass the SAME homePath given to setupPastedImageHome so both
    // proxies' real chains resolve through the identical dungeonmasterHomeFindBroker() answer.
    homePath?: string;
  }) => void;
  setupStartFollowupChat: (params: { questId: Quest['id']; chatProcessId: ProcessId }) => void;
  setupStartFollowupChatError: (params: { questId: Quest['id']; error: Error }) => void;
  getStartFollowupChatCalls: () => readonly unknown[];
  setupPastedImageHome: (params: { homePath: string }) => void;
  stagePastedImageIds: (params: { ids: readonly string[] }) => void;
  stagePastedImageSourceRead: (params: { filePath: AbsoluteFilePath; bytes: Uint8Array }) => void;
  getPastedImageWrittenPayloadFor: (params: { filePath: string }) => unknown;
  getPastedImageWriteCallCount: () => unknown;
  callResponder: typeof QuestFollowupResponder;
} => {
  const orchestrator = StartOrchestratorProxy();
  // questFindQuestPathBroker is a specific-broker forward, composed via ITS OWN proxy —
  // setupQuestPath runs the REAL broker through its own staged fs dependencies (readdir,
  // path.join, existsSync), the same way questListBrokerProxy's setupDirectList composes the real
  // questListBroker. That proxy also wires the bare `@dungeonmaster/orchestrator` barrel export
  // this responder calls through, so no separate passthrough is needed here.
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  // The persist broker is APPLICATION code and runs REAL here — this proxy only mocks the npm
  // boundary underneath it (mkdir, writeFile, randomUUID, homedir). Its methods are re-exposed
  // below under semantic names scoped to "pasted image", never handed back as a raw child proxy.
  const pastedImageProxy = pastedImagePersistBrokerProxy();
  // pastedImagePersistBroker's own chain resolves `join(homePath, 'guilds', guildId)` — 3 real
  // args — through `#gateway/node/path`'s real-passthrough default that broker's own proxy
  // stages. That default is address-less (0 args), so it loses to findQuestPathProxy's own
  // `join(homePath, 'guilds')` stage (2 args) below on a call sharing that 2-arg PREFIX: a
  // shorter staged description still matches a longer real call (see get-testing-patterns' "How
  // arguments are compared"), and MORE described arguments wins regardless of registration order.
  // Staged here, addressed by the exact 3-arg tuple, only when setupFindQuestPath is given a
  // homePath to collide against.
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
      homePath,
    }: {
      questId: Quest['id'];
      guildId: GuildId;
      homePath?: string;
    }): void => {
      findQuestPathProxy.setupQuestPath({
        questId,
        guildId,
        questPath: `/quests/${questId}`,
        ...(homePath === undefined ? {} : { homeDir: homePath }),
      });

      if (homePath !== undefined) {
        // See the constructor comment above: pins the exact 3-arg tuple
        // pastedImagePersistBroker's own locations chain calls, at the SAME dungeonmaster home
        // findQuestPathProxy just staged, so it outranks that proxy's own 2-arg guildsDir stage.
        const dungeonmasterHomePath = `${homePath}/.dungeonmaster`;
        joinHandle
          .calledWith([dungeonmasterHomePath, dungeonmasterHomeStatics.paths.guildsDir, guildId])
          .returns(
            `${dungeonmasterHomePath}/${dungeonmasterHomeStatics.paths.guildsDir}/${String(guildId)}`,
          );
      }
    },
    setupStartFollowupChat: ({
      questId,
      chatProcessId,
    }: {
      questId: Quest['id'];
      chatProcessId: ProcessId;
    }): void => {
      orchestrator.startFollowupChatReturns({ questId, chatProcessId });
    },
    setupStartFollowupChatError: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
      orchestrator.startFollowupChatThrows({ questId, error });
    },
    // Every call the adapter received, so a rejected-status test can prove it received NONE —
    // not just that the responder's own return value looks right.
    getStartFollowupChatCalls: (): readonly unknown[] => orchestrator.startFollowupChatGetCalls(),
    setupPastedImageHome: ({ homePath }: { homePath: string }): void => {
      pastedImageProxy.setupHome({ homePath });
    },
    stagePastedImageIds: ({ ids }: { ids: readonly string[] }): void => {
      pastedImageProxy.stageImageIds({ ids });
    },
    // A local image path never carries an upload — its bytes come from the filesystem read the
    // persist broker's own scan/copy step performs, which this stages through the same composed
    // pastedImageProxy the upload path above uses.
    stagePastedImageSourceRead: ({
      filePath,
      bytes,
    }: {
      filePath: AbsoluteFilePath;
      bytes: Uint8Array;
    }): void => {
      pastedImageProxy.sourceReads({ filePath, bytes });
    },
    getPastedImageWrittenPayloadFor: ({ filePath }: { filePath: string }): unknown =>
      pastedImageProxy.writtenPayloadFor({ filePath }),
    getPastedImageWriteCallCount: (): unknown => pastedImageProxy.writeCallCount(),
    callResponder: QuestFollowupResponder,
  };
};
