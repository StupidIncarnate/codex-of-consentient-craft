import { clearInterval } from './index';
import { setInterval } from '../setInterval/index';

// Captured at module load, before ward's own leak-detecting jest setup rewraps the global timer
// functions in its `beforeAll` (only on a worker-parallel run) — reading `globalThis.clearInterval`
// live inside the `it` below would then compare against that instrumented wrapper instead.
const globalClearInterval = globalThis.clearInterval;

describe('@dungeonmaster/node/clearInterval', () => {
  it('VALID: {export} => is the same function Node provides on globalThis', () => {
    expect(clearInterval).toBe(globalClearInterval);
  });

  it('VALID: {handle} => cancels a real repeating timer before it fires', async () => {
    let fireCount = 0;
    const handle = setInterval(() => {
      fireCount += 1;
    }, 10);

    clearInterval(handle);

    // A plain wait, not another interval left running past the assertion below.
    await new Promise((resolve) => {
      globalThis.setTimeout(resolve, 25);
    });

    expect(fireCount).toBe(0);
  });
});
