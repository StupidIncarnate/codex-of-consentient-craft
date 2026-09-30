import { shCScriptTransformer } from './sh-c-script-transformer';

describe('shCScriptTransformer', () => {
  describe('single-quoted script', () => {
    it('VALID: {text: "sh -c \'git status\'"} => returns "git status"', () => {
      const text = "sh -c 'git status'";

      expect(shCScriptTransformer({ text })).toBe('git status');
    });
  });

  describe('double-quoted bash script', () => {
    it('VALID: {text: \'bash -c "npm install"\'} => returns "npm install"', () => {
      const text = 'bash -c "npm install"';

      expect(shCScriptTransformer({ text })).toBe('npm install');
    });
  });

  describe('not a sh -c string', () => {
    it('INVALID: {text: "git status"} => returns undefined', () => {
      const text = 'git status';

      expect(shCScriptTransformer({ text })).toBe(undefined);
    });

    it('INVALID: {text: "sh --login"} => returns undefined, no -c flag', () => {
      const text = 'sh --login';

      expect(shCScriptTransformer({ text })).toBe(undefined);
    });
  });
});
