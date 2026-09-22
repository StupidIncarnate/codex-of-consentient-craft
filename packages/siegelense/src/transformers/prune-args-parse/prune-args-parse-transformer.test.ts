import { pruneArgsParseTransformer } from './prune-args-parse-transformer';

describe('pruneArgsParseTransformer', () => {
  describe('the three selectors', () => {
    it('VALID: {args: []} => every selector null but the window, which falls back to the default rather than to no window at all', () => {
      expect(pruneArgsParseTransformer({ args: [] })).toStrictEqual({
        query: { instanceId: null, kind: null, olderThan: '7d' },
        isJson: false,
      });
    });

    it('VALID: {args: --older-than 7d} => the window-only form', () => {
      expect(pruneArgsParseTransformer({ args: ['--older-than', '7d'] })).toStrictEqual({
        query: { instanceId: null, kind: null, olderThan: '7d' },
        isJson: false,
      });
    });

    it('VALID: {args: --instance inst_9b2c} => the one-instance form', () => {
      expect(pruneArgsParseTransformer({ args: ['--instance', 'inst_9b2c'] })).toStrictEqual({
        query: { instanceId: 'inst_9b2c', kind: null, olderThan: '7d' },
        isJson: false,
      });
    });

    it("VALID: {args: --kind video --older-than 2d} => the two selectors combine, which is the spec's own worked call", () => {
      expect(
        pruneArgsParseTransformer({ args: ['--kind', 'video', '--older-than', '2d'] }),
      ).toStrictEqual({
        query: { instanceId: null, kind: 'video', olderThan: '2d' },
        isJson: false,
      });
    });

    it('INVALID: {args: [--human]} => --human is refused as an unknown flag', () => {
      expect(() => pruneArgsParseTransformer({ args: ['--human'] })).toThrow(
        /^Unknown flag: --human\n\nAccepted flags: --instance, --kind, --older-than, --json\n\nUsage: dungeonmaster siegelense prune \[--instance <instanceId>\] \[--kind <kind>\] \[--older-than <window>\] \[--json\]$/u,
      );
    });

    it('VALID: {args: --json} => the explicit json flag parses to isJson: true', () => {
      expect(pruneArgsParseTransformer({ args: ['--json'] })).toStrictEqual({
        query: { instanceId: null, kind: null, olderThan: '7d' },
        isJson: true,
      });
    });
  });

  describe('refusals', () => {
    it('INVALID: {args: --older-than 7} => refuses the unitless window at the argv edge, before any directory is read', () => {
      expect(() => pruneArgsParseTransformer({ args: ['--older-than', '7'] })).toThrow(
        /^Unreadable window: 7\. A window is a whole number followed by one of d, h, m, s — for example 7d\.$/u,
      );
    });

    it("INVALID: {args: --kind screenshot} => refuses under the flag's own name rather than as a ZodError", () => {
      expect(() => pruneArgsParseTransformer({ args: ['--kind', 'screenshot'] })).toThrow(
        /^--kind: Invalid enum value/u,
      );
    });

    it('INVALID: {args: --instance 9b2c} => refuses naming the shape an instance id needed', () => {
      expect(() => pruneArgsParseTransformer({ args: ['--instance', '9b2c'] })).toThrow(
        /^--instance: Instance id must look like/u,
      );
    });

    it('INVALID: {args: --all} => an unknown flag lists the accepted ones', () => {
      expect(() => pruneArgsParseTransformer({ args: ['--all'] })).toThrow(
        /^Unknown flag: --all\n\nAccepted flags: --instance, --kind, --older-than, --json\n\nUsage: dungeonmaster siegelense prune \[--instance <instanceId>\] \[--kind <kind>\] \[--older-than <window>\] \[--json\]$/u,
      );
    });

    it('INVALID: {args: [inst_9b2c]} => a bare positional argument states the rule it broke', () => {
      expect(() => pruneArgsParseTransformer({ args: ['inst_9b2c'] })).toThrow(
        /^Unexpected positional argument: inst_9b2c\n\nEvery value must directly follow the flag it belongs to\./u,
      );
    });

    it('INVALID: {args: --instance --kind video} => refuses naming --instance, never the flag that followed it', () => {
      expect(() => pruneArgsParseTransformer({ args: ['--instance', '--kind', 'video'] })).toThrow(
        /^--instance is required: it cannot be missing, and the value cannot itself start with "--"\.$/u,
      );
    });

    it('INVALID: {args: --kind shot --kind video} => a repeated flag is refused rather than silently resolved', () => {
      expect(() =>
        pruneArgsParseTransformer({ args: ['--kind', 'shot', '--kind', 'video'] }),
      ).toThrow(/^--kind was given twice/u);
    });
  });
});
