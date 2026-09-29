import { console } from '../console';
import { consoleError } from './console-error';
import { consoleErrorProxy } from './console-error.proxy';

describe('consoleError', () => {
  it('VALID: {two lines logged} => getCalls reads back every argument tuple in call order', () => {
    const proxy = consoleErrorProxy();
    const failure = new Error('quota exceeded');

    consoleError('[comment-queue] failed to persist the queue', failure);
    consoleError('[chat-input] paste handler failed');

    expect(proxy.getCalls()).toStrictEqual([
      ['[comment-queue] failed to persist the queue', failure],
      ['[chat-input] paste handler failed'],
    ]);
  });

  it('VALID: {getCallsFor an exact first argument} => reads back only the lines with that message', () => {
    const proxy = consoleErrorProxy();

    consoleError('[a] first', 1);
    consoleError('[b] second', 2);
    consoleError('[a] first', 3);

    expect(proxy.getCallsFor({ message: '[a] first' })).toStrictEqual([
      ['[a] first', 1],
      ['[a] first', 3],
    ]);
  });

  it('VALID: {getCallsFor a predicate} => reads back every line whose message the predicate accepts', () => {
    const proxy = consoleErrorProxy();

    consoleError('[home-content] guild create failed', 'x');
    consoleError('[dispatch-toggle] play failed', 'y');
    consoleError('[home-content] navigation failed', 'z');

    expect(
      proxy.getCallsFor({ message: (value) => String(value).startsWith('[home-content]') }),
    ).toStrictEqual([
      ['[home-content] guild create failed', 'x'],
      ['[home-content] navigation failed', 'z'],
    ]);
  });

  it('VALID: {caller writes through the barrel console object} => the same proxy records it', () => {
    const proxy = consoleErrorProxy();

    console.error('[draft-images-load] failed to measure a stored draft', 'reason');

    expect(proxy.getCalls()).toStrictEqual([
      ['[draft-images-load] failed to measure a stored draft', 'reason'],
    ]);
  });

  it('EMPTY: {nothing logged} => getCalls reads back no lines', () => {
    const proxy = consoleErrorProxy();

    expect(proxy.getCalls()).toStrictEqual([]);
  });
});
