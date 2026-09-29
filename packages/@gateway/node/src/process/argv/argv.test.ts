import { argv } from './argv';
import { argvProxy } from './argv.proxy';

describe('argv', () => {
  it('VALID: {} => is the same array process.argv is', () => {
    expect(argv).toBe(process.argv);
  });

  describe('setupArgv', () => {
    it('VALID: {argv: a CLI invocation} => the captured array holds exactly the staged values', () => {
      const proxy = argvProxy();

      proxy.setupArgv({ argv: ['node', 'start-cli.js', 'summary', 'target'] });

      expect([...argv]).toStrictEqual(['node', 'start-cli.js', 'summary', 'target']);
    });

    it('VALID: {argv staged} => rewrites the array in place, so process.argv is still that same array', () => {
      const proxy = argvProxy();

      proxy.setupArgv({ argv: ['node', 'script.js'] });

      expect({ same: argv === process.argv, values: [...process.argv] }).toStrictEqual({
        same: true,
        values: ['node', 'script.js'],
      });
    });
  });

  describe('restore', () => {
    it('VALID: {staged, then restore} => puts the original values back', () => {
      const proxy = argvProxy();
      const original = [...argv];
      proxy.setupArgv({ argv: ['node', 'script.js', '--flag'] });

      proxy.restore();

      expect([...argv]).toStrictEqual(original);
    });

    it('EMPTY: {staged, then a fresh proxy} => the new proxy starts on the original values', () => {
      const proxy = argvProxy();
      const original = [...argv];
      proxy.setupArgv({ argv: ['node', 'leaked.js'] });

      argvProxy();

      expect([...argv]).toStrictEqual(original);
    });
  });
});
