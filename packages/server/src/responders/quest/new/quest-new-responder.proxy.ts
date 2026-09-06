import { rm, writeFile } from 'fs/promises';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { locationsQuestFolderPathFindBrokerProxy } from '@dungeonmaster/shared/testing';

import { fsRmAdapterProxy } from '../../../adapters/fs/rm/fs-rm-adapter.proxy';
import { orchestratorStartChatAdapterProxy } from '../../../adapters/orchestrator/start-chat/orchestrator-start-chat-adapter.proxy';
import { pastedImagePersistBrokerProxy } from '../../../brokers/pasted-image/persist/pasted-image-persist-broker.proxy';
import { QuestNewResponder } from './quest-new-responder';
import type { GuildIdStub, ProcessIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

type ProcessId = ReturnType<typeof ProcessIdStub>;
type QuestId = ReturnType<typeof QuestIdStub>;
type GuildId = ReturnType<typeof GuildIdStub>;

export const QuestNewResponderProxy = (): {
  setupQuestNew: (params: {
    guildId: GuildId;
    chatProcessId: ProcessId;
    questId?: QuestId;
  }) => void;
  setupError: (params: { guildId: GuildId; message: string }) => void;
  getLastStartChatArgs: (params: { guildId: GuildId }) => unknown;
  setupPastedImageHome: (params: { homePath: string }) => void;
  // Stages the id the responder's OWN crypto.randomUUID() call (minting the pre-created questId)
  // resolves to. Shares its underlying spy with pastedImagePersistBrokerProxy's stagePastedImageIds
  // below — that spy is a SINGLE global mock, so staging order matters: the responder mints its
  // questId BEFORE the persist broker mints any per-image id, so this must be called first.
  setupMintedQuestId: (params: { questId: QuestId }) => void;
  stagePastedImageIds: (params: { ids: readonly string[] }) => void;
  getWrittenPayloadsInOrder: () => unknown[];
  getRemovedFolderCallsInOrder: () => unknown[];
  callResponder: typeof QuestNewResponder;
} => {
  const adapterProxy = orchestratorStartChatAdapterProxy();
  // pastedImagePersistBroker is APPLICATION code — it runs REAL. This proxy only mocks the npm
  // boundary underneath it, composed exactly the way quest-chat-responder.proxy.ts does.
  const persistProxy = pastedImagePersistBrokerProxy();
  // A second handle onto the SAME shared crypto.randomUUID spy pastedImagePersistBrokerProxy
  // already registers — registerSpyOn shares staging across every handle on one function, so this
  // does not create a competing mock.
  const uuidSpy = registerSpyOn({ object: crypto, method: 'randomUUID' });
  // Extra READ-ONLY handle on the same npm `writeFile` persistProxy already mocks — mirrors
  // quest-chat-responder.proxy.ts's own writeCallsHandle.
  const writeCallsHandle = registerMock({ fn: writeFile });
  const rmProxy = fsRmAdapterProxy();
  // No test here exercises a cleanup failure of its own — that path is covered by
  // fs-rm-adapter's own test suite — so the removal always succeeds, mirroring persistProxy's own
  // unconditional mkdir/write success default above.
  rmProxy.succeeds({ filePath: (): boolean => true });
  // Extra READ-ONLY handle on the SAME npm `rm` rmProxy already mocks — mirrors writeCallsHandle
  // above, giving a test the exact path + options passed to fs.rm.
  const rmCallsHandle = registerMock({ fn: rm });
  // The implementation calls locationsQuestFolderPathFindBroker directly (not only through
  // pastedImagePersistBroker), so its proxy must be composed here too even though it needs no
  // setup of its own — enforce-proxy-child-creation.
  locationsQuestFolderPathFindBrokerProxy();

  return {
    setupQuestNew: ({
      guildId,
      chatProcessId,
      questId,
    }: {
      guildId: GuildId;
      chatProcessId: ProcessId;
      questId?: QuestId;
    }): void => {
      adapterProxy.returns({
        guildId,
        chatProcessId,
        ...(questId === undefined ? {} : { questId }),
      });
    },
    setupError: ({ guildId, message }: { guildId: GuildId; message: string }): void => {
      adapterProxy.throws({ guildId, error: new Error(message) });
    },
    // The raw first-argument object of the most recent startChat call — the only way to prove
    // questType/questId reached the orchestrator, since `returns` addresses on guildId alone and
    // would match identically if either field were dropped.
    getLastStartChatArgs: ({ guildId }: { guildId: GuildId }): unknown =>
      adapterProxy.getLastCalledArgs({ guildId }),
    setupPastedImageHome: ({ homePath }: { homePath: string }): void => {
      persistProxy.setupHome({ homePath });
    },
    setupMintedQuestId: ({ questId }: { questId: QuestId }): void => {
      uuidSpy.onceFor([]).returns(questId);
    },
    stagePastedImageIds: ({ ids }: { ids: readonly string[] }): void => {
      persistProxy.stageImageIds({ ids });
    },
    getWrittenPayloadsInOrder: (): unknown[] =>
      writeCallsHandle.callsMatching([]).map((call) => call[1]),
    // The full [filePath, options] pair for every fs.rm call — proves not just THAT the minted
    // folder was removed but that it was removed recursively/forcefully, from the real address
    // the responder computed rather than a value the test hands back to itself.
    getRemovedFolderCallsInOrder: (): unknown[] =>
      rmCallsHandle.callsMatching([]).map((call) => call),
    callResponder: QuestNewResponder,
  };
};
