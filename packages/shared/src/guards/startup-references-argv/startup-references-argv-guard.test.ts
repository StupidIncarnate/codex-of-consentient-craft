import { startupReferencesArgvGuard } from './startup-references-argv-guard';

describe('startupReferencesArgvGuard', () => {
  describe('true cases', () => {
    it('VALID: content contains process.argv => returns true', () => {
      const result = startupReferencesArgvGuard({
        startupFileContent: 'const args = process.argv.slice(2);',
      });

      expect(result).toBe(true);
    });

    it('VALID: content contains process.argv in multi-line context => returns true', () => {
      const result = startupReferencesArgvGuard({
        startupFileContent:
          'export const start = () => {\n  const [,, command] = process.argv;\n};',
      });

      expect(result).toBe(true);
    });

    it('VALID: content imports argv from #gateway/node/process => returns true', () => {
      const result = startupReferencesArgvGuard({
        startupFileContent:
          "import { argv, cwd } from '#gateway/node/process';\nconst [command] = argv.slice(2);",
      });

      expect(result).toBe(true);
    });
  });

  describe('false cases', () => {
    it('INVALID: content imports only other names from #gateway/node/process => returns false', () => {
      const result = startupReferencesArgvGuard({
        startupFileContent: "import { cwd, exit } from '#gateway/node/process';",
      });

      expect(result).toBe(false);
    });

    it('INVALID: content has no process.argv => returns false', () => {
      const result = startupReferencesArgvGuard({
        startupFileContent: 'export const startServer = () => { return true; };',
      });

      expect(result).toBe(false);
    });

    it('EMPTY: startupFileContent is empty string => returns false', () => {
      const result = startupReferencesArgvGuard({ startupFileContent: '' });

      expect(result).toBe(false);
    });

    it('EMPTY: startupFileContent is undefined => returns false', () => {
      const result = startupReferencesArgvGuard({});

      expect(result).toBe(false);
    });
  });
});
