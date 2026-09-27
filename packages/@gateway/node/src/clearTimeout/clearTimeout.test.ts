import { clearTimeout } from './clearTimeout';
import { setTimeout } from '../setTimeout/setTimeout';

// Captured at module load, before ward's own leak-detecting jest setup rewraps the global timer
// functions in its `beforeAll` (only on a worker-parallel run) — reading `globalThis.clearTimeout`
// live inside the `it` below would then compare against that instrumented wrapper instead.
const globalClearTimeout = globalThis.clearTimeout;

describe('#gateway/node/clearTimeout', () => {
  it('VALID: {export} => is the same function Node provides on globalThis', () => {
    expect(clearTimeout).toBe(globalClearTimeout);
  });

  it('VALID: {handle} => cancels a real timer before it fires', async () => {
    let fired = false;
    const handle = setTimeout(() => {
      fired = true;
    }, 10);

    clearTimeout(handle);

    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });

    expect(fired).toBe(false);
  });
});
