import { queueMicrotask } from './queue-microtask';
import { queueMicrotaskProxy } from './queue-microtask.proxy';
import { QueuedTaskStub } from '../queued-task.stub';

describe('queueMicrotask', () => {
  it('VALID: {callback} => runs after the current synchronous work', async () => {
    const order: string[] = [];
    const done = new Promise<void>((resolve) => {
      queueMicrotask(() => {
        order.push('microtask');
        resolve();
      });
    });
    order.push('sync');

    await done;

    expect(order).toStrictEqual(['sync', 'microtask']);
  });

  it('VALID: {callback queued before a setImmediate} => runs before the immediate', async () => {
    const order: string[] = [];
    const done = new Promise<void>((resolve) => {
      globalThis.setImmediate(() => {
        order.push('immediate');
        resolve();
      });
    });
    queueMicrotask(() => {
      order.push('microtask');
    });

    await done;

    expect(order).toStrictEqual(['microtask', 'immediate']);
  });

  it('VALID: {global spied after the module loaded} => the call goes through the spied global and the task still runs', async () => {
    const proxy = queueMicrotaskProxy();
    const task = QueuedTaskStub();

    queueMicrotask(task.callback);
    await Promise.resolve();

    expect({ calls: [...proxy.callsMatching()], hasRun: task.hasRun() }).toStrictEqual({
      calls: [[task.callback]],
      hasRun: true,
    });
  });
});
