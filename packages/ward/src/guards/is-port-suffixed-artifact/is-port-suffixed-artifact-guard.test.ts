import { isPortSuffixedArtifactGuard } from './is-port-suffixed-artifact-guard';

describe('isPortSuffixedArtifactGuard', () => {
  describe('ward-created artifacts', () => {
    it('VALID: {name: .vite-40000, prefix: .vite-, empty suffix} => true', () => {
      expect(
        isPortSuffixedArtifactGuard({ name: '.vite-40000', prefix: '.vite-', suffix: '' }),
      ).toBe(true);
    });

    it('VALID: {name: 40000, empty prefix and suffix} => true', () => {
      expect(isPortSuffixedArtifactGuard({ name: '40000', prefix: '', suffix: '' })).toBe(true);
    });

    it('VALID: {name carries both a prefix and a suffix} => true', () => {
      expect(
        isPortSuffixedArtifactGuard({
          name: '.ward-playwright-report-40000.json',
          prefix: '.ward-playwright-report-',
          suffix: '.json',
        }),
      ).toBe(true);
    });
  });

  describe('another project’s files, which the sweep must never take', () => {
    // Playwright's DEFAULT outputDir is `test-results/` and names its folders after the spec. A
    // repo that never adopted per-port paths keeps its failure traces here, so this case IS the
    // blast radius.
    it('INVALID: {name: my-spec-renders-chromium, empty prefix} => false', () => {
      expect(
        isPortSuffixedArtifactGuard({ name: 'my-spec-renders-chromium', prefix: '', suffix: '' }),
      ).toBe(false);
    });

    it('INVALID: {name: .vite, the shared cache a stock config writes} => false', () => {
      expect(isPortSuffixedArtifactGuard({ name: '.vite', prefix: '.vite-', suffix: '' })).toBe(
        false,
      );
    });

    it('INVALID: {name: .vite-40000-old, digits then more} => false', () => {
      expect(
        isPortSuffixedArtifactGuard({ name: '.vite-40000-old', prefix: '.vite-', suffix: '' }),
      ).toBe(false);
    });

    it('EMPTY: {name: .vite- with nothing after it} => false', () => {
      expect(isPortSuffixedArtifactGuard({ name: '.vite-', prefix: '.vite-', suffix: '' })).toBe(
        false,
      );
    });

    it('INVALID: {name lacks the prefix entirely} => false', () => {
      expect(
        isPortSuffixedArtifactGuard({ name: 'node_modules', prefix: '.vite-', suffix: '' }),
      ).toBe(false);
    });
  });

  describe('absent arguments', () => {
    it('EMPTY: {no name} => false', () => {
      expect(isPortSuffixedArtifactGuard({ prefix: '.vite-', suffix: '' })).toBe(false);
    });
  });
});
