import { console } from '../console';
import { consoleLog } from './console-log';
import { consoleLogProxy } from './console-log.proxy';

describe('consoleLog', () => {
  it('VALID: {two lines logged} => getCalls reads back every argument tuple in call order', () => {
    const proxy = consoleLogProxy();
    const failure = new Error('quota exceeded');

    consoleLog('[comment-queue] failed to persist the queue', failure);
    consoleLog('[chat-input] paste handler failed');

    expect(proxy.getCalls()).toStrictEqual([
      ['[comment-queue] failed to persist the queue', failure],
      ['[chat-input] paste handler failed'],
    ]);
  });

  it('VALID: {getCallsFor an exact first argument} => reads back only the lines with that message', () => {
    const proxy = consoleLogProxy();

    consoleLog('[a] first', 1);
    consoleLog('[b] second', 2);
    consoleLog('[a] first', 3);

    expect(proxy.getCallsFor({ message: '[a] first' })).toStrictEqual([
      ['[a] first', 1],
      ['[a] first', 3],
    ]);
  });

  it('VALID: {getCallsFor a predicate} => reads back every line whose message the predicate accepts', () => {
    const proxy = consoleLogProxy();

    consoleLog('[home-content] guild create failed', 'x');
    consoleLog('[dispatch-toggle] play failed', 'y');
    consoleLog('[home-content] navigation failed', 'z');

    expect(
      proxy.getCallsFor({ message: (value) => String(value).startsWith('[home-content]') }),
    ).toStrictEqual([
      ['[home-content] guild create failed', 'x'],
      ['[home-content] navigation failed', 'z'],
    ]);
  });

  it('VALID: {caller writes through the barrel console object} => the same proxy records it', () => {
    const proxy = consoleLogProxy();

    console.log('[draft-images-load] failed to measure a stored draft', 'reason');

    expect(proxy.getCalls()).toStrictEqual([
      ['[draft-images-load] failed to measure a stored draft', 'reason'],
    ]);
  });

  it('EMPTY: {nothing logged} => getCalls reads back no lines', () => {
    const proxy = consoleLogProxy();

    expect(proxy.getCalls()).toStrictEqual([]);
  });
});
