import { setTimeout } from './index';

describe('@dungeonmaster/node/setTimeout', () => {
  it('VALID: {export} => is the same function Node provides on globalThis', () => {
    expect(setTimeout).toBe(globalThis.setTimeout);
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
