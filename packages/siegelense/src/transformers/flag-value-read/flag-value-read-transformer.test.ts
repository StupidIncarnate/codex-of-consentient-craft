import { flagValueReadTransformer } from './flag-value-read-transformer';

describe('flagValueReadTransformer', () => {
  describe('the flag is present, followed by a value', () => {
    it('VALID: {args: ["--instance", "inst_7f3a9c21"], flag: "--instance"} => returns "inst_7f3a9c21"', () => {
      const result = flagValueReadTransformer({
        args: ['--instance', 'inst_7f3a9c21'],
        flag: '--instance',
      });

      expect(result).toBe('inst_7f3a9c21');
    });
  });

  describe('the flag is absent', () => {
    it('EMPTY: {args: ["--run", "run_2"], flag: "--instance"} => returns null', () => {
      const result = flagValueReadTransformer({ args: ['--run', 'run_2'], flag: '--instance' });

      expect(result).toBe(null);
    });
  });

  describe('the flag is the last token, so no value follows', () => {
    it('INVALID: {args: ["--instance"], flag: "--instance"} => throws naming the flag', () => {
      expect(() => flagValueReadTransformer({ args: ['--instance'], flag: '--instance' })).toThrow(
        /^--instance is required: it cannot be missing, and the value cannot itself start with "--"\.$/u,
      );
    });
  });

  describe('the next token itself starts with --', () => {
    it('INVALID: {args: ["--instance", "--json"], flag: "--instance"} => throws naming the flag', () => {
      expect(() =>
        flagValueReadTransformer({ args: ['--instance', '--json'], flag: '--instance' }),
      ).toThrow(
        /^--instance is required: it cannot be missing, and the value cannot itself start with "--"\.$/u,
      );
    });
  });

  describe('the flag appears twice', () => {
    it('EDGE: {args: ["--instance", "inst_a", "--instance", "inst_b"], flag: "--instance"} => throws naming the flag as given twice', () => {
      expect(() =>
        flagValueReadTransformer({
          args: ['--instance', 'inst_a', '--instance', 'inst_b'],
          flag: '--instance',
        }),
      ).toThrow(
        /^--instance was given twice: a repeated flag is ambiguous, and this refuses rather than silently choosing the first or the last value\.$/u,
      );
    });
  });
});
