import { stderr } from './stderr';
import { stderrProxy } from './stderr.proxy';

describe('stderr', () => {
  it('VALID: {} => is the same Writable object process.stderr is', () => {
    expect(stderr).toBe(process.stderr);
  });

  it('VALID: {two writes} => the proxy records each chunk in call order and joins them', () => {
    const proxy = stderrProxy();

    const returned = [stderr.write('first\n'), stderr.write('second\n')];

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
    const proxy = stderrProxy();

    expect({ writes: proxy.getWrites(), text: proxy.getWrittenText() }).toStrictEqual({
      writes: [],
      text: '',
    });
  });
});
