import { questFindQuestPathBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { StartEndpointMock } from '@dungeonmaster/testing';

// From the .stub file, not comment-batch-response-contract directly: @dungeonmaster/enforce-proxy-patterns
// bans a proxy importing a value from any path ending `-contract` (only `.stub` paths are exempt).
import { commentBatchDeliveredContract } from '../../../contracts/comment-batch-response/comment-batch-response.stub';
import { apiRoutesStatics } from '../../../statics/api-routes/api-routes-statics';
import { QuestCommentBatchResponder } from './quest-comment-batch-responder';

type Quest = ReturnType<typeof QuestStub>;
type ProcessId = string;
type GuildId = ReturnType<typeof GuildIdStub>;
type AbsoluteFilePath = string;
type EndpointControl = ReturnType<typeof StartEndpointMock.listen>;

export const QuestCommentBatchResponderProxy = (): {
  setupQuestLoad: (params: { quest: Quest }) => void;
  setupQuestLoadError: (params: { questId: Quest['id']; error: Error }) => void;
  setupFindQuestPath: (params: {
    questId: Quest['id'];
    guildId: GuildId;
    questPath: AbsoluteFilePath;
  }) => void;
  setupCommentBatch: (params: {
    questId: Quest['id'];
    chatProcessId: ProcessId;
    deliveredMessage: string;
  }) => void;
  setupCommentBatchError: (params: { questId: Quest['id']; message: string }) => void;
  getDeliveredBatch: (params: { questId: Quest['id'] }) => unknown;
  getDeliveryAttempts: (params: { questId: Quest['id'] }) => unknown[];
  callResponder: typeof QuestCommentBatchResponder;
  // Reusable MSW handler for this responder's own endpoint, checked against the same
  // commentBatchResponseContract the responder parses its 200 body through (T03). Staged data the
  // contract rejects throws at `.resolves()` time, not on the first fetch — the client-side mirror
  // of T6's "no re-staging another package's own behaviour by hand" for HTTP mocks.
  httpEndpoint: () => EndpointControl;
} => {
  const orchestrator = StartOrchestratorProxy();
  // questFindQuestPathBroker is a specific-broker forward, composed via ITS OWN proxy —
  // setupQuestPath runs the REAL broker through its own staged fs dependencies (readdir,
  // path.join, existsSync), the same way questListBrokerProxy's setupDirectList composes the real
  // questListBroker. That proxy also wires the bare `@dungeonmaster/orchestrator` barrel export
  // this responder calls through, so no separate passthrough is needed here.
  const findQuestPathProxy = questFindQuestPathBrokerProxy();

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
    }: {
      questId: Quest['id'];
      guildId: GuildId;
      questPath: AbsoluteFilePath;
    }): void => {
      findQuestPathProxy.setupQuestPath({ questId, guildId, questPath });
    },
    // `deliveredMessage` is the markdown the orchestrator handed the agent. The responder echoes it
    // in the 200 body, so a test names it here and asserts the same text comes back out.
    setupCommentBatch: ({
      questId,
      chatProcessId,
      deliveredMessage,
    }: {
      questId: Quest['id'];
      chatProcessId: ProcessId;
      deliveredMessage: string;
    }): void => {
      orchestrator.commentBatchReturns({ questId, chatProcessId, message: deliveredMessage });
    },
    setupCommentBatchError: ({ questId, message }: { questId: Quest['id']; message: string }): void => {
      orchestrator.commentBatchThrows({ questId, error: new Error(message) });
    },
    getDeliveredBatch: ({ questId }: { questId: Quest['id'] }): unknown =>
      [...orchestrator.commentBatchGetCalls({ questId })].at(-1)?.[0],
    // Empty array proves no chat process was spawned — the guarantee on the 409 and the
    // persist-failure paths.
    getDeliveryAttempts: ({ questId }: { questId: Quest['id'] }): unknown[] => [
      ...orchestrator.commentBatchGetCalls({ questId }),
    ],
    callResponder: QuestCommentBatchResponder,
    httpEndpoint: (): EndpointControl =>
      StartEndpointMock.listen({
        method: 'post',
        url: apiRoutesStatics.quests.comments,
        contract: commentBatchDeliveredContract,
      }),
  };
};
