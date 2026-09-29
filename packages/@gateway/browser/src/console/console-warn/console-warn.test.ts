import { console } from '../console';
import { consoleWarn } from './console-warn';
import { consoleWarnProxy } from './console-warn.proxy';

describe('consoleWarn', () => {
  it('VALID: {two lines logged} => getCalls reads back every argument tuple in call order', () => {
    const proxy = consoleWarnProxy();
    const failure = new Error('quota exceeded');

    consoleWarn('[comment-queue] failed to persist the queue', failure);
    consoleWarn('[chat-input] paste handler failed');

    expect(proxy.getCalls()).toStrictEqual([
      ['[comment-queue] failed to persist the queue', failure],
      ['[chat-input] paste handler failed'],
    ]);
  });

  it('VALID: {getCallsFor an exact first argument} => reads back only the lines with that message', () => {
    const proxy = consoleWarnProxy();

    consoleWarn('[a] first', 1);
    consoleWarn('[b] second', 2);
    consoleWarn('[a] first', 3);

    expect(proxy.getCallsFor({ message: '[a] first' })).toStrictEqual([
      ['[a] first', 1],
      ['[a] first', 3],
    ]);
  });

  it('VALID: {getCallsFor a predicate} => reads back every line whose message the predicate accepts', () => {
    const proxy = consoleWarnProxy();

    consoleWarn('[home-content] guild create failed', 'x');
    consoleWarn('[dispatch-toggle] play failed', 'y');
    consoleWarn('[home-content] navigation failed', 'z');

    expect(
      proxy.getCallsFor({ message: (value) => String(value).startsWith('[home-content]') }),
    ).toStrictEqual([
      ['[home-content] guild create failed', 'x'],
      ['[home-content] navigation failed', 'z'],
    ]);
  });

  it('VALID: {caller writes through the barrel console object} => the same proxy records it', () => {
    const proxy = consoleWarnProxy();

    console.warn('[draft-images-load] failed to measure a stored draft', 'reason');

    expect(proxy.getCalls()).toStrictEqual([
      ['[draft-images-load] failed to measure a stored draft', 'reason'],
    ]);
  });

  it('EMPTY: {nothing logged} => getCalls reads back no lines', () => {
    const proxy = consoleWarnProxy();

    expect(proxy.getCalls()).toStrictEqual([]);
  });
});
