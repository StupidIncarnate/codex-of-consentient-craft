import { profileArgsParseTransformer } from './profile-args-parse-transformer';

describe('profileArgsParseTransformer', () => {
  describe('the spec is named', () => {
    it('VALID: {--spec dungeonmaster-stack} => returns the spec with isJson false', () => {
      expect(
        profileArgsParseTransformer({ args: ['--spec', 'dungeonmaster-stack'] }),
      ).toStrictEqual({
        specName: 'dungeonmaster-stack',
        isJson: false,
      });
    });

    it('VALID: {--spec dungeonmaster-api --json} => returns the spec with isJson true', () => {
      expect(
        profileArgsParseTransformer({ args: ['--spec', 'dungeonmaster-api', '--json'] }),
      ).toStrictEqual({
        specName: 'dungeonmaster-api',
        isJson: true,
      });
    });

    it('VALID: {--json before --spec} => flag order does not matter', () => {
      expect(
        profileArgsParseTransformer({ args: ['--json', '--spec', 'dungeonmaster-stack'] }),
      ).toStrictEqual({
        specName: 'dungeonmaster-stack',
        isJson: true,
      });
    });

    it('INVALID: {--spec dungeonmaster-stack --human} => refuses --human as an unknown flag', () => {
      expect(() =>
        profileArgsParseTransformer({ args: ['--spec', 'dungeonmaster-stack', '--human'] }),
      ).toThrow(/Unknown flag: --human\n\nAccepted flags: --spec, --json/u);
    });
  });

  describe('the spec is missing', () => {
    it('EMPTY: {no args} => refuses, naming --spec and why there is no fleet-wide form', () => {
      expect(() => profileArgsParseTransformer({ args: [] })).toThrow(
        /--spec is required: name the lane spec to profile\./u,
      );
    });

    it('INVALID: {--spec with no value} => refuses naming --spec', () => {
      expect(() => profileArgsParseTransformer({ args: ['--spec'] })).toThrow(
        /--spec is required: it cannot be missing/u,
      );
    });

    it('INVALID: {--spec followed by another flag} => refuses rather than reading --json as the spec name', () => {
      expect(() => profileArgsParseTransformer({ args: ['--spec', '--json'] })).toThrow(
        /--spec is required: it cannot be missing/u,
      );
    });
  });

  describe('refused argv', () => {
    it('INVALID: {unknown flag} => refuses as an unknown flag, listing what is accepted', () => {
      expect(() =>
        profileArgsParseTransformer({ args: ['--spec', 'dungeonmaster-stack', '--bogus'] }),
      ).toThrow(/Unknown flag: --bogus\n\nAccepted flags: --spec, --json/u);
    });

    it('INVALID: {a bare positional} => refuses, every value must follow its flag', () => {
      expect(() => profileArgsParseTransformer({ args: ['dungeonmaster-stack'] })).toThrow(
        /Unexpected positional argument: dungeonmaster-stack/u,
      );
    });

    it('INVALID: {--spec twice} => refuses rather than choosing one', () => {
      expect(() =>
        profileArgsParseTransformer({
          args: ['--spec', 'dungeonmaster-stack', '--spec', 'dungeonmaster-api'],
        }),
      ).toThrow(/--spec was given twice/u);
    });
  });
});
