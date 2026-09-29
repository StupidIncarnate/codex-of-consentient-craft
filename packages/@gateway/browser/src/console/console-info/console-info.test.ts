import { console } from '../console';
import { consoleInfo } from './console-info';
import { consoleInfoProxy } from './console-info.proxy';

describe('consoleInfo', () => {
  it('VALID: {two lines logged} => getCalls reads back every argument tuple in call order', () => {
    const proxy = consoleInfoProxy();
    const failure = new Error('quota exceeded');

    consoleInfo('[comment-queue] failed to persist the queue', failure);
    consoleInfo('[chat-input] paste handler failed');

    expect(proxy.getCalls()).toStrictEqual([
      ['[comment-queue] failed to persist the queue', failure],
      ['[chat-input] paste handler failed'],
    ]);
  });

  it('VALID: {getCallsFor an exact first argument} => reads back only the lines with that message', () => {
    const proxy = consoleInfoProxy();

    consoleInfo('[a] first', 1);
    consoleInfo('[b] second', 2);
    consoleInfo('[a] first', 3);

    expect(proxy.getCallsFor({ message: '[a] first' })).toStrictEqual([
      ['[a] first', 1],
      ['[a] first', 3],
    ]);
  });

  it('VALID: {getCallsFor a predicate} => reads back every line whose message the predicate accepts', () => {
    const proxy = consoleInfoProxy();

    consoleInfo('[home-content] guild create failed', 'x');
    consoleInfo('[dispatch-toggle] play failed', 'y');
    consoleInfo('[home-content] navigation failed', 'z');

    expect(
      proxy.getCallsFor({ message: (value) => String(value).startsWith('[home-content]') }),
    ).toStrictEqual([
      ['[home-content] guild create failed', 'x'],
      ['[home-content] navigation failed', 'z'],
    ]);
  });

  it('VALID: {caller writes through the barrel console object} => the same proxy records it', () => {
    const proxy = consoleInfoProxy();

    console.info('[draft-images-load] failed to measure a stored draft', 'reason');

    expect(proxy.getCalls()).toStrictEqual([
      ['[draft-images-load] failed to measure a stored draft', 'reason'],
    ]);
  });

  it('EMPTY: {nothing logged} => getCalls reads back no lines', () => {
    const proxy = consoleInfoProxy();

    expect(proxy.getCalls()).toStrictEqual([]);
  });
});
