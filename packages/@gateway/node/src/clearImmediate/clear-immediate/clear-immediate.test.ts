import { clearImmediate } from './clear-immediate';
import { clearImmediateProxy } from './clear-immediate.proxy';
import { ImmediateHandleStub } from '../immediate-handle.stub';

describe('clearImmediate', () => {
  it('VALID: {handle of a pending immediate} => the callback never runs', async () => {
    let fired = false;
    const handle = globalThis.setImmediate(() => {
      fired = true;
    });

    clearImmediate(handle);

    await new Promise<void>((resolve) => {
      globalThis.setImmediate(() => {
        resolve();
      });
    });

    expect(fired).toBe(false);
  });

  it('EMPTY: {handle: undefined} => no-op, an unrelated pending immediate still runs', async () => {
    const fired = new Promise<string>((resolve) => {
      globalThis.setImmediate(() => {
        resolve('ran');
      });
    });

    clearImmediate(undefined);

    await expect(fired).resolves.toBe('ran');
  });

  it('EDGE: {handle already cleared} => no-op, an unrelated pending immediate still runs', async () => {
    const handle = ImmediateHandleStub();
    const fired = new Promise<string>((resolve) => {
      globalThis.setImmediate(() => {
        resolve('ran');
      });
    });

    clearImmediate(handle);

    await expect(fired).resolves.toBe('ran');
  });

  it('VALID: {global spied after the module loaded} => the call goes through the spied global', () => {
    const handle = ImmediateHandleStub();
    const proxy = clearImmediateProxy();

    clearImmediate(handle);

    expect([...proxy.callsMatching()]).toStrictEqual([[handle]]);
  });
});
