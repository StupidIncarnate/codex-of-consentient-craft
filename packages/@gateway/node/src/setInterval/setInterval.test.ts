import { setInterval } from './setInterval';
import { clearInterval } from '../clearInterval/clearInterval';

// Captured at module load, before ward's own leak-detecting jest setup rewraps the global timer
// functions in its `beforeAll` (only on a worker-parallel run) — reading `globalThis.setInterval`
// live inside the `it` below would then compare against that instrumented wrapper instead.
const globalSetInterval = globalThis.setInterval;

describe('#gateway/node/setInterval', () => {
  it('VALID: {export} => is the same function Node provides on globalThis', () => {
    expect(setInterval).toBe(globalSetInterval);
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
