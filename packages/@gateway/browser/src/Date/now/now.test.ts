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

  it('VALID: {three one-shots staged} => successive reads get successive staged values', () => {
    const proxy = nowProxy();
    proxy.setupNowOnce({ ms: 100 });
    proxy.setupNowOnce({ ms: 200 });
    proxy.setupNowOnce({ ms: 300 });

    expect([now(), now(), now()]).toStrictEqual([100, 200, 300]);
  });

  it('VALID: {one-shots then setupNow} => setupNow answers once the one-shots are spent', () => {
    const proxy = nowProxy();
    proxy.setupNow({ ms: 999 });
    proxy.setupNowOnce({ ms: 1 });
    proxy.setupNowOnce({ ms: 2 });

    expect([now(), now(), now(), now()]).toStrictEqual([1, 2, 999, 999]);
  });
});
