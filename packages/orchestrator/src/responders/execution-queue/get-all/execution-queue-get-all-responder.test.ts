import { QuestQueueEntryStub } from '@dungeonmaster/shared/contracts';

import { ExecutionQueueGetAllResponder } from './execution-queue-get-all-responder';
import { ExecutionQueueGetAllResponderProxy } from './execution-queue-get-all-responder.proxy';
import { questExecutionQueueState } from '../../../state/quest-execution-queue/quest-execution-queue-state';

describe('ExecutionQueueGetAllResponder', () => {
  it('EMPTY: {no entries} => returns empty array', () => {
    const proxy = ExecutionQueueGetAllResponderProxy();
    proxy.setupEmpty();

    expect(ExecutionQueueGetAllResponder()).toStrictEqual([]);
  });

  it('VALID: {two entries queued} => returns them in FIFO order', () => {
    const proxy = ExecutionQueueGetAllResponderProxy();
    proxy.setupEmpty();
    const a = QuestQueueEntryStub();
    const b = QuestQueueEntryStub();
    questExecutionQueueState.enqueue({ entry: a });
    questExecutionQueueState.enqueue({ entry: b });

    expect(ExecutionQueueGetAllResponder()).toStrictEqual([a, b]);
  });
});
