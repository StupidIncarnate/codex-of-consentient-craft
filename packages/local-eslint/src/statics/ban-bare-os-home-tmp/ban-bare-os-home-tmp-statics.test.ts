import { banBareOsHomeTmpStatics } from './ban-bare-os-home-tmp-statics';

describe('banBareOsHomeTmpStatics', () => {
  describe('osModule', () => {
    it('VALID: specifiers => equals the os and node:os module specifiers', () => {
      expect(banBareOsHomeTmpStatics.osModule.specifiers).toStrictEqual(['os', 'node:os']);
    });

    it('VALID: requireIdentifierName => equals "require"', () => {
      expect(banBareOsHomeTmpStatics.osModule.requireIdentifierName).toBe('require');
    });
  });

  describe('functionNames', () => {
    it('VALID: functionNames => equals the two tracked os function names', () => {
      expect(banBareOsHomeTmpStatics.functionNames).toStrictEqual(['homedir', 'tmpdir']);
    });
  });

  describe('allowlist', () => {
    it('VALID: adaptersPathSubstring => equals the OS adapter layer substring', () => {
      expect(banBareOsHomeTmpStatics.allowlist.adaptersPathSubstring).toBe('/src/adapters/os/');
    });

    it('VALID: tmpdirOnlyPathSubstrings => equals the harnesses directory substring', () => {
      expect(banBareOsHomeTmpStatics.allowlist.tmpdirOnlyPathSubstrings).toStrictEqual([
        '/test/harnesses/',
      ]);
    });

    it('VALID: tmpdirOnlyPathRegexSources => equals the harness-suffix and playwright-config regex sources', () => {
      expect(banBareOsHomeTmpStatics.allowlist.tmpdirOnlyPathRegexSources).toStrictEqual([
        '\\.harness\\.ts$',
        '/packages/[^/]+/playwright\\.config\\.ts$',
      ]);
    });
  });
});
