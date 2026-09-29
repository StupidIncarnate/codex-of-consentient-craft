import { FilePathStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { QuestOutboxLineStub } from '../../../contracts/quest-outbox-line/quest-outbox-line.stub';

import { questOutboxWatchBroker } from './quest-outbox-watch-broker';
import { questOutboxWatchBrokerProxy } from './quest-outbox-watch-broker.proxy';
import { setImmediate } from '#gateway/node/setImmediate';

const OUTBOX_PATH = FilePathStub({ value: '/home/user/.dungeonmaster/event-outbox.jsonl' });

const flushImmediate = async (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

describe('questOutboxWatchBroker', () => {
  describe('valid quest change events', () => {
    it('VALID: {valid outbox line} => calls onQuestChanged with questId', async () => {
      const proxy = questOutboxWatchBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const outboxLine = QuestOutboxLineStub({ questId });

      proxy.setupOutboxPath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        outboxPath: OUTBOX_PATH,
      });

      proxy.setupLines({ path: OUTBOX_PATH, lines: [JSON.stringify(outboxLine)] });

      const onQuestChanged = jest.fn();
      const onError = jest.fn();

      const { stop } = await questOutboxWatchBroker({ onQuestChanged, onError });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      stop();

      expect(onQuestChanged).toHaveBeenCalledWith({ questId: 'add-auth' });
      expect(onError.mock.calls).toStrictEqual([]);
    });

    it('VALID: {different questId} => calls onQuestChanged with different questId', async () => {
      const proxy = questOutboxWatchBrokerProxy();
      const questId = QuestIdStub({ value: 'remove-feature' });
      const outboxLine = QuestOutboxLineStub({ questId });

      proxy.setupOutboxPath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        outboxPath: OUTBOX_PATH,
      });

      proxy.setupLines({ path: OUTBOX_PATH, lines: [JSON.stringify(outboxLine)] });

      const onQuestChanged = jest.fn();
      const onError = jest.fn();

      const { stop } = await questOutboxWatchBroker({ onQuestChanged, onError });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      stop();

      expect(onQuestChanged).toHaveBeenCalledWith({ questId: 'remove-feature' });
      expect(onError.mock.calls).toStrictEqual([]);
    });
  });

  describe('what starting a watcher does to the bus', () => {
    it('VALID: {default} => creates the outbox if absent and truncates nothing', async () => {
      const proxy = questOutboxWatchBrokerProxy();

      proxy.setupOutboxPath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        outboxPath: OUTBOX_PATH,
      });

      const { stop } = await questOutboxWatchBroker({
        onQuestChanged: jest.fn(),
        onError: jest.fn(),
      });

      await flushImmediate();
      stop();

      expect(proxy.getCreatedPaths()).toStrictEqual([
        '/home/user/.dungeonmaster/event-outbox.jsonl',
      ]);
      expect(proxy.getTruncatedPaths()).toStrictEqual([]);
    });

    it('VALID: {resetOnStart: true} => truncates the outbox exactly once', async () => {
      const proxy = questOutboxWatchBrokerProxy();

      proxy.setupOutboxPath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        outboxPath: OUTBOX_PATH,
      });

      const { stop } = await questOutboxWatchBroker({
        onQuestChanged: jest.fn(),
        onError: jest.fn(),
        resetOnStart: true,
      });

      await flushImmediate();
      stop();

      expect(proxy.getTruncatedPaths()).toStrictEqual([
        '/home/user/.dungeonmaster/event-outbox.jsonl',
      ]);
      expect(proxy.getCreatedPaths()).toStrictEqual([]);
    });
  });

  describe('invalid lines', () => {
    it('ERROR: {invalid JSON} => calls onError with parse error', async () => {
      const proxy = questOutboxWatchBrokerProxy();

      proxy.setupOutboxPath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        outboxPath: OUTBOX_PATH,
      });

      proxy.setupLines({ path: OUTBOX_PATH, lines: ['not-valid-json'] });

      const onQuestChanged = jest.fn();
      const onError = jest.fn();

      const { stop } = await questOutboxWatchBroker({ onQuestChanged, onError });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      stop();

      expect(onQuestChanged.mock.calls).toStrictEqual([]);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('ERROR: {valid JSON but invalid schema} => calls onError with validation error', async () => {
      const proxy = questOutboxWatchBrokerProxy();

      proxy.setupOutboxPath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        outboxPath: OUTBOX_PATH,
      });

      proxy.setupLines({ path: OUTBOX_PATH, lines: [JSON.stringify({ wrong: 'shape' })] });

      const onQuestChanged = jest.fn();
      const onError = jest.fn();

      const { stop } = await questOutboxWatchBroker({ onQuestChanged, onError });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      stop();

      expect(onQuestChanged.mock.calls).toStrictEqual([]);
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });

  describe('watcher error', () => {
    it('ERROR: {watcher emits error} => calls onError with watcher error', async () => {
      const proxy = questOutboxWatchBrokerProxy();

      proxy.setupOutboxPath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        outboxPath: OUTBOX_PATH,
      });

      const onQuestChanged = jest.fn();
      const onError = jest.fn();

      const { stop } = await questOutboxWatchBroker({ onQuestChanged, onError });

      await flushImmediate();
      proxy.triggerWatchError({ path: OUTBOX_PATH, error: new Error('watcher failed') });

      stop();

      expect(onQuestChanged.mock.calls).toStrictEqual([]);
      expect(onError).toHaveBeenCalledWith({ error: new Error('watcher failed') });
    });
  });

  describe('stop handle', () => {
    it('VALID: {stop called} => returns stop function', async () => {
      const proxy = questOutboxWatchBrokerProxy();

      proxy.setupOutboxPath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        outboxPath: OUTBOX_PATH,
      });

      const onQuestChanged = jest.fn();
      const onError = jest.fn();

      const { stop } = await questOutboxWatchBroker({ onQuestChanged, onError });

      await flushImmediate();
      stop();

      expect(stop).toStrictEqual(expect.any(Function));
    });
  });
});
