import { recipesArgsParseTransformer } from './recipes-args-parse-transformer';

describe('recipesArgsParseTransformer', () => {
  describe('the accepted forms', () => {
    it('EMPTY: {args: []} => returns the JSON default', () => {
      const result = recipesArgsParseTransformer({ args: [] });

      expect(result).toStrictEqual({ human: false });
    });

    it('VALID: {args: ["--human"]} => returns the reading-table form', () => {
      const result = recipesArgsParseTransformer({ args: ['--human'] });

      expect(result).toStrictEqual({ human: true });
    });

    it('VALID: {args: ["--json"]} => the explicit default parses to the same thing as the bare call', () => {
      const result = recipesArgsParseTransformer({ args: ['--json'] });

      expect(result).toStrictEqual({ human: false });
    });

    it('VALID: {args: ["--json", "--human"]} => --human wins, matching every other call', () => {
      const result = recipesArgsParseTransformer({ args: ['--json', '--human'] });

      expect(result).toStrictEqual({ human: true });
    });
  });

  describe('refusals', () => {
    it('INVALID: {args: ["--instance", "inst_7f3a9c21"]} => refuses naming the flag, because recipes needs no instance', () => {
      expect(() => recipesArgsParseTransformer({ args: ['--instance', 'inst_7f3a9c21'] })).toThrow(
        'Unknown flag: --instance\n\nAccepted flags: --json, --human\n\nrecipes takes no selector — it lists every recipe, and there is nothing to narrow before you have read it.\n\nUsage: dungeonmaster siegelense recipes [--json] [--human]',
      );
    });

    it('INVALID: {args: ["--fidelity", "direct"]} => refuses a filter the call does not offer', () => {
      expect(() => recipesArgsParseTransformer({ args: ['--fidelity', 'direct'] })).toThrow(
        'Unknown flag: --fidelity\n\nAccepted flags: --json, --human\n\nrecipes takes no selector — it lists every recipe, and there is nothing to narrow before you have read it.\n\nUsage: dungeonmaster siegelense recipes [--json] [--human]',
      );
    });

    it('INVALID: {args: ["guild-with-three-quests"]} => refuses a bare recipe name, naming why', () => {
      expect(() => recipesArgsParseTransformer({ args: ['guild-with-three-quests'] })).toThrow(
        'Unexpected positional argument: guild-with-three-quests\n\nrecipes names no recipe: it lists them all, so a name here would be a filter on a catalogue you have not read yet.\n\nUsage: dungeonmaster siegelense recipes [--json] [--human]',
      );
    });

    it('INVALID: {args: ["--human", "extra"]} => the positional after an accepted flag still refuses', () => {
      expect(() => recipesArgsParseTransformer({ args: ['--human', 'extra'] })).toThrow(
        'Unexpected positional argument: extra\n\nrecipes names no recipe: it lists them all, so a name here would be a filter on a catalogue you have not read yet.\n\nUsage: dungeonmaster siegelense recipes [--json] [--human]',
      );
    });
  });
});
