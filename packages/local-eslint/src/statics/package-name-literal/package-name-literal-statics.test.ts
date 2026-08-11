import { packageNameLiteralStatics } from './package-name-literal-statics';

describe('packageNameLiteralStatics', () => {
  describe('roleBearingPackageNames', () => {
    it('VALID: roleBearingPackageNames => equals the frontend/backend role list in declared order', () => {
      expect(packageNameLiteralStatics.roleBearingPackageNames).toStrictEqual([
        'web',
        'ui',
        'frontend',
        'client',
        'app',
        'desktop',
        'server',
        'backend',
        'api',
      ]);
    });
  });

  describe('workspaceDirNames', () => {
    it('VALID: workspaceDirNames => equals every workspace root directory a monorepo layout uses', () => {
      expect(packageNameLiteralStatics.workspaceDirNames).toStrictEqual([
        'packages',
        'apps',
        'libs',
      ]);
    });
  });

  describe('equalityOperators', () => {
    it('VALID: equalityOperators => equals the four JavaScript equality operators', () => {
      expect(packageNameLiteralStatics.equalityOperators).toStrictEqual(['===', '!==', '==', '!=']);
    });
  });

  describe('membershipTestMethodNames', () => {
    it('VALID: membershipTestMethodNames => equals the value-taking membership methods, with no predicate method among them', () => {
      expect(packageNameLiteralStatics.membershipTestMethodNames).toStrictEqual([
        'includes',
        'indexOf',
        'lastIndexOf',
      ]);
    });
  });

  describe('membershipSetConstructorNames', () => {
    it('VALID: membershipSetConstructorNames => equals the constructors whose purpose is membership', () => {
      expect(packageNameLiteralStatics.membershipSetConstructorNames).toStrictEqual(['Set']);
    });
  });

  describe('transparentExpressionWrapperTypes', () => {
    it("VALID: transparentExpressionWrapperTypes => equals the TypeScript wrappers that change a value's type but not its position", () => {
      expect(packageNameLiteralStatics.transparentExpressionWrapperTypes).toStrictEqual([
        'TSAsExpression',
        'TSSatisfiesExpression',
        'TSNonNullExpression',
      ]);
    });
  });

  describe('allowlistPathSubstrings', () => {
    it('VALID: allowlistPathSubstrings => equals the rule-owned reader list', () => {
      expect(packageNameLiteralStatics.allowlistPathSubstrings).toStrictEqual([
        '/packages/local-eslint/src/',
      ]);
    });
  });

  describe('allowlistPathRegexSources', () => {
    const anyMatches = (filename: string): boolean =>
      packageNameLiteralStatics.allowlistPathRegexSources.some((source) =>
        new RegExp(source, 'u').test(filename),
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
      expect(anyMatches('/repo/packages/server/src/flows/api/api-flow.integration.test.ts')).toBe(
        true,
      );
    });

    it('VALID: .e2e.ts file => matches at least one allowlist regex', () => {
      expect(anyMatches('/repo/packages/web/src/flows/quest/quest.e2e.ts')).toBe(true);
    });

    it('VALID: .harness.ts file => matches at least one allowlist regex', () => {
      expect(anyMatches('/repo/packages/web/test/harnesses/quest/quest.harness.ts')).toBe(true);
    });

    it('EMPTY: plain production file => matches no allowlist regex', () => {
      expect(anyMatches('/repo/packages/web/src/widgets/foo/foo-widget.ts')).toBe(false);
    });
  });
});
