import { setTimeout } from './setTimeout';

describe('#gateway/node/setTimeout', () => {
  it('VALID: {delay: 0} => real timer fires and invokes the callback', async () => {
    const fired = await new Promise((resolve) => {
      setTimeout(() => {
        resolve('fired');
      }, 0);
    });

    expect(fired).toBe('fired');
  });
});
