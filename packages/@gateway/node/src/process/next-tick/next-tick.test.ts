import { nextTick } from './next-tick';

describe('nextTick', () => {
  it('VALID: {callback} => runs after the current synchronous work, not during the call', async () => {
    const order: string[] = [];
    const done = new Promise<void>((resolve) => {
      nextTick(() => {
        order.push('tick');
        resolve();
      });
    });
    order.push('sync');

    await done;

    expect(order).toStrictEqual(['sync', 'tick']);
  });

  it('VALID: {two callbacks} => run in the order they were queued', async () => {
    const order: string[] = [];
    nextTick(() => {
      order.push('first');
    });
    const done = new Promise<void>((resolve) => {
      nextTick(() => {
        order.push('second');
        resolve();
      });
    });

    await done;

    expect(order).toStrictEqual(['first', 'second']);
  });
});
