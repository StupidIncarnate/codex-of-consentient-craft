import { exit } from './exit';
import { exitProxy } from './exit.proxy';

describe('exit', () => {
  it('VALID: {code: 7} => calls the real process.exit with that code', () => {
    const proxy = exitProxy();

    exit(7);

    expect([...proxy.callsMatching()]).toStrictEqual([[7]]);
  });

  it('EMPTY: {code omitted} => calls process.exit with undefined', () => {
    const proxy = exitProxy();

    exit();

    expect([...proxy.callsMatching()]).toStrictEqual([[undefined]]);
  });
});
