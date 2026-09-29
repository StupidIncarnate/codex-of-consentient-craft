import { now } from './now';
import { nowProxy } from './now.proxy';

describe('now', () => {
  it('VALID: {clock staged at 1234} => returns 1234', () => {
    const proxy = nowProxy();
    proxy.setupNow({ ms: 1234 });

    expect(now()).toBe(1234);
  });

  it('VALID: {clock restaged} => returns the latest staged value on each read', () => {
    const proxy = nowProxy();
    proxy.setupNow({ ms: 10 });
    const first = now();
    proxy.setupNow({ ms: 20 });

    expect({ first, second: now() }).toStrictEqual({ first: 10, second: 20 });
  });
});
