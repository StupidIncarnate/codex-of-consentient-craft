import { capacityArgsParseTransformer } from './capacity-args-parse-transformer';

describe('capacityArgsParseTransformer', () => {
  describe('the bare form', () => {
    it('EMPTY: {args: []} => returns both fields null and isJson false, so the broker reads its knobs', () => {
      expect(capacityArgsParseTransformer({ args: [] })).toStrictEqual({
        specName: null,
        poolSize: null,
        isJson: false,
      });
    });

    it('VALID: {args: ["--json"]} => --json sets isJson to true', () => {
      expect(capacityArgsParseTransformer({ args: ['--json'] })).toStrictEqual({
        specName: null,
        poolSize: null,
        isJson: true,
      });
    });

    it('INVALID: {args: ["--human"]} => --human is refused as an unknown flag', () => {
      expect(() => capacityArgsParseTransformer({ args: ['--human'] })).toThrow(
        /^Unknown flag: --human\n\nAccepted flags: --spec, --pool, --json/u,
      );
    });
  });

  describe('both flags named', () => {
    it('VALID: {--spec dungeonmaster-api --pool 3} => parses both through with isJson false', () => {
      expect(
        capacityArgsParseTransformer({
          args: ['--spec', 'dungeonmaster-api', '--pool', '3'],
        }),
      ).toStrictEqual({ specName: 'dungeonmaster-api', poolSize: 3, isJson: false });
    });

    it('VALID: {--pool 1 alone} => the spec stays null while the pool is read', () => {
      expect(capacityArgsParseTransformer({ args: ['--pool', '1'] })).toStrictEqual({
        specName: null,
        poolSize: 1,
        isJson: false,
      });
    });

    it('VALID: {--spec alone} => the pool stays null while the spec is read', () => {
      expect(
        capacityArgsParseTransformer({ args: ['--spec', 'dungeonmaster-stack'] }),
      ).toStrictEqual({ specName: 'dungeonmaster-stack', poolSize: null, isJson: false });
    });

    it('VALID: {--spec, --pool, --json} => parses spec, pool and isJson true', () => {
      expect(
        capacityArgsParseTransformer({
          args: ['--spec', 'dungeonmaster-stack', '--pool', '2', '--json'],
        }),
      ).toStrictEqual({ specName: 'dungeonmaster-stack', poolSize: 2, isJson: true });
    });
  });

  describe('refusals', () => {
    it('INVALID: {unknown flag} => refuses naming the flag and listing accepted flags', () => {
      expect(() => capacityArgsParseTransformer({ args: ['--bogus'] })).toThrow(
        /^Unknown flag: --bogus/u,
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
      expect(() => capacityArgsParseTransformer({ args: ['dungeonmaster-stack'] })).toThrow(
        /^Unexpected positional argument: dungeonmaster-stack/u,
      );
    });

    it('INVALID: {--spec with no value} => refuses under the flag', () => {
      expect(() => capacityArgsParseTransformer({ args: ['--spec'] })).toThrow(
        /^--spec is required/u,
      );
    });
  });
});
