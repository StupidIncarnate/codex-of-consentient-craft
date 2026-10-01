import { stdout } from './stdout';
import { stdoutProxy } from './stdout.proxy';

describe('stdout', () => {
  it('VALID: {} => is the same Writable object process.stdout is', () => {
    expect(stdout).toBe(process.stdout);
  });

  it('VALID: {two writes} => the proxy records each chunk in call order and joins them', () => {
    const proxy = stdoutProxy();

    const returned = [stdout.write('first\n'), stdout.write('second\n')];

    expect({
      returned,
      writes: proxy.getWrites(),
      text: proxy.getWrittenText(),
    }).toStrictEqual({
      returned: [true, true],
      writes: ['first\n', 'second\n'],
      text: 'first\nsecond\n',
    });
  });

  it('EMPTY: {no writes} => the proxy reads back nothing', () => {
    const proxy = stdoutProxy();

    expect({ writes: proxy.getWrites(), text: proxy.getWrittenText() }).toStrictEqual({
      writes: [],
      text: '',
    });
  });

  it.each([true, false, undefined])(
    'VALID: {setupIsTty: %s} => stdout.isTTY reads back that value',
    (value) => {
      const proxy = stdoutProxy();

      proxy.setupIsTty({ value });

      expect(stdout.isTTY).toBe(value);
    },
  );

  it('VALID: {setupIsTty: true, then a new proxy} => the new proxy resets isTTY to false', () => {
    stdoutProxy().setupIsTty({ value: true });

    stdoutProxy();

    expect(stdout.isTTY).toBe(false);
  });
});
