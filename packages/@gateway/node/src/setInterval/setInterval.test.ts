import { setInterval } from './setInterval';

describe('#gateway/node/setInterval', () => {
  it('VALID: {period: 1} => the barrel exports a working setInterval whose real timer fires', async () => {
    const fired = await new Promise((resolve) => {
      const handle = setInterval(() => {
        globalThis.clearInterval(handle);
        resolve('fired');
      }, 1);
    });

    expect(fired).toBe('fired');
  });
});
