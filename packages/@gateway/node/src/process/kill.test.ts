import { kill } from './kill';
import { killProxy } from './kill.proxy';

describe('kill', () => {
  it('VALID: {targetPid, signal: SIGTERM} => calls the real process.kill with both', () => {
    const proxy = killProxy();

    const result = kill(1234, 'SIGTERM');

    expect(result).toBe(true);
    expect([...proxy.callsMatching()]).toStrictEqual([[1234, 'SIGTERM']]);
  });

  it('EMPTY: {signal omitted} => calls process.kill with undefined for the signal', () => {
    const proxy = killProxy();

    kill(4321);

    expect([...proxy.callsMatching()]).toStrictEqual([[4321, undefined]]);
  });

  it('VALID: {targetPid: process.pid, signal: 0} => the real process.kill answers true', () => {
    expect(kill(process.pid, 0)).toBe(true);
  });
});
