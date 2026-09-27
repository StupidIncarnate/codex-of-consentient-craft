import { writeFile } from 'fs/promises';
import { join } from '#gateway/node/path';
import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { questFindQuestPathBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type {
  AbsoluteFilePathStub,
  GuildIdStub,
  ProcessIdStub,
  QuestId,
  QuestStatus,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { pastedImagePersistBrokerProxy } from '../../../brokers/pasted-image/persist/pasted-image-persist-broker.proxy';
import { zodFirstFieldErrorMessageAdapterProxy } from '../../../adapters/zod/first-field-error-message/zod-first-field-error-message-adapter.proxy';
import { QuestChatResponder } from './quest-chat-responder';

type Quest = ReturnType<typeof QuestStub>;
type ProcessId = ReturnType<typeof ProcessIdStub>;
type GuildId = ReturnType<typeof GuildIdStub>;
type AbsoluteFilePath = ReturnType<typeof AbsoluteFilePathStub>;

export const QuestChatResponderProxy = (): {
  setupQuestLoad: (params: { quest: Quest }) => void;
  setupQuestLoadError: (params: { questId: QuestId; error: Error }) => void;
  setupFindQuestPath: (params: {
    questId: QuestId;
    guildId: GuildId;
    questPath: AbsoluteFilePath;
    homePath?: string;
  }) => void;
  setupStartChat: (params: { guildId: GuildId; chatProcessId: ProcessId }) => void;
  setupStartChatError: (params: { guildId: GuildId; message: string }) => void;
  setupResumeQuest: (params: {
    questId: QuestId;
    resumed: boolean;
    restoredStatus: QuestStatus;
  }) => void;
  setupResumeQuestError: (params: { questId: QuestId; message: string }) => void;
  getResumeQuestCalls: () => readonly unknown[];
  assertResumeCalledBeforeStartChat: () => boolean;
  getStartChatCallArgs: (params: { guildId: GuildId }) => unknown;
  getStartChatCallCount: () => unknown;
  setupPastedImageHome: (params: { homePath: string }) => void;
  stagePastedImageIds: (params: { ids: readonly string[] }) => void;
  stagePastedImageSourceRead: (params: { filePath: AbsoluteFilePath; bytes: Uint8Array }) => void;
  getWrittenPayloadsInOrder: () => unknown[];
  callResponder: typeof QuestChatResponder;
} => {
  const orchestrator = StartOrchestratorProxy();
  // questFindQuestPathBroker is a specific-broker forward, composed via ITS OWN proxy —
  // setupQuestPath/setupQuestPathError run the REAL broker through its own staged fs dependencies
  // (readdir, path.join, existsSync), the same way questListBrokerProxy's setupDirectList composes
  // the real questListBroker. That proxy also wires the bare `@dungeonmaster/orchestrator` barrel
  // export this responder calls through, so no separate passthrough is needed here.
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  // startChat has no cross-package getLastCalledArgs scenario on StartOrchestratorProxy, so this
  // second registerMock call on the SAME mocked fn is read-only — it shares the underlying staged
  // calls with the handle StartOrchestratorProxy already registered (jestRegisterMockAdapter keys
  // its state by the mock function itself), never calling .calledWith() on it.
  const startChatHandle = registerMock({ fn: StartOrchestrator.startChat });
  // pastedImagePersistBroker is APPLICATION code — it runs REAL. This proxy only mocks the npm
  // boundary underneath it (mkdir, writeFile, randomUUID, homedir), composed exactly the way the
  // broker's own test does.
  const persistProxy = pastedImagePersistBrokerProxy();
  // The adapter has no I/O to mock (see its own proxy header) — composing it here is what the
  // proxy-child-creation rule expects of every implementation import, not a stage this test needs.
  zodFirstFieldErrorMessageAdapterProxy();
  // pastedImagePersistBroker's own chain resolves `join(homePath, 'guilds', guildId)` — 3 real
  // args — through `#gateway/node/path`'s real-passthrough default that broker's own proxy
  // stages. That default is address-less (0 args), so it loses to findQuestPathProxy's own
  // `join(homePath, 'guilds')` stage (2 args) below on a call sharing that 2-arg PREFIX: a
  // shorter staged description still matches a longer real call (see get-testing-patterns' "How
  // arguments are compared"), and MORE described arguments wins regardless of registration order.
  // Staged here, addressed by the exact 3-arg tuple, only when setupFindQuestPath is given a
  // homePath to collide against.
  const joinHandle = registerMock({ fn: join });
  // Extra READ-ONLY handle on the same npm `writeFile` persistProxy's own fsWriteFileBase64AdapterProxy
  // already stages. It never calls .calledWith, only .callsMatching, so it cannot collide with that
  // staging — same pattern pastedImagePersistBrokerProxy itself uses for its writeCallCount(). This is
  // what lets a test see every write's raw base64 payload in invocation order without first computing
  // each write's absolute destination path.
  const writeCallsHandle = registerMock({ fn: writeFile });

  return {
    setupQuestLoad: ({ quest }: { quest: Quest }): void => {
      orchestrator.loadQuestReturns({ questId: quest.id, quest });
    },
    setupQuestLoadError: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      orchestrator.loadQuestThrows({ questId, error });
    },
    setupFindQuestPath: ({
      questId,
      guildId,
      questPath,
      homePath,
    }: {
      questId: QuestId;
      guildId: GuildId;
      questPath: AbsoluteFilePath;
      // A real process has one home. Pass the SAME homePath given to setupPastedImageHome so
      // both proxies' real chains resolve through the identical homedir() answer.
      homePath?: string;
    }): void => {
      findQuestPathProxy.setupQuestPath({
        questId,
        guildId,
        questPath,
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
    setupStartChat: ({
      guildId,
      chatProcessId,
    }: {
      guildId: GuildId;
      chatProcessId: ProcessId;
    }): void => {
      orchestrator.startChatReturns({ guildId, chatProcessId });
    },
    setupStartChatError: ({ guildId, message }: { guildId: GuildId; message: string }): void => {
      orchestrator.startChatThrows({ guildId, error: new Error(message) });
    },
    // Explicit staging for the "quest was paused" path — resumeQuest genuinely gets called for
    // that questId before start-chat, so the mock must be told what it resolves to instead of
    // leaning on an implicit default.
    setupResumeQuest: ({
      questId,
      resumed,
      restoredStatus,
    }: {
      questId: QuestId;
      resumed: boolean;
      restoredStatus: QuestStatus;
    }): void => {
      orchestrator.resumeQuestReturns({ questId, resumed, restoredStatus });
    },
    setupResumeQuestError: ({ questId, message }: { questId: QuestId; message: string }): void => {
      orchestrator.resumeQuestThrows({ questId, error: new Error(message) });
    },
    getResumeQuestCalls: (): readonly unknown[] => {
      const resumeFn = StartOrchestrator.resumeQuest as jest.MockedFunction<
        typeof StartOrchestrator.resumeQuest
      >;
      return resumeFn.mock.calls.map(([firstArg]) => firstArg);
    },
    assertResumeCalledBeforeStartChat: (): boolean => {
      const resumeFn = StartOrchestrator.resumeQuest as jest.MockedFunction<
        typeof StartOrchestrator.resumeQuest
      >;
      const startChatFn = StartOrchestrator.startChat as jest.MockedFunction<
        typeof StartOrchestrator.startChat
      >;
      const [resumeOrder] = resumeFn.mock.invocationCallOrder;
      const [startChatOrder] = startChatFn.mock.invocationCallOrder;
      if (resumeOrder === undefined || startChatOrder === undefined) {
        return false;
      }
      return resumeOrder < startChatOrder;
    },
    getStartChatCallArgs: ({ guildId }: { guildId: GuildId }): unknown =>
      startChatHandle.callsMatching([{ guildId }]).at(-1)?.[0],
    getStartChatCallCount: (): unknown => {
      const startChatFn = StartOrchestrator.startChat as jest.MockedFunction<
        typeof StartOrchestrator.startChat
      >;
      return startChatFn.mock.calls.length;
    },
    setupPastedImageHome: ({ homePath }: { homePath: string }): void => {
      persistProxy.setupHome({ homePath });
    },
    stagePastedImageIds: ({ ids }: { ids: readonly string[] }): void => {
      persistProxy.stageImageIds({ ids });
    },
    // A local image path never carries an upload — its bytes come from the filesystem read the
    // persist broker's own scan/copy step performs, which this stages through the same composed
    // persistProxy the upload path above uses.
    stagePastedImageSourceRead: ({
      filePath,
      bytes,
    }: {
      filePath: AbsoluteFilePath;
      bytes: Uint8Array;
    }): void => {
      persistProxy.sourceReads({ filePath, bytes });
    },
    // Raw base64 payload per write, in the order fs actually received them — the images.map()
    // callback in pastedImagePersistBroker starts each write synchronously in input order (see
    // that broker's own proxy for why), so this is the posted order too.
    getWrittenPayloadsInOrder: (): unknown[] =>
      writeCallsHandle.callsMatching([]).map((call) => call[1]),
    callResponder: QuestChatResponder,
  };
};
