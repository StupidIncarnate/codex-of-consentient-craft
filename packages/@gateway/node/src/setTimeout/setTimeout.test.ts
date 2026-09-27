import { setTimeout } from './setTimeout';

// Captured at module load, before ward's own leak-detecting jest setup rewraps the global timer
// functions in its `beforeAll` (only on a worker-parallel run) — reading `globalThis.setTimeout`
// live inside the `it` below would then compare against that instrumented wrapper instead.
const globalSetTimeout = globalThis.setTimeout;

describe('#gateway/node/setTimeout', () => {
  it('VALID: {export} => is the same function Node provides on globalThis', () => {
    expect(setTimeout).toBe(globalSetTimeout);
  });

  it('VALID: {delay: 0} => real timer fires and invokes the callback', async () => {
    const fired = await new Promise((resolve) => {
      setTimeout(() => {
        resolve('fired');
      }, 0);
    });

    expect(fired).toBe('fired');
  });
});
