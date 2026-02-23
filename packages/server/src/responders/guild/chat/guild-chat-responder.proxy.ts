import { orchestratorGetGuildAdapterProxy } from '../../../adapters/orchestrator/get-guild/orchestrator-get-guild-adapter.proxy';
import { cryptoRandomUuidAdapterProxy } from '../../../adapters/crypto/random-uuid/crypto-random-uuid-adapter.proxy';
import { chaoswhispererPromptAdapterProxy } from '../../../adapters/chaoswhisperer/prompt/chaoswhisperer-prompt-adapter.proxy';
import { chatSpawnBrokerProxy } from '../../../brokers/chat/spawn/chat-spawn-broker.proxy';
import { wsEventRelayBroadcastBrokerProxy } from '../../../brokers/ws-event-relay/broadcast/ws-event-relay-broadcast-broker.proxy';
import { chatProcessStateProxy } from '../../../state/chat-process/chat-process-state.proxy';
import { GuildChatResponder } from './guild-chat-responder';
import type { GuildStub, ProcessIdStub } from '@dungeonmaster/shared/contracts';

type Guild = ReturnType<typeof GuildStub>;
type ProcessId = ReturnType<typeof ProcessIdStub>;

export const GuildChatResponderProxy = (): {
  setupGuildChat: (params: { guild: Guild; chatProcessId: ProcessId }) => {
    emitLine: (params: { line: string }) => void;
    emitExit: (params: { code: number }) => void;
  };
  setupGuildError: (params: { message: string }) => void;
  callResponder: typeof GuildChatResponder;
} => {
  const guildProxy = orchestratorGetGuildAdapterProxy();
  const uuidProxy = cryptoRandomUuidAdapterProxy();
  const promptProxy = chaoswhispererPromptAdapterProxy();
  const spawnProxy = chatSpawnBrokerProxy();
  wsEventRelayBroadcastBrokerProxy();
  chatProcessStateProxy();

  return {
    setupGuildChat: ({
      guild,
      chatProcessId,
    }: {
      guild: Guild;
      chatProcessId: ProcessId;
    }): {
      emitLine: (params: { line: string }) => void;
      emitExit: (params: { code: number }) => void;
    } => {
      guildProxy.returns({ guild });
      uuidProxy.returns({ uuid: chatProcessId });
      promptProxy.setup();
      return spawnProxy.setupSpawn();
    },
    setupGuildError: ({ message }: { message: string }): void => {
      guildProxy.throws({ error: new Error(message) });
    },
    callResponder: GuildChatResponder,
  };
};
