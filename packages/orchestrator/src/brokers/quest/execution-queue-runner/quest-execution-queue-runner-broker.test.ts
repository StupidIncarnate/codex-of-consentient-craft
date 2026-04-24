import { QuestIdStub, QuestQueueEntryStub, QuestStatusStub } from '@dungeonmaster/shared/contracts';

import { questExecutionQueueRunnerBroker } from './quest-execution-queue-runner-broker';
import { questExecutionQueueRunnerBrokerProxy } from './quest-execution-queue-runner-broker.proxy';

type QueueEntry = ReturnType<typeof QuestQueueEntryStub>;

describe('questExecutionQueueRunnerBroker', () => {
  it('VALID: {start} => registers change handler via onQueueChange', () => {
    questExecutionQueueRunnerBrokerProxy();
    const onQueueChange = jest.fn();
    const offQueueChange = jest.fn();

    const runner = questExecutionQueueRunnerBroker({
      getHead: (): QueueEntry | undefined => undefined,
      dequeueHead: (): QueueEntry | undefined => undefined,
      markHeadStarted: jest.fn(),
      setHeadError: jest.fn(),
      removeByQuestId: jest.fn(),
      onQueueChange,
      offQueueChange,
      isWebPresent: (): boolean => true,
      runOrchestrationLoop: jest.fn().mockResolvedValue(undefined),
      getQuestStatus: jest.fn().mockResolvedValue(undefined),
      emitQueueUpdated: jest.fn(),
      emitQueueError: jest.fn(),
    });

    runner.start();

    expect(onQueueChange.mock.calls).toStrictEqual([[{ handler: expect.any(Function) }]]);
  });

  it('VALID: {start twice} => only registers handler once', () => {
    questExecutionQueueRunnerBrokerProxy();
    const onQueueChange = jest.fn();

    const runner = questExecutionQueueRunnerBroker({
      getHead: (): QueueEntry | undefined => undefined,
      dequeueHead: (): QueueEntry | undefined => undefined,
      markHeadStarted: jest.fn(),
      setHeadError: jest.fn(),
      removeByQuestId: jest.fn(),
      onQueueChange,
      offQueueChange: jest.fn(),
      isWebPresent: (): boolean => true,
      runOrchestrationLoop: jest.fn().mockResolvedValue(undefined),
      getQuestStatus: jest.fn().mockResolvedValue(undefined),
      emitQueueUpdated: jest.fn(),
      emitQueueError: jest.fn(),
    });

    runner.start();
    runner.start();

    expect(onQueueChange.mock.calls).toStrictEqual([[{ handler: expect.any(Function) }]]);
  });

  it('VALID: {stop after start} => deregisters handler via offQueueChange', () => {
    questExecutionQueueRunnerBrokerProxy();
    const offQueueChange = jest.fn();

    const runner = questExecutionQueueRunnerBroker({
      getHead: (): QueueEntry | undefined => undefined,
      dequeueHead: (): QueueEntry | undefined => undefined,
      markHeadStarted: jest.fn(),
      setHeadError: jest.fn(),
      removeByQuestId: jest.fn(),
      onQueueChange: jest.fn(),
      offQueueChange,
      isWebPresent: (): boolean => true,
      runOrchestrationLoop: jest.fn().mockResolvedValue(undefined),
      getQuestStatus: jest.fn().mockResolvedValue(undefined),
      emitQueueUpdated: jest.fn(),
      emitQueueError: jest.fn(),
    });

    runner.start();
    runner.stop();

    expect(offQueueChange.mock.calls).toStrictEqual([[{ handler: expect.any(Function) }]]);
  });

  it('VALID: {kick on empty queue} => resolves, does not run loop', async () => {
    questExecutionQueueRunnerBrokerProxy();
    const runOrchestrationLoop = jest.fn().mockResolvedValue(undefined);

    const runner = questExecutionQueueRunnerBroker({
      getHead: (): QueueEntry | undefined => undefined,
      dequeueHead: (): QueueEntry | undefined => undefined,
      markHeadStarted: jest.fn(),
      setHeadError: jest.fn(),
      removeByQuestId: jest.fn(),
      onQueueChange: jest.fn(),
      offQueueChange: jest.fn(),
      isWebPresent: (): boolean => true,
      runOrchestrationLoop,
      getQuestStatus: jest.fn().mockResolvedValue(undefined),
      emitQueueUpdated: jest.fn(),
      emitQueueError: jest.fn(),
    });

    const result = await runner.kick();

    expect(result).toStrictEqual({ success: true });
    expect(runOrchestrationLoop.mock.calls).toStrictEqual([]);
  });

  it('VALID: {kick with running head} => invokes loop with head questId + guildId', async () => {
    questExecutionQueueRunnerBrokerProxy();
    const head = QuestQueueEntryStub({ questId: QuestIdStub({ value: 'q-1' }) });
    const queue: QueueEntry[] = [head];
    const runOrchestrationLoop = jest.fn().mockResolvedValue(undefined);

    const runner = questExecutionQueueRunnerBroker({
      getHead: (): QueueEntry | undefined => queue[0],
      dequeueHead: (): QueueEntry | undefined => queue.shift(),
      markHeadStarted: jest.fn(),
      setHeadError: jest.fn(),
      removeByQuestId: jest.fn(),
      onQueueChange: jest.fn(),
      offQueueChange: jest.fn(),
      isWebPresent: (): boolean => true,
      runOrchestrationLoop,
      getQuestStatus: jest.fn().mockResolvedValue(QuestStatusStub({ value: 'in_progress' })),
      emitQueueUpdated: jest.fn(),
      emitQueueError: jest.fn(),
    });

    await runner.kick();

    expect(runOrchestrationLoop.mock.calls).toStrictEqual([
      [{ questId: head.questId, guildId: head.guildId }],
    ]);
  });
});
