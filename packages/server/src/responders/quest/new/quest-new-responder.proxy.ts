import { randomUUID } from '#gateway/node/crypto';
import { rmProxy } from '#gateway/node/fs__promises/rm/rm.proxy';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import type { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { locationsQuestFolderPathFindBrokerProxy } from '@dungeonmaster/shared/brokers/locations/quest-folder-path-find/locations-quest-folder-path-find-broker.proxy';

import { pastedImagePersistBrokerProxy } from '../../../brokers/pasted-image/persist/pasted-image-persist-broker.proxy';
import { QuestNewResponder } from './quest-new-responder';
import type { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import type { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';

type ProcessId = string;
type QuestId = ReturnType<typeof QuestIdStub>;
type GuildId = ReturnType<typeof GuildIdStub>;
// Derived from the real StartOrchestrator.startChat signature (never hand-typed) so the elements
// startChatGetCalls() hands back can be read by field without an ad-hoc structural cast.
type StartChatParams = Parameters<typeof StartOrchestrator.startChat>[0];

const removalPathPredicate = (path: unknown): boolean =>
  typeof path === 'string' && path.includes('/quests/');

export const QuestNewResponderProxy = (): {
  setupQuestNew: (params: {
    guildId: GuildId;
    chatProcessId: ProcessId;
    questId?: QuestId;
  }) => void;
  setupError: (params: { guildId: GuildId; message: string }) => void;
  getLastStartChatArgs: (params: { guildId: GuildId }) => unknown;
  setupPastedImageHome: (params: { homePath: string }) => void;
  // Stages the id the responder's OWN randomUUID() call (minting the pre-created questId) resolves
  // to. It shares the gateway randomUUID one-shot queue with the persist and copy brokers, and the
  // responder mints before either runs, so stage it BEFORE any image or copy id.
  setupMintedQuestId: (params: { questId: QuestId }) => void;
  stagePastedImageIds: (params: { ids: readonly string[] }) => void;
  // Stages the real read-a-local-path-and-copy-it path the persist broker runs when the posted
  // message holds an absolute image path and carries no upload at all — a create whose only image
  // is a pasted screenshot path. Composes the source read and the copy broker's own minted
  // destination id behind one call, per the proxy-encapsulation rule. Call AFTER
  // setupPastedImageHome so the images folder is staged.
  stageLocalImageCopy: (params: {
    sourcePath: string;
    bytes: Uint8Array;
    copyId: string;
  }) => void;
  getWrittenPayloadsInOrder: () => unknown[];
  getRemovedFolderCallsInOrder: () => unknown[];
  // The `message` field of the most recent StartOrchestrator.startChat call, read directly off the
  // jest mock — lets a test assert the exact forwarded string with `toBe`.
  getLastStartChatMessage: () => unknown;
  // The `mintedQuestId` field of that same call — proves a path-only create's minted id actually
  // reaches the orchestrator call rather than merely existing locally in the responder.
  getLastStartChatMintedQuestId: () => unknown;
  callResponder: typeof QuestNewResponder;
} => {
  const orchestrator = StartOrchestratorProxy();
  // pastedImagePersistBroker is APPLICATION code — it runs REAL. This proxy only mocks the npm
  // boundary underneath it, composed exactly the way quest-chat-responder.proxy.ts does.
  const persistProxy = pastedImagePersistBrokerProxy();
  const uuidHandle = registerMock({ fn: randomUUID });
  stderrProxy();
  // The removal target is `locationsQuestFolderPathFindBroker`'s output, minted from a
  // guildId/questId this proxy never receives ahead of test setup, so rmProxy is addressed by the
  // one structural fact every such call shares: the path always falls under a guild's `quests`
  // directory, staged by setupPastedImageHome. No test here exercises a cleanup failure of its own — that path is covered by the
  // gateway rm's own test suite — so the removal always succeeds.
  const rmChild = rmProxy();
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
      orchestrator.startChatReturns({
        guildId,
        chatProcessId,
        ...(questId === undefined ? {} : { questId }),
      });
    },
    setupError: ({ guildId, message }: { guildId: GuildId; message: string }): void => {
      orchestrator.startChatThrows({ guildId, error: new Error(message) });
    },
    // The raw first-argument object of the most recent startChat call — the only way to prove
    // questType/questId reached the orchestrator, since `returns` addresses on guildId alone and
    // would match identically if either field were dropped. startChatGetCalls() has no address of
    // its own (mirrors playDispatchGetCalls), so the filter-by-guildId happens here.
    getLastStartChatArgs: ({ guildId }: { guildId: GuildId }): unknown => {
      const calls = orchestrator.startChatGetCalls() as StartChatParams[];
      return calls.filter((call) => call.guildId === guildId).at(-1);
    },
    setupPastedImageHome: ({ homePath }: { homePath: string }): void => {
      persistProxy.setupHome({ homePath });
      rmChild.succeedsMatchingPath({ path: removalPathPredicate });
    },
    setupMintedQuestId: ({ questId }: { questId: QuestId }): void => {
      uuidHandle.onceFor([]).returns(questId);
    },
    stagePastedImageIds: ({ ids }: { ids: readonly string[] }): void => {
      persistProxy.stageImageIds({ ids });
    },
    stageLocalImageCopy: ({
      sourcePath,
      bytes,
      copyId,
    }: {
      sourcePath: string;
      bytes: Uint8Array;
      copyId: string;
    }): void => {
      persistProxy.sourceReads({ filePath: sourcePath, bytes });
      persistProxy.stageCopyIds({ ids: [copyId] });
    },
    getWrittenPayloadsInOrder: (): unknown[] => persistProxy.writtenPayloadsInOrder(),
    // The full [path, options] pair for every rm call — proves not just THAT the minted folder was
    // removed but that it was removed recursively/forcefully, from the real address the responder
    // computed rather than a value the test hands back to itself.
    getRemovedFolderCallsInOrder: (): unknown[] =>
      rmChild.getCallsFor({ path: removalPathPredicate }).map((call) => call),
    // The SAME startChatGetCalls() read above, here with no address, so a test can pull one field
    // off the single call it made without re-describing guildId.
    getLastStartChatMessage: (): unknown => {
      const calls = orchestrator.startChatGetCalls() as StartChatParams[];
      return calls.at(-1)?.message;
    },
    getLastStartChatMintedQuestId: (): unknown => {
      const calls = orchestrator.startChatGetCalls() as StartChatParams[];
      return calls.at(-1)?.mintedQuestId;
    },
    callResponder: QuestNewResponder,
  };
};
