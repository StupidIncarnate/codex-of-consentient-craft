import { getPid } from './get-pid';
import { getPidProxy } from './get-pid.proxy';

describe('getPid', () => {
  it('VALID: {staged: 4242} => reads the staged pid at call time', () => {
    const proxy = getPidProxy();
    proxy.setupPid({ pid: 4242 });

    expect(getPid()).toBe(4242);
  });

  it('VALID: {staged: 1, then 99} => reads the latest staging', () => {
    const proxy = getPidProxy();
    proxy.setupPid({ pid: 1 });
    proxy.setupPid({ pid: 99 });

    expect(getPid()).toBe(99);
  });

  it('EMPTY: {staged, then a fresh proxy} => the new proxy starts on the real pid', () => {
    const proxy = getPidProxy();
    const realPid = process.pid;
    proxy.setupPid({ pid: 4242 });
    getPidProxy();

    expect(getPid()).toBe(realPid);
  });
});
