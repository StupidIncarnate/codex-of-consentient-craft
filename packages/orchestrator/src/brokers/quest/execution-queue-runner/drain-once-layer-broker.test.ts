import { QuestIdStub, QuestQueueEntryStub, QuestStatusStub } from '@dungeonmaster/shared/contracts';

import { drainOnceLayerBroker } from './drain-once-layer-broker';
import { drainOnceLayerBrokerProxy } from './drain-once-layer-broker.proxy';

type QueueEntry = ReturnType<typeof QuestQueueEntryStub>;
type QuestStatus = ReturnType<typeof QuestStatusStub>;
type QuestId = ReturnType<typeof QuestIdStub>;

describe('drainOnceLayerBroker', () => {
  it('EMPTY: {no head} => does not run loop, does not emit', async () => {
    drainOnceLayerBrokerProxy();
    const queue: QueueEntry[] = [];
    const runOrchestrationLoop = jest.fn().mockResolvedValue(undefined);
    const emitQueueUpdated = jest.fn();

    await drainOnceLayerBroker({
      getHead: (): QueueEntry | undefined => queue[0],
      dequeueHead: (): QueueEntry | undefined => queue.shift(),
      markHeadStarted: jest.fn(),
      setHeadError: jest.fn(),
      removeByQuestId: jest.fn(),
      isWebPresent: (): boolean => true,
      runOrchestrationLoop,
      getQuestStatus: jest.fn().mockResolvedValue(undefined),
      emitQueueUpdated,
      emitQueueError: jest.fn(),
    });

    expect(runOrchestrationLoop.mock.calls).toStrictEqual([]);
    expect(emitQueueUpdated.mock.calls).toStrictEqual([]);
  });

  it('VALID: {head is in_progress, loop succeeds, stays in_progress} => runs loop, does not dequeue', async () => {
    drainOnceLayerBrokerProxy();
    const head = QuestQueueEntryStub({ questId: QuestIdStub({ value: 'q-1' }) });
    const queue: QueueEntry[] = [head];
    const runOrchestrationLoop = jest.fn().mockResolvedValue(undefined);
    const dequeueHead = jest.fn().mockImplementation((): QueueEntry | undefined => queue.shift());
    const markHeadStarted = jest.fn();

    await drainOnceLayerBroker({
      getHead: (): QueueEntry | undefined => queue[0],
      dequeueHead,
      markHeadStarted,
      setHeadError: jest.fn(),
      removeByQuestId: jest.fn(),
      isWebPresent: (): boolean => true,
      runOrchestrationLoop,
      getQuestStatus: jest.fn().mockResolvedValue(QuestStatusStub({ value: 'in_progress' })),
      emitQueueUpdated: jest.fn(),
      emitQueueError: jest.fn(),
    });

    expect(runOrchestrationLoop.mock.calls).toStrictEqual([
      [{ questId: head.questId, guildId: head.guildId }],
    ]);
    expect(dequeueHead.mock.calls).toStrictEqual([]);
    expect(markHeadStarted.mock.calls).toStrictEqual([[]]);
  });

  it('VALID: {head is in_progress, loop succeeds, becomes complete} => runs loop, dequeues head', async () => {
    drainOnceLayerBrokerProxy();
    const head = QuestQueueEntryStub({ questId: QuestIdStub({ value: 'q-1' }) });
    const queue: QueueEntry[] = [head];
    const runOrchestrationLoop = jest.fn().mockResolvedValue(undefined);
    const dequeueHead = jest.fn().mockImplementation((): QueueEntry | undefined => queue.shift());
    const getQuestStatus = jest
      .fn()
      .mockResolvedValueOnce(QuestStatusStub({ value: 'in_progress' }))
      .mockResolvedValueOnce(QuestStatusStub({ value: 'complete' }));

    await drainOnceLayerBroker({
      getHead: (): QueueEntry | undefined => queue[0],
      dequeueHead,
      markHeadStarted: jest.fn(),
      setHeadError: jest.fn(),
      removeByQuestId: jest.fn(),
      isWebPresent: (): boolean => true,
      runOrchestrationLoop,
      getQuestStatus,
      emitQueueUpdated: jest.fn(),
      emitQueueError: jest.fn(),
    });

    expect(runOrchestrationLoop.mock.calls).toStrictEqual([
      [{ questId: head.questId, guildId: head.guildId }],
    ]);
    expect(dequeueHead.mock.calls).toStrictEqual([[]]);
  });

  it('VALID: {head is complete (terminal) at start} => dequeues without running loop, recurses', async () => {
    drainOnceLayerBrokerProxy();
    const a = QuestQueueEntryStub({
      questId: QuestIdStub({ value: 'q-a' }),
      status: 'complete' as never,
    });
    const b = QuestQueueEntryStub({ questId: QuestIdStub({ value: 'q-b' }) });
    const queue: QueueEntry[] = [a, b];
    const runOrchestrationLoop = jest.fn().mockResolvedValue(undefined);
    const dequeueHead = jest.fn().mockImplementation((): QueueEntry | undefined => queue.shift());
    const statusByQuestId = new Map<QuestId, QuestStatus>([
      [a.questId, QuestStatusStub({ value: 'complete' })],
      [b.questId, QuestStatusStub({ value: 'in_progress' })],
    ]);
    const getQuestStatus = jest
      .fn()
      .mockImplementation(
        async ({ questId }: { questId: QuestId }): Promise<QuestStatus | undefined> =>
          Promise.resolve(statusByQuestId.get(questId)),
      );

    await drainOnceLayerBroker({
      getHead: (): QueueEntry | undefined => queue[0],
      dequeueHead,
      markHeadStarted: jest.fn(),
      setHeadError: jest.fn(),
      removeByQuestId: jest.fn(),
      isWebPresent: (): boolean => true,
      runOrchestrationLoop,
      getQuestStatus,
      emitQueueUpdated: jest.fn(),
      emitQueueError: jest.fn(),
    });

    expect(dequeueHead.mock.calls).toStrictEqual([[]]);
    expect(runOrchestrationLoop.mock.calls).toStrictEqual([
      [{ questId: b.questId, guildId: b.guildId }],
    ]);
  });

  it('VALID: {head is paused} => does not run loop, does not dequeue', async () => {
    drainOnceLayerBrokerProxy();
    const head = QuestQueueEntryStub({
      questId: QuestIdStub({ value: 'q-paused' }),
      status: 'paused' as never,
    });
    const queue: QueueEntry[] = [head];
    const runOrchestrationLoop = jest.fn().mockResolvedValue(undefined);
    const dequeueHead = jest.fn().mockImplementation((): QueueEntry | undefined => queue.shift());

    await drainOnceLayerBroker({
      getHead: (): QueueEntry | undefined => queue[0],
      dequeueHead,
      markHeadStarted: jest.fn(),
      setHeadError: jest.fn(),
      removeByQuestId: jest.fn(),
      isWebPresent: (): boolean => true,
      runOrchestrationLoop,
      getQuestStatus: jest.fn().mockResolvedValue(QuestStatusStub({ value: 'paused' })),
      emitQueueUpdated: jest.fn(),
      emitQueueError: jest.fn(),
    });

    expect(runOrchestrationLoop.mock.calls).toStrictEqual([]);
    expect(dequeueHead.mock.calls).toStrictEqual([]);
  });

  it('VALID: {loop throws generic error} => sets head error, emits error event, does NOT dequeue, does NOT remove', async () => {
    drainOnceLayerBrokerProxy();
    const head = QuestQueueEntryStub({ questId: QuestIdStub({ value: 'q-boom' }) });
    const queue: QueueEntry[] = [head];
    const runOrchestrationLoop = jest.fn().mockRejectedValue(new Error('simulated failure'));
    const setHeadError = jest.fn();
    const emitQueueError = jest.fn();
    const removeByQuestId = jest.fn();
    const dequeueHead = jest.fn().mockImplementation((): QueueEntry | undefined => queue.shift());

    await drainOnceLayerBroker({
      getHead: (): QueueEntry | undefined => queue[0],
      dequeueHead,
      markHeadStarted: jest.fn(),
      setHeadError,
      removeByQuestId,
      isWebPresent: (): boolean => true,
      runOrchestrationLoop,
      getQuestStatus: jest.fn().mockResolvedValue(QuestStatusStub({ value: 'in_progress' })),
      emitQueueUpdated: jest.fn(),
      emitQueueError,
    });

    expect(setHeadError.mock.calls).toStrictEqual([[{ message: 'simulated failure' }]]);
    expect(emitQueueError.mock.calls).toStrictEqual([[{ message: 'simulated failure' }]]);
    expect(dequeueHead.mock.calls).toStrictEqual([]);
    expect(removeByQuestId.mock.calls).toStrictEqual([]);
  });

  it('VALID: {loop throws quest-not-found error} => removes head by questId, does NOT setHeadError, recurses to next head', async () => {
    drainOnceLayerBrokerProxy();
    const a = QuestQueueEntryStub({ questId: QuestIdStub({ value: 'q-gone' }) });
    const b = QuestQueueEntryStub({ questId: QuestIdStub({ value: 'q-next' }) });
    const queue: QueueEntry[] = [a, b];
    const runOrchestrationLoop = jest
      .fn()
      .mockRejectedValueOnce(new Error(`Quest ${String(a.questId)} not found in any guild`))
      .mockResolvedValueOnce(undefined);
    const setHeadError = jest.fn();
    const emitQueueError = jest.fn();
    const removeByQuestId = jest.fn().mockImplementation((): void => {
      queue.shift();
    });
    const dequeueHead = jest.fn().mockImplementation((): QueueEntry | undefined => queue.shift());
    const statusByQuestId = new Map<QuestId, QuestStatus>([
      [a.questId, QuestStatusStub({ value: 'in_progress' })],
      [b.questId, QuestStatusStub({ value: 'in_progress' })],
    ]);
    const getQuestStatus = jest
      .fn()
      .mockImplementation(
        async ({ questId }: { questId: QuestId }): Promise<QuestStatus | undefined> =>
          Promise.resolve(statusByQuestId.get(questId)),
      );

    await drainOnceLayerBroker({
      getHead: (): QueueEntry | undefined => queue[0],
      dequeueHead,
      markHeadStarted: jest.fn(),
      setHeadError,
      removeByQuestId,
      isWebPresent: (): boolean => true,
      runOrchestrationLoop,
      getQuestStatus,
      emitQueueUpdated: jest.fn(),
      emitQueueError,
    });

    expect(removeByQuestId.mock.calls).toStrictEqual([[{ questId: a.questId }]]);
    expect(setHeadError.mock.calls).toStrictEqual([]);
    expect(emitQueueError.mock.calls).toStrictEqual([]);
    expect(runOrchestrationLoop.mock.calls).toStrictEqual([
      [{ questId: a.questId, guildId: a.guildId }],
      [{ questId: b.questId, guildId: b.guildId }],
    ]);
  });

  it('VALID: {web not present} => does not run loop, does not dequeue', async () => {
    drainOnceLayerBrokerProxy();
    const head = QuestQueueEntryStub({ questId: QuestIdStub({ value: 'q-1' }) });
    const queue: QueueEntry[] = [head];
    const runOrchestrationLoop = jest.fn().mockResolvedValue(undefined);
    const dequeueHead = jest.fn().mockImplementation((): QueueEntry | undefined => queue.shift());

    await drainOnceLayerBroker({
      getHead: (): QueueEntry | undefined => queue[0],
      dequeueHead,
      markHeadStarted: jest.fn(),
      setHeadError: jest.fn(),
      removeByQuestId: jest.fn(),
      isWebPresent: (): boolean => false,
      runOrchestrationLoop,
      getQuestStatus: jest.fn().mockResolvedValue(QuestStatusStub({ value: 'in_progress' })),
      emitQueueUpdated: jest.fn(),
      emitQueueError: jest.fn(),
    });

    expect(runOrchestrationLoop.mock.calls).toStrictEqual([]);
    expect(dequeueHead.mock.calls).toStrictEqual([]);
  });

  it('VALID: {head already has startedAt} => does not call markHeadStarted again', async () => {
    drainOnceLayerBrokerProxy();
    const head = QuestQueueEntryStub({
      questId: QuestIdStub({ value: 'q-1' }),
      startedAt: '2024-01-15T10:00:00.000Z' as never,
    });
    const queue: QueueEntry[] = [head];
    const runOrchestrationLoop = jest.fn().mockResolvedValue(undefined);
    const markHeadStarted = jest.fn();

    await drainOnceLayerBroker({
      getHead: (): QueueEntry | undefined => queue[0],
      dequeueHead: jest.fn(),
      markHeadStarted,
      setHeadError: jest.fn(),
      removeByQuestId: jest.fn(),
      isWebPresent: (): boolean => true,
      runOrchestrationLoop,
      getQuestStatus: jest.fn().mockResolvedValue(QuestStatusStub({ value: 'in_progress' })),
      emitQueueUpdated: jest.fn(),
      emitQueueError: jest.fn(),
    });

    expect(markHeadStarted.mock.calls).toStrictEqual([]);
    expect(runOrchestrationLoop.mock.calls).toStrictEqual([
      [{ questId: head.questId, guildId: head.guildId }],
    ]);
  });
});
