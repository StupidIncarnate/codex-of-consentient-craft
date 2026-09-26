import { clearTimeout } from './index';
import { setTimeout } from '../setTimeout/index';

describe('@dungeonmaster/node/clearTimeout', () => {
  it('VALID: {export} => is the same function Node provides on globalThis', () => {
    expect(clearTimeout).toBe(globalThis.clearTimeout);
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
