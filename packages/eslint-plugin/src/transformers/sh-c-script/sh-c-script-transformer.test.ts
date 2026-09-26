import { shCScriptTransformer } from './sh-c-script-transformer';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';

describe('shCScriptTransformer', () => {
  describe('single-quoted script', () => {
    it('VALID: {text: "sh -c \'git status\'"} => returns "git status"', () => {
      const text = ContentTextStub({ value: "sh -c 'git status'" });

      expect(shCScriptTransformer({ text })).toBe('git status');
    });
  });

  describe('double-quoted bash script', () => {
    it('VALID: {text: \'bash -c "npm install"\'} => returns "npm install"', () => {
      const text = ContentTextStub({ value: 'bash -c "npm install"' });

      expect(shCScriptTransformer({ text })).toBe('npm install');
    });
  });

  describe('not a sh -c string', () => {
    it('INVALID: {text: "git status"} => returns undefined', () => {
      const text = ContentTextStub({ value: 'git status' });

      expect(shCScriptTransformer({ text })).toBe(undefined);
    });

    it('INVALID: {text: "sh --login"} => returns undefined, no -c flag', () => {
      const text = ContentTextStub({ value: 'sh --login' });

      expect(shCScriptTransformer({ text })).toBe(undefined);
    });
  });
});
