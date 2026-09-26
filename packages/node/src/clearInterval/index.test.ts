import { clearInterval } from './index';
import { setInterval } from '../setInterval/index';

describe('@dungeonmaster/node/clearInterval', () => {
  it('VALID: {export} => is the same function Node provides on globalThis', () => {
    expect(clearInterval).toBe(globalThis.clearInterval);
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
