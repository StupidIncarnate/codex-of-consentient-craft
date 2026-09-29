import { setImmediate } from './set-immediate';
import { setImmediateProxy } from './set-immediate.proxy';

describe('setImmediate', () => {
  it('VALID: {callback} => runs after the current synchronous work', async () => {
    const order: string[] = [];
    const done = new Promise<void>((resolve) => {
      setImmediate(() => {
        order.push('immediate');
        resolve();
      });
    });
    order.push('sync');

    await done;

    expect(order).toStrictEqual(['sync', 'immediate']);
  });

  it('VALID: {callback, two extra args} => the callback receives them', async () => {
    const received = await new Promise<unknown[]>((resolve) => {
      setImmediate(
        (name: string, count: number) => {
          resolve([name, count]);
        },
        'guild',
        2,
      );
    });

    expect(received).toStrictEqual(['guild', 2]);
  });

  it('VALID: {returns} => a real Immediate handle that can be unref-ed', async () => {
    const handle = setImmediate(() => undefined);
    handle.unref();

    const result = handle.hasRef();
    await new Promise<void>((resolve) => {
      setImmediate(() => {
        resolve();
      });
    });

    expect(result).toBe(false);
  });

  it('VALID: {global spied after the module loaded} => the call goes through the spied global', async () => {
    const proxy = setImmediateProxy();
    const callback = (_name: string): void => undefined;

    setImmediate(callback, 'a');
    const calls = [...proxy.callsMatching()];
    await new Promise<void>((resolve) => {
      setImmediate(() => {
        resolve();
      });
    });

    expect(calls).toStrictEqual([[callback, 'a']]);
  });
});
