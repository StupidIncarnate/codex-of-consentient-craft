import {
  AbsoluteFilePathStub,
  GuildIdStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { createPollHandlerLayerBroker } from './create-poll-handler-layer-broker';
import { createPollHandlerLayerBrokerProxy } from './create-poll-handler-layer-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

const QUEST_ID = QuestIdStub({ value: 'poll-handler-quest' });
const OTHER_QUEST_ID = QuestIdStub({ value: 'other-quest' });
const QUEST_PATH = AbsoluteFilePathStub({
  value:
    '/home/testuser/.dungeonmaster/guilds/11111111-1111-1111-1111-111111111111/quests/poll-handler-quest',
});
const GUILD_ID = GuildIdStub({ value: '11111111-1111-1111-1111-111111111111' });
const PROCESS_ID = ProcessIdStub({ value: 'process-1' });

describe('createPollHandlerLayerBroker', () => {
  describe('ignores unrelated quest events', () => {
    it('VALID: {event questId !== watched questId} => handler does not trigger load or callbacks', async () => {
      createPollHandlerLayerBrokerProxy();
      const abortController = new AbortController();
      const terminalCalls: Quest[] = [];
      const errorCalls: Error[] = [];
      const handler = createPollHandlerLayerBroker({
        questId: QUEST_ID,
        abortSignal: abortController.signal,
        onTerminal: (quest) => terminalCalls.push(quest),
        onError: (error) => errorCalls.push(error),
      });

      handler({ processId: PROCESS_ID, payload: { questId: OTHER_QUEST_ID } });
      await Promise.resolve();
      await Promise.resolve();

      expect({
        terminalCount: terminalCalls.length,
        errorCount: errorCalls.length,
      }).toStrictEqual({
        terminalCount: 0,
        errorCount: 0,
      });
    });
  });

  describe('terminal status triggers onTerminal', () => {
    it('VALID: {event matches, quest loaded complete} => calls onTerminal with the quest', async () => {
      const proxy = createPollHandlerLayerBrokerProxy();
      const quest = QuestStub({ id: QUEST_ID, status: 'complete' });
      proxy.setupLoaded({ questPath: QUEST_PATH, guildId: GUILD_ID, quest });

      const abortController = new AbortController();
      const terminalCalls: Quest[] = [];
      const errorCalls: Error[] = [];
      const handler = createPollHandlerLayerBroker({
        questId: QUEST_ID,
        abortSignal: abortController.signal,
        onTerminal: (q) => terminalCalls.push(q),
        onError: (error) => errorCalls.push(error),
      });

      handler({ processId: PROCESS_ID, payload: { questId: QUEST_ID } });
      // Flush all pending microtasks: find-quest-path scans multiple readFile
      // candidates + questLoadBroker reads once more, so we need enough ticks
      // for every async boundary to resolve.
      await new Promise((r) => {
        setImmediate(r);
      });
      await new Promise((r) => {
        setImmediate(r);
      });

      expect({ terminalCalls, errorCount: errorCalls.length }).toStrictEqual({
        terminalCalls: [quest],
        errorCount: 0,
      });
    });
  });

  describe('non-terminal status does not settle', () => {
    it('VALID: {event matches, quest still in_progress} => neither callback fires', async () => {
      const proxy = createPollHandlerLayerBrokerProxy();
      const quest = QuestStub({ id: QUEST_ID, status: 'in_progress' });
      proxy.setupLoaded({ questPath: QUEST_PATH, guildId: GUILD_ID, quest });

      const abortController = new AbortController();
      const terminalCalls: Quest[] = [];
      const errorCalls: Error[] = [];
      const handler = createPollHandlerLayerBroker({
        questId: QUEST_ID,
        abortSignal: abortController.signal,
        onTerminal: (q) => terminalCalls.push(q),
        onError: (error) => errorCalls.push(error),
      });

      handler({ processId: PROCESS_ID, payload: { questId: QUEST_ID } });
      await Promise.resolve();
      await Promise.resolve();

      expect({
        terminalCount: terminalCalls.length,
        errorCount: errorCalls.length,
      }).toStrictEqual({
        terminalCount: 0,
        errorCount: 0,
      });
    });
  });

  describe('load failure triggers onError', () => {
    it('ERROR: {load throws} => calls onError with the error', async () => {
      const proxy = createPollHandlerLayerBrokerProxy();
      const quest = QuestStub({ id: QUEST_ID });
      proxy.setupLoadThrows({
        questPath: QUEST_PATH,
        guildId: GUILD_ID,
        quest,
        error: new Error('ENOENT: quest.json missing'),
      });

      const abortController = new AbortController();
      const terminalCalls: Quest[] = [];
      const errorCalls: Error[] = [];
      const handler = createPollHandlerLayerBroker({
        questId: QUEST_ID,
        abortSignal: abortController.signal,
        onTerminal: (q) => terminalCalls.push(q),
        onError: (error) => errorCalls.push(error),
      });

      handler({ processId: PROCESS_ID, payload: { questId: QUEST_ID } });
      await new Promise((r) => {
        setImmediate(r);
      });
      await new Promise((r) => {
        setImmediate(r);
      });

      // fsReadFileAdapter wraps the underlying error; the create-poll-handler
      // layer surfaces that wrapped error to onError unchanged.
      expect({
        terminalCount: terminalCalls.length,
        errorMessageCount: errorCalls.length,
        firstErrorMatchesReadFileWrapper: errorCalls[0]?.message.startsWith('Failed to read file'),
      }).toStrictEqual({
        terminalCount: 0,
        errorMessageCount: 1,
        firstErrorMatchesReadFileWrapper: true,
      });
    });
  });

  describe('abortSignal suppresses callbacks', () => {
    it('VALID: {abortSignal aborted before handler runs} => no load, no callbacks', async () => {
      createPollHandlerLayerBrokerProxy();
      const abortController = new AbortController();
      abortController.abort();

      const terminalCalls: Quest[] = [];
      const errorCalls: Error[] = [];
      const handler = createPollHandlerLayerBroker({
        questId: QUEST_ID,
        abortSignal: abortController.signal,
        onTerminal: (q) => terminalCalls.push(q),
        onError: (error) => errorCalls.push(error),
      });

      handler({ processId: PROCESS_ID, payload: { questId: QUEST_ID } });
      await Promise.resolve();
      await Promise.resolve();

      expect({
        terminalCount: terminalCalls.length,
        errorCount: errorCalls.length,
      }).toStrictEqual({
        terminalCount: 0,
        errorCount: 0,
      });
    });
  });
});
