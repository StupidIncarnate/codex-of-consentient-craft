import { QuestQueueEntryStub, QuestSourceStub } from '@dungeonmaster/shared/contracts';

import { questExecutionQueueState } from './quest-execution-queue-state';
import { questExecutionQueueStateProxy } from './quest-execution-queue-state.proxy';

const ISO_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;

describe('questExecutionQueueState', () => {
  describe('enqueue / getActive / getAll', () => {
    it('VALID: {enqueue 3 entries} => getActive returns head, getAll returns FIFO order', () => {
      const proxy = questExecutionQueueStateProxy();
      proxy.setupEmpty();
      const a = QuestQueueEntryStub({ questId: 'q-a' as never });
      const b = QuestQueueEntryStub({ questId: 'q-b' as never });
      const c = QuestQueueEntryStub({ questId: 'q-c' as never });

      questExecutionQueueState.enqueue({ entry: a });
      questExecutionQueueState.enqueue({ entry: b });
      questExecutionQueueState.enqueue({ entry: c });

      expect(questExecutionQueueState.getActive()).toStrictEqual(a);
      expect(questExecutionQueueState.getAll()).toStrictEqual([a, b, c]);
    });

    it('EMPTY: {no entries} => getActive returns undefined, getAll returns empty array', () => {
      const proxy = questExecutionQueueStateProxy();
      proxy.setupEmpty();

      expect(questExecutionQueueState.getActive()).toBe(undefined);
      expect(questExecutionQueueState.getAll()).toStrictEqual([]);
    });
  });

  describe('dequeueHead', () => {
    it('VALID: {two entries} => dequeueHead returns first, remaining is second', () => {
      const proxy = questExecutionQueueStateProxy();
      proxy.setupEmpty();
      const a = QuestQueueEntryStub({ questId: 'q-a' as never });
      const b = QuestQueueEntryStub({ questId: 'q-b' as never });

      questExecutionQueueState.enqueue({ entry: a });
      questExecutionQueueState.enqueue({ entry: b });

      const dequeued = questExecutionQueueState.dequeueHead();

      expect(dequeued).toStrictEqual(a);
      expect(questExecutionQueueState.getActive()).toStrictEqual(b);
      expect(questExecutionQueueState.getAll()).toStrictEqual([b]);
    });

    it('EMPTY: {no entries} => dequeueHead returns undefined', () => {
      const proxy = questExecutionQueueStateProxy();
      proxy.setupEmpty();

      expect(questExecutionQueueState.dequeueHead()).toBe(undefined);
    });
  });

  describe('clearBySource', () => {
    it('VALID: {three entries, two match source} => removes only matches and returns count', () => {
      const proxy = questExecutionQueueStateProxy();
      proxy.setupEmpty();
      const smoketestSource = QuestSourceStub({ value: 'smoketest-orchestration' });
      const userSource = QuestSourceStub({ value: 'user' });
      const a = QuestQueueEntryStub({ questId: 'q-a' as never, questSource: smoketestSource });
      const b = QuestQueueEntryStub({ questId: 'q-b' as never, questSource: userSource });
      const c = QuestQueueEntryStub({ questId: 'q-c' as never, questSource: smoketestSource });

      questExecutionQueueState.enqueue({ entry: a });
      questExecutionQueueState.enqueue({ entry: b });
      questExecutionQueueState.enqueue({ entry: c });

      const removed = questExecutionQueueState.clearBySource({ questSource: smoketestSource });

      expect(removed).toBe(2);
      expect(questExecutionQueueState.getAll()).toStrictEqual([b]);
    });

    it('EMPTY: {no matching entries} => removes 0 and leaves queue unchanged', () => {
      const proxy = questExecutionQueueStateProxy();
      proxy.setupEmpty();
      const userSource = QuestSourceStub({ value: 'user' });
      const a = QuestQueueEntryStub({ questId: 'q-a' as never, questSource: userSource });

      questExecutionQueueState.enqueue({ entry: a });

      const removed = questExecutionQueueState.clearBySource({
        questSource: QuestSourceStub({ value: 'smoketest-mcp' }),
      });

      expect(removed).toBe(0);
      expect(questExecutionQueueState.getAll()).toStrictEqual([a]);
    });
  });

  describe('onChange / offChange', () => {
    it('VALID: {handler registered} => fires on enqueue', () => {
      const proxy = questExecutionQueueStateProxy();
      proxy.setupEmpty();
      const handler = jest.fn();

      questExecutionQueueState.onChange(handler);
      questExecutionQueueState.enqueue({ entry: QuestQueueEntryStub() });

      expect(handler.mock.calls).toStrictEqual([[]]);
    });

    it('VALID: {handler registered} => fires on dequeueHead when head exists', () => {
      const proxy = questExecutionQueueStateProxy();
      proxy.setupEmpty();
      questExecutionQueueState.enqueue({ entry: QuestQueueEntryStub() });
      const handler = jest.fn();

      questExecutionQueueState.onChange(handler);
      questExecutionQueueState.dequeueHead();

      expect(handler.mock.calls).toStrictEqual([[]]);
    });

    it('VALID: {handler registered} => fires on clearBySource when entries removed', () => {
      const proxy = questExecutionQueueStateProxy();
      proxy.setupEmpty();
      const source = QuestSourceStub({ value: 'smoketest-signals' });
      questExecutionQueueState.enqueue({ entry: QuestQueueEntryStub({ questSource: source }) });
      const handler = jest.fn();

      questExecutionQueueState.onChange(handler);
      questExecutionQueueState.clearBySource({ questSource: source });

      expect(handler.mock.calls).toStrictEqual([[]]);
    });

    it('VALID: {handler registered} => fires on setHeadError and mutates head error field', () => {
      const proxy = questExecutionQueueStateProxy();
      proxy.setupEmpty();
      questExecutionQueueState.enqueue({ entry: QuestQueueEntryStub() });
      const handler = jest.fn();

      questExecutionQueueState.onChange(handler);
      questExecutionQueueState.setHeadError({ message: 'boom' });

      expect(handler.mock.calls).toStrictEqual([[]]);

      const head = questExecutionQueueState.getActive();

      expect(head?.error?.message).toBe('boom');
      expect(head?.error?.at).toMatch(ISO_REGEX);
    });

    it('VALID: {handler registered} => fires on markHeadStarted and sets startedAt', () => {
      const proxy = questExecutionQueueStateProxy();
      proxy.setupEmpty();
      questExecutionQueueState.enqueue({ entry: QuestQueueEntryStub() });
      const handler = jest.fn();

      questExecutionQueueState.onChange(handler);
      questExecutionQueueState.markHeadStarted();

      expect(handler.mock.calls).toStrictEqual([[]]);

      const head = questExecutionQueueState.getActive();

      expect(head?.startedAt).toMatch(ISO_REGEX);
    });

    it('VALID: {markHeadStarted twice} => second call is no-op (startedAt unchanged)', () => {
      const proxy = questExecutionQueueStateProxy();
      proxy.setupEmpty();
      questExecutionQueueState.enqueue({ entry: QuestQueueEntryStub() });
      questExecutionQueueState.markHeadStarted();
      const first = questExecutionQueueState.getActive()?.startedAt;
      const handler = jest.fn();

      questExecutionQueueState.onChange(handler);
      questExecutionQueueState.markHeadStarted();

      expect(handler.mock.calls).toStrictEqual([]);
      expect(questExecutionQueueState.getActive()?.startedAt).toBe(first);
    });

    it('VALID: {offChange} => removes handler; subsequent mutations do not fire it', () => {
      const proxy = questExecutionQueueStateProxy();
      proxy.setupEmpty();
      const handler = jest.fn();

      questExecutionQueueState.onChange(handler);
      questExecutionQueueState.offChange(handler);
      questExecutionQueueState.enqueue({ entry: QuestQueueEntryStub() });

      expect(handler.mock.calls).toStrictEqual([]);
    });

    it('EDGE: {setHeadError with empty queue} => no-op, handler does not fire', () => {
      const proxy = questExecutionQueueStateProxy();
      proxy.setupEmpty();
      const handler = jest.fn();

      questExecutionQueueState.onChange(handler);
      questExecutionQueueState.setHeadError({ message: 'nope' });

      expect(handler.mock.calls).toStrictEqual([]);
      expect(questExecutionQueueState.getActive()).toBe(undefined);
    });
  });
});
