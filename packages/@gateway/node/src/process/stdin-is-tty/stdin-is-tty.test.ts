import { stdinIsTty } from './stdin-is-tty';
import { stdinIsTtyProxy } from './stdin-is-tty.proxy';

describe('stdinIsTty', () => {
  it('VALID: {isTTY: true} => true', () => {
    const proxy = stdinIsTtyProxy();
    proxy.setupIsTty({ value: true });

    expect(stdinIsTty()).toBe(true);
  });

  it('VALID: {isTTY: false} => false', () => {
    const proxy = stdinIsTtyProxy();
    proxy.setupIsTty({ value: false });

    expect(stdinIsTty()).toBe(false);
  });

  it('EMPTY: {nothing staged} => false, the proxy starts every test non-terminal', () => {
    stdinIsTtyProxy();

    expect(stdinIsTty()).toBe(false);
  });
});
