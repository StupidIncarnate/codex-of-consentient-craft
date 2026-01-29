import { sleepPromiseTransformer } from './sleep-promise-transformer';

describe('sleepPromiseTransformer', () => {
  it('VALID: {10ms delay} => resolves after delay', async () => {
    const start = Date.now();

    await sleepPromiseTransformer({ ms: 10 });

    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(10);
  });

  it('VALID: {0ms delay} => resolves immediately', async () => {
    const start = Date.now();

    await sleepPromiseTransformer({ ms: 0 });

    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(50);
  });
});
