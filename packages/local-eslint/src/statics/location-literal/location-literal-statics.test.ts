import { locationLiteralStatics } from './location-literal-statics';

describe('locationLiteralStatics', () => {
  describe('minRetainedLiteralLength', () => {
    it('VALID: minRetainedLiteralLength => equals 8', () => {
      expect(locationLiteralStatics.minRetainedLiteralLength).toBe(8);
    });
  });

  describe('allowlistPathSubstrings', () => {
    it('VALID: allowlistPathSubstrings => equals the canonical reader list in declared order', () => {
      expect(locationLiteralStatics.allowlistPathSubstrings).toStrictEqual([
        '/packages/shared/src/statics/locations/',
        '/packages/shared/src/brokers/locations/',
      ]);
    });
  });

  describe('allowlistPathRegexSources', () => {
    const toRegex = (source: string): RegExp => new RegExp(source, 'u');
    const anyMatches = (filename: string): boolean =>
      locationLiteralStatics.allowlistPathRegexSources.some((source) =>
        toRegex(source).test(filename),
      );

    it('VALID: .test.ts file => matches at least one allowlist regex', () => {
      expect(anyMatches('/repo/packages/web/src/widgets/foo/foo-widget.test.ts')).toBe(true);
    });

    it('VALID: .stub.ts file => matches at least one allowlist regex', () => {
      expect(anyMatches('/repo/packages/web/src/widgets/foo/foo-widget.stub.ts')).toBe(true);
    });

    it('VALID: .proxy.tsx file => matches at least one allowlist regex', () => {
      expect(anyMatches('/repo/packages/web/src/widgets/foo/foo-widget.proxy.tsx')).toBe(true);
    });

    it('VALID: .integration.test.ts file => matches at least one allowlist regex', () => {
      expect(anyMatches('/repo/packages/web/src/widgets/foo/foo-widget.integration.test.ts')).toBe(
        true,
      );
    });

    it('VALID: .e2e.test.ts file => matches at least one allowlist regex', () => {
      expect(anyMatches('/repo/packages/web/src/widgets/foo/foo-widget.e2e.test.ts')).toBe(true);
    });

    it('VALID: .harness.ts file => matches at least one allowlist regex', () => {
      expect(anyMatches('/repo/packages/web/test/harnesses/foo/foo.harness.ts')).toBe(true);
    });

    it('EMPTY: plain production file => matches no allowlist regex', () => {
      expect(anyMatches('/repo/packages/web/src/widgets/foo/foo-widget.ts')).toBe(false);
    });
  });
});
