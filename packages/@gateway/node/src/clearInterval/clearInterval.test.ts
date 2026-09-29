import { clearInterval } from './clearInterval';
import { setInterval } from '../setInterval/setInterval';

describe('#gateway/node/clearInterval', () => {
  it('VALID: {handle} => the barrel exports a working clearInterval that cancels a real repeating timer', async () => {
    let fireCount = 0;
    const handle = setInterval(() => {
      fireCount += 1;
    }, 10);

    clearInterval(handle);

    await new Promise((resolve) => {
      globalThis.setTimeout(resolve, 25);
    });

    expect(fireCount).toBe(0);
  });
});
