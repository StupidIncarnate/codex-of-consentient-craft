import { setInterval } from './index';
import { clearInterval } from '../clearInterval/index';

describe('@dungeonmaster/node/setInterval', () => {
  it('VALID: {export} => is the same function Node provides on globalThis', () => {
    expect(setInterval).toBe(globalThis.setInterval);
  });

  it('VALID: {period: 0} => real timer fires and invokes the callback at least once', async () => {
    const fired = await new Promise((resolve) => {
      const handle = setInterval(() => {
        clearInterval(handle);
        resolve('fired');
      }, 0);
    });

    expect(fired).toBe('fired');
  });
});
