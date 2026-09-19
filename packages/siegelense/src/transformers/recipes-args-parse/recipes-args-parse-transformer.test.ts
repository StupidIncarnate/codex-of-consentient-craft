import { recipesArgsParseTransformer } from './recipes-args-parse-transformer';

describe('recipesArgsParseTransformer', () => {
  describe('the accepted forms', () => {
    it('EMPTY: {args: []} => returns the human default', () => {
      const result = recipesArgsParseTransformer({ args: [] });

      expect(result).toStrictEqual({ human: true });
    });

    it('VALID: {args: ["--json"]} => returns the JSON output', () => {
      const result = recipesArgsParseTransformer({ args: ['--json'] });

      expect(result).toStrictEqual({ human: false });
    });

    it('INVALID: {args: ["--human"]} => --human is refused as an unknown flag', () => {
      expect(() => recipesArgsParseTransformer({ args: ['--human'] })).toThrow(
        'Unknown flag: --human\n\nAccepted flags: --json\n\nrecipes takes no selector — it lists every recipe, and there is nothing to narrow before you have read it.\n\nUsage: dungeonmaster siegelense recipes [--json]',
      );
    });
  });

  describe('refusals', () => {
    it('INVALID: {args: ["--instance", "inst_7f3a9c21"]} => refuses naming the flag, because recipes needs no instance', () => {
      expect(() => recipesArgsParseTransformer({ args: ['--instance', 'inst_7f3a9c21'] })).toThrow(
        'Unknown flag: --instance\n\nAccepted flags: --json\n\nrecipes takes no selector — it lists every recipe, and there is nothing to narrow before you have read it.\n\nUsage: dungeonmaster siegelense recipes [--json]',
      );
    });

    it('INVALID: {args: ["--fidelity", "direct"]} => refuses a filter the call does not offer', () => {
      expect(() => recipesArgsParseTransformer({ args: ['--fidelity', 'direct'] })).toThrow(
        'Unknown flag: --fidelity\n\nAccepted flags: --json\n\nrecipes takes no selector — it lists every recipe, and there is nothing to narrow before you have read it.\n\nUsage: dungeonmaster siegelense recipes [--json]',
      );
    });

    it('INVALID: {args: ["guild-with-three-quests"]} => refuses a bare recipe name, naming why', () => {
      expect(() => recipesArgsParseTransformer({ args: ['guild-with-three-quests'] })).toThrow(
        'Unexpected positional argument: guild-with-three-quests\n\nrecipes names no recipe: it lists them all, so a name here would be a filter on a catalogue you have not read yet.\n\nUsage: dungeonmaster siegelense recipes [--json]',
      );
    });

    it('INVALID: {args: ["--json", "extra"]} => the positional after an accepted flag still refuses', () => {
      expect(() => recipesArgsParseTransformer({ args: ['--json', 'extra'] })).toThrow(
        'Unexpected positional argument: extra\n\nrecipes names no recipe: it lists them all, so a name here would be a filter on a catalogue you have not read yet.\n\nUsage: dungeonmaster siegelense recipes [--json]',
      );
    });
  });
});
