import { console } from '../console';
import { consoleDebug } from './console-debug';
import { consoleDebugProxy } from './console-debug.proxy';

describe('consoleDebug', () => {
  it('VALID: {two lines logged} => getCalls reads back every argument tuple in call order', () => {
    const proxy = consoleDebugProxy();
    const failure = new Error('quota exceeded');

    consoleDebug('[comment-queue] failed to persist the queue', failure);
    consoleDebug('[chat-input] paste handler failed');

    expect(proxy.getCalls()).toStrictEqual([
      ['[comment-queue] failed to persist the queue', failure],
      ['[chat-input] paste handler failed'],
    ]);
  });

  it('VALID: {getCallsFor an exact first argument} => reads back only the lines with that message', () => {
    const proxy = consoleDebugProxy();

    consoleDebug('[a] first', 1);
    consoleDebug('[b] second', 2);
    consoleDebug('[a] first', 3);

    expect(proxy.getCallsFor({ message: '[a] first' })).toStrictEqual([
      ['[a] first', 1],
      ['[a] first', 3],
    ]);
  });

  it('VALID: {getCallsFor a predicate} => reads back every line whose message the predicate accepts', () => {
    const proxy = consoleDebugProxy();

    consoleDebug('[home-content] guild create failed', 'x');
    consoleDebug('[dispatch-toggle] play failed', 'y');
    consoleDebug('[home-content] navigation failed', 'z');

    expect(
      proxy.getCallsFor({ message: (value) => String(value).startsWith('[home-content]') }),
    ).toStrictEqual([
      ['[home-content] guild create failed', 'x'],
      ['[home-content] navigation failed', 'z'],
    ]);
  });

  it('VALID: {caller writes through the barrel console object} => the same proxy records it', () => {
    const proxy = consoleDebugProxy();

    console.debug('[draft-images-load] failed to measure a stored draft', 'reason');

    expect(proxy.getCalls()).toStrictEqual([
      ['[draft-images-load] failed to measure a stored draft', 'reason'],
    ]);
  });

  it('EMPTY: {nothing logged} => getCalls reads back no lines', () => {
    const proxy = consoleDebugProxy();

    expect(proxy.getCalls()).toStrictEqual([]);
  });
});
