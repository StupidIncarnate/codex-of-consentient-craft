import { FilePathStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { QuestOutboxLineStub } from '../../../contracts/quest-outbox-line/quest-outbox-line.stub';

import { questOutboxWatchBroker } from './quest-outbox-watch-broker';
import { questOutboxWatchBrokerProxy } from './quest-outbox-watch-broker.proxy';

describe('questOutboxWatchBroker', () => {
  describe('valid quest change events', () => {
    it('VALID: {valid outbox line} => calls onQuestChanged with questId', async () => {
      const proxy = questOutboxWatchBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const outboxLine = QuestOutboxLineStub({ questId });

      proxy.setupOutboxPath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        outboxPath: FilePathStub({ value: '/home/user/.dungeonmaster/event-outbox.jsonl' }),
      });

      proxy.setupLines({ lines: [JSON.stringify(outboxLine)] });

      const onQuestChanged = jest.fn();
      const onError = jest.fn();

      const { stop } = await questOutboxWatchBroker({ onQuestChanged, onError });

      proxy.triggerChange();

      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      stop();

      expect(onQuestChanged).toHaveBeenCalledWith({ questId: 'add-auth' });
      expect(onError).not.toHaveBeenCalled();
    });

    it('VALID: {different questId} => calls onQuestChanged with different questId', async () => {
      const proxy = questOutboxWatchBrokerProxy();
      const questId = QuestIdStub({ value: 'remove-feature' });
      const outboxLine = QuestOutboxLineStub({ questId });

      proxy.setupOutboxPath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        outboxPath: FilePathStub({ value: '/home/user/.dungeonmaster/event-outbox.jsonl' }),
      });

      proxy.setupLines({ lines: [JSON.stringify(outboxLine)] });

      const onQuestChanged = jest.fn();
      const onError = jest.fn();

      const { stop } = await questOutboxWatchBroker({ onQuestChanged, onError });

      proxy.triggerChange();

      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      stop();

      expect(onQuestChanged).toHaveBeenCalledWith({ questId: 'remove-feature' });
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('invalid lines', () => {
    it('ERROR: {invalid JSON} => calls onError with parse error', async () => {
      const proxy = questOutboxWatchBrokerProxy();

      proxy.setupOutboxPath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        outboxPath: FilePathStub({ value: '/home/user/.dungeonmaster/event-outbox.jsonl' }),
      });

      proxy.setupLines({ lines: ['not-valid-json'] });

      const onQuestChanged = jest.fn();
      const onError = jest.fn();

      const { stop } = await questOutboxWatchBroker({ onQuestChanged, onError });

      proxy.triggerChange();

      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      stop();

      expect(onQuestChanged).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('ERROR: {valid JSON but invalid schema} => calls onError with validation error', async () => {
      const proxy = questOutboxWatchBrokerProxy();

      proxy.setupOutboxPath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        outboxPath: FilePathStub({ value: '/home/user/.dungeonmaster/event-outbox.jsonl' }),
      });

      proxy.setupLines({ lines: [JSON.stringify({ wrong: 'shape' })] });

      const onQuestChanged = jest.fn();
      const onError = jest.fn();

      const { stop } = await questOutboxWatchBroker({ onQuestChanged, onError });

      proxy.triggerChange();

      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      stop();

      expect(onQuestChanged).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });

  describe('watcher error', () => {
    it('ERROR: {watcher emits error} => calls onError with watcher error', async () => {
      const proxy = questOutboxWatchBrokerProxy();

      proxy.setupOutboxPath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        outboxPath: FilePathStub({ value: '/home/user/.dungeonmaster/event-outbox.jsonl' }),
      });

      const onQuestChanged = jest.fn();
      const onError = jest.fn();

      const { stop } = await questOutboxWatchBroker({ onQuestChanged, onError });

      proxy.triggerWatchError({ error: new Error('watcher failed') });

      stop();

      expect(onQuestChanged).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith({ error: new Error('watcher failed') });
    });
  });

  describe('stop handle', () => {
    it('VALID: {stop called} => returns stop function', async () => {
      const proxy = questOutboxWatchBrokerProxy();

      proxy.setupOutboxPath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        outboxPath: FilePathStub({ value: '/home/user/.dungeonmaster/event-outbox.jsonl' }),
      });

      const onQuestChanged = jest.fn();
      const onError = jest.fn();

      const { stop } = await questOutboxWatchBroker({ onQuestChanged, onError });

      stop();

      expect(typeof stop).toBe('function');
    });
  });
});
