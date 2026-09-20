import { capacityArgsParseTransformer } from './capacity-args-parse-transformer';

describe('capacityArgsParseTransformer', () => {
  describe('the bare form', () => {
    it('EMPTY: {args: []} => refuses because --spec is required', () => {
      expect(() => capacityArgsParseTransformer({ args: [] })).toThrow(
        /^--spec is required: name the lane spec to calculate capacity against. Capacity calculation depends on spec footprint.\n\nUsage: dungeonmaster siegelense capacity --spec <specName> \[--pool <n>\] \[--json\]/u,
      );
    });

    it('VALID: {args: ["--spec", "dungeonmaster-stack", "--json"]} => --json sets isJson to true', () => {
      expect(
        capacityArgsParseTransformer({ args: ['--spec', 'dungeonmaster-stack', '--json'] }),
      ).toStrictEqual({
        specName: 'dungeonmaster-stack',
        poolSize: null,
        isJson: true,
      });
    });

    it('INVALID: {args: ["--human"]} => --human is refused as an unknown flag', () => {
      expect(() => capacityArgsParseTransformer({ args: ['--human'] })).toThrow(
        /^Unknown flag: --human\n\nAccepted flags: --spec, --pool, --json\n\nUsage: dungeonmaster siegelense capacity --spec <specName> \[--pool <n>\] \[--json\]/u,
      );
    });
  });

  describe('flags named', () => {
    it('VALID: {--spec dungeonmaster-api --pool 3} => parses both through with isJson false', () => {
      expect(
        capacityArgsParseTransformer({
          args: ['--spec', 'dungeonmaster-api', '--pool', '3'],
        }),
      ).toStrictEqual({ specName: 'dungeonmaster-api', poolSize: 3, isJson: false });
    });

    it('INVALID: {--pool 1 alone} => refuses because --spec is required', () => {
      expect(() => capacityArgsParseTransformer({ args: ['--pool', '1'] })).toThrow(
        /^--spec is required/u,
      );
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
      expect(() =>
        capacityArgsParseTransformer({
          args: ['--spec', 'dungeonmaster-stack', '--pool', '0'],
        }),
      ).toThrow(/^--pool: .*greater than 0/u);
    });

    it('INVALID: {--pool abc} => refuses under the flag rather than dividing by NaN', () => {
      expect(() =>
        capacityArgsParseTransformer({
          args: ['--spec', 'dungeonmaster-stack', '--pool', 'abc'],
        }),
      ).toThrow(/^--pool: /u);
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
