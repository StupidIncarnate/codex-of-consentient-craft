import { clearTimeout } from './clearTimeout';
import { setTimeout } from '../setTimeout/setTimeout';

describe('#gateway/node/clearTimeout', () => {
  it('VALID: {handle} => the barrel exports a working clearTimeout', async () => {
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
