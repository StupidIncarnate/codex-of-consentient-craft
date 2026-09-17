import { profileArgsParseTransformer } from './profile-args-parse-transformer';

describe('profileArgsParseTransformer', () => {
  describe('the spec is named', () => {
    it('VALID: {--spec dungeonmaster-web} => returns "dungeonmaster-web"', () => {
      expect(profileArgsParseTransformer({ args: ['--spec', 'dungeonmaster-web'] })).toBe(
        'dungeonmaster-web',
      );
    });

    it('VALID: {--spec dungeonmaster-headless --json} => returns the spec, --json being the default anyway', () => {
      expect(
        profileArgsParseTransformer({ args: ['--spec', 'dungeonmaster-headless', '--json'] }),
      ).toBe('dungeonmaster-headless');
    });

    it('VALID: {--json before --spec} => flag order does not matter', () => {
      expect(profileArgsParseTransformer({ args: ['--json', '--spec', 'dungeonmaster-web'] })).toBe(
        'dungeonmaster-web',
      );
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
    it('INVALID: {--human} => refuses as an unknown flag, listing what is accepted', () => {
      expect(() =>
        profileArgsParseTransformer({ args: ['--spec', 'dungeonmaster-web', '--human'] }),
      ).toThrow(/Unknown flag: --human\n\nAccepted flags: --spec, --json/u);
    });

    it('INVALID: {a bare positional} => refuses, every value must follow its flag', () => {
      expect(() => profileArgsParseTransformer({ args: ['dungeonmaster-web'] })).toThrow(
        /Unexpected positional argument: dungeonmaster-web/u,
      );
    });

    it('INVALID: {--spec twice} => refuses rather than choosing one', () => {
      expect(() =>
        profileArgsParseTransformer({
          args: ['--spec', 'dungeonmaster-web', '--spec', 'dungeonmaster-headless'],
        }),
      ).toThrow(/--spec was given twice/u);
    });
  });
});
