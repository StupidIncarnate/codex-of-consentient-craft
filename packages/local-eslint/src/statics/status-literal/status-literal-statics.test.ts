import { statusLiteralStatics } from './status-literal-statics';

describe('statusLiteralStatics', () => {
  describe('minimumInlineStatusSetMembers', () => {
    it('VALID: minimumInlineStatusSetMembers => equals 2', () => {
      expect(statusLiteralStatics.minimumInlineStatusSetMembers).toBe(2);
    });
  });

  describe('bannedStartsWithPrefixes', () => {
    it('VALID: bannedStartsWithPrefixes => equals [seek_, explore_, review_] in declared order', () => {
      expect(statusLiteralStatics.bannedStartsWithPrefixes).toStrictEqual([
        'seek_',
        'explore_',
        'review_',
      ]);
    });
  });

  describe('defaultStatusHolderIdentifiers', () => {
    it('VALID: defaultStatusHolderIdentifiers => equals the expected holder list in declared order', () => {
      expect(statusLiteralStatics.defaultStatusHolderIdentifiers).toStrictEqual([
        'quest',
        'workItem',
        'wi',
        'item',
        'input',
        'postResult',
      ]);
    });
  });

  describe('statusHolderIdentifierSuffixPattern', () => {
    it('VALID: myQuest => matches the suffix pattern', () => {
      const regex = new RegExp(statusLiteralStatics.statusHolderIdentifierSuffixPattern, 'u');

      expect(regex.test('myQuest')).toBe(true);
    });

    it('VALID: workItem => matches the suffix pattern', () => {
      const regex = new RegExp(statusLiteralStatics.statusHolderIdentifierSuffixPattern, 'u');

      expect(regex.test('workItem')).toBe(true);
    });

    it('VALID: SomeItem => matches the suffix pattern', () => {
      const regex = new RegExp(statusLiteralStatics.statusHolderIdentifierSuffixPattern, 'u');

      expect(regex.test('SomeItem')).toBe(true);
    });

    it('INVALID: randomVar => does not match the suffix pattern', () => {
      const regex = new RegExp(statusLiteralStatics.statusHolderIdentifierSuffixPattern, 'u');

      expect(regex.test('randomVar')).toBe(false);
    });
  });

  describe('allowlistPathSubstrings', () => {
    it('VALID: allowlistPathSubstrings => equals the exhaustive list in declared order', () => {
      expect(statusLiteralStatics.allowlistPathSubstrings).toStrictEqual([
        '/packages/shared/src/statics/quest-status-transitions/',
        '/packages/orchestrator/src/transformers/quest-completeness-for-transition/',
        '/packages/orchestrator/src/statics/quest-hydrate-strategy/',
      ]);
    });
  });

  describe('allowlistPathRegexSources', () => {
    const toRegex = (source: string): RegExp => new RegExp(source, 'u');
    const anyMatches = (filename: string): boolean =>
      statusLiteralStatics.allowlistPathRegexSources.some((source) =>
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

    it('VALID: prompt statics folder => matches at least one allowlist regex', () => {
      expect(
        anyMatches('/repo/packages/orchestrator/src/statics/pathseeker-prompt/foo-statics.ts'),
      ).toBe(true);
    });

    it('VALID: quest-status-guard source file => matches at least one allowlist regex', () => {
      expect(
        anyMatches(
          '/repo/packages/shared/src/guards/is-terminal-quest-status/is-terminal-quest-status-guard.ts',
        ),
      ).toBe(true);
    });

    it('VALID: work-item-status-guard source file => matches at least one allowlist regex', () => {
      expect(
        anyMatches(
          '/repo/packages/shared/src/guards/is-active-work-item-status/is-active-work-item-status-guard.ts',
        ),
      ).toBe(true);
    });

    it('EMPTY: plain production file => matches no allowlist regex', () => {
      expect(anyMatches('/repo/packages/web/src/widgets/foo/foo-widget.ts')).toBe(false);
    });
  });
});
