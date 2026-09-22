import { recipesArgsParseTransformer } from './recipes-args-parse-transformer';

describe('recipesArgsParseTransformer', () => {
  describe('no args', () => {
    it('EMPTY: {args: []} => defaults to human view', () => {
      const result = recipesArgsParseTransformer({ args: [] });

      expect(result).toStrictEqual({ isJson: false });
    });
  });

  describe('the flag --json', () => {
    it('VALID: {args: [--json]} => isJson is true', () => {
      const result = recipesArgsParseTransformer({ args: ['--json'] });

      expect(result).toStrictEqual({ isJson: true });
    });
  });

  describe('the flag --human', () => {
    it('INVALID: {args: [--human]} => throws naming --human as an unknown flag', () => {
      expect(() => recipesArgsParseTransformer({ args: ['--human'] })).toThrow(
        /^Unknown flag: --human\n\nTakes no instance\. `recipes` lists what states can be created, not what a running instance is doing — no instance is needed to answer it\.\n\nAccepted flags: --json\n\nUsage: dungeonmaster siegelense recipes \[--json\]$/u,
      );
    });
  });

  describe('the flag --instance specifically', () => {
    it('INVALID: {args: [--instance, inst_x]} => throws naming --instance and listing the accepted flags', () => {
      expect(() => recipesArgsParseTransformer({ args: ['--instance', 'inst_x'] })).toThrow(
        /^Unknown flag: --instance\n\nTakes no instance\. `recipes` lists what states can be created, not what a running instance is doing — no instance is needed to answer it\.\n\nAccepted flags: --json\n\nUsage: dungeonmaster siegelense recipes \[--json\]$/u,
      );
    });
  });

  describe('an unknown flag', () => {
    it('INVALID: {args: [--bogus]} => throws naming the flag and listing the accepted ones', () => {
      expect(() => recipesArgsParseTransformer({ args: ['--bogus'] })).toThrow(
        /^Unknown flag: --bogus\n\nTakes no instance\. `recipes` lists what states can be created, not what a running instance is doing — no instance is needed to answer it\.\n\nAccepted flags: --json\n\nUsage: dungeonmaster siegelense recipes \[--json\]$/u,
      );
    });
  });

  describe('a positional argument', () => {
    it('INVALID: {args: [extra]} => throws stating recipes takes no instance AND the canonical positional-argument sentence', () => {
      expect(() => recipesArgsParseTransformer({ args: ['extra'] })).toThrow(
        /^Unexpected positional argument: extra\n\nTakes no instance\. `recipes` lists what states can be created, not what a running instance is doing — no instance is needed to answer it\. Every value must directly follow the flag it belongs to\.\n\nUsage: dungeonmaster siegelense recipes \[--json\]$/u,
      );
    });
  });
});
