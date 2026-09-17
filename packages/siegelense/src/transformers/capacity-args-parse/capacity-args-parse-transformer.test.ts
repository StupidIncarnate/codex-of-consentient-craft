import { capacityArgsParseTransformer } from './capacity-args-parse-transformer';

describe('capacityArgsParseTransformer', () => {
  describe('the bare form', () => {
    it('EMPTY: {args: []} => returns both fields null, so the broker reads its knobs', () => {
      expect(capacityArgsParseTransformer({ args: [] })).toStrictEqual({
        specName: null,
        poolSize: null,
      });
    });

    it('VALID: {args: ["--json"]} => --json is accepted and changes nothing', () => {
      expect(capacityArgsParseTransformer({ args: ['--json'] })).toStrictEqual({
        specName: null,
        poolSize: null,
      });
    });
  });

  describe('both flags named', () => {
    it('VALID: {--spec dungeonmaster-headless --pool 3} => parses both through', () => {
      expect(
        capacityArgsParseTransformer({
          args: ['--spec', 'dungeonmaster-headless', '--pool', '3'],
        }),
      ).toStrictEqual({ specName: 'dungeonmaster-headless', poolSize: 3 });
    });

    it('VALID: {--pool 1 alone} => the spec stays null while the pool is read', () => {
      expect(capacityArgsParseTransformer({ args: ['--pool', '1'] })).toStrictEqual({
        specName: null,
        poolSize: 1,
      });
    });

    it('VALID: {--spec alone} => the pool stays null while the spec is read', () => {
      expect(capacityArgsParseTransformer({ args: ['--spec', 'dungeonmaster-web'] })).toStrictEqual(
        { specName: 'dungeonmaster-web', poolSize: null },
      );
    });
  });

  describe('refusals', () => {
    it('INVALID: {--human} => refuses by name, capacity ships no table renderer', () => {
      expect(() => capacityArgsParseTransformer({ args: ['--human'] })).toThrow(
        /^Unknown flag: --human/u,
      );
    });

    it('INVALID: {--pool zero} => refuses under the flag with the contract’s own message', () => {
      expect(() => capacityArgsParseTransformer({ args: ['--pool', '0'] })).toThrow(
        /^--pool: .*greater than 0/u,
      );
    });

    it('INVALID: {--pool abc} => refuses under the flag rather than dividing by NaN', () => {
      expect(() => capacityArgsParseTransformer({ args: ['--pool', 'abc'] })).toThrow(/^--pool: /u);
    });

    it('INVALID: {a positional argument} => refuses and says values follow their own flag', () => {
      expect(() => capacityArgsParseTransformer({ args: ['dungeonmaster-web'] })).toThrow(
        /^Unexpected positional argument: dungeonmaster-web/u,
      );
    });

    it('INVALID: {--spec with no value} => refuses naming --spec', () => {
      expect(() => capacityArgsParseTransformer({ args: ['--spec'] })).toThrow(
        /^--spec is required/u,
      );
    });
  });
});
