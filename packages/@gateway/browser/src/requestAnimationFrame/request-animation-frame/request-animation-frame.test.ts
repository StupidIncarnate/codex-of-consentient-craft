import { requestAnimationFrame } from './request-animation-frame';
import { requestAnimationFrameProxy } from './request-animation-frame.proxy';

describe('requestAnimationFrame', () => {
  it('VALID: {callback} => runs it with a real, non-negative frame timestamp', async () => {
    const timestamp = await new Promise<number>((resolve) => {
      requestAnimationFrame((frameTimestamp) => {
        resolve(frameTimestamp);
      });
    });

    expect(timestamp).toBeGreaterThanOrEqual(0);
  });

  it('VALID: {frame id staged} => returns the staged id, so the global is read at call time', () => {
    const proxy = requestAnimationFrameProxy();
    proxy.stageFrameId({ frameId: 77 });

    const frameId = requestAnimationFrame(() => undefined);

    expect(frameId).toBe(77);
  });

  it('VALID: {one request} => getCalls reads back the callback that was handed over', () => {
    const proxy = requestAnimationFrameProxy();
    proxy.stageFrameId({ frameId: 5 });
    const callback = (): void => undefined;

    requestAnimationFrame(callback);

    expect(proxy.getCalls()).toStrictEqual([[callback]]);
  });
});
