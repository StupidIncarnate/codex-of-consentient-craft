import { workspacePackageImportsTargetTransformer } from './workspace-package-imports-target-transformer';
import { WorkspacePackageJsonStub } from '../../contracts/workspace-package-json/workspace-package-json.stub';

describe('workspacePackageImportsTargetTransformer', () => {
  describe('literal imports key', () => {
    it('VALID: {specifier: "#gateway/npm/_test_/glob", literal key, string target} => returns the target', () => {
      const { imports: importsMap } = WorkspacePackageJsonStub({
        imports: { '#gateway/npm/_test_/glob': '@dungeonmaster/npm/_test_/glob' },
      });
      const specifier = '#gateway/npm/_test_/glob';

      const result = workspacePackageImportsTargetTransformer({ importsMap, specifier });

      expect(result).toBe('@dungeonmaster/npm/_test_/glob');
    });
  });

  describe('wildcard imports key', () => {
    it('VALID: {specifier: "#gateway/npm/_test_/glob", "#gateway/npm/*" -> "@dungeonmaster/npm/*"} => substitutes the captured segment', () => {
      const { imports: importsMap } = WorkspacePackageJsonStub({
        imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
      });
      const specifier = '#gateway/npm/_test_/glob';

      const result = workspacePackageImportsTargetTransformer({ importsMap, specifier });

      expect(result).toBe('@dungeonmaster/npm/_test_/glob');
    });

    it('VALID: {specifier: "#gateway/npm/glob"} => substitutes a different captured segment', () => {
      const { imports: importsMap } = WorkspacePackageJsonStub({
        imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
      });
      const specifier = '#gateway/npm/glob';

      const result = workspacePackageImportsTargetTransformer({ importsMap, specifier });

      expect(result).toBe('@dungeonmaster/npm/glob');
    });

    it('VALID: {literal AND wildcard both present} => the literal key wins', () => {
      const { imports: importsMap } = WorkspacePackageJsonStub({
        imports: {
          '#gateway/npm/_test_/glob': '@dungeonmaster/npm/_test_literal_',
          '#gateway/npm/*': '@dungeonmaster/npm/*',
        },
      });
      const specifier = '#gateway/npm/_test_/glob';

      const result = workspacePackageImportsTargetTransformer({ importsMap, specifier });

      expect(result).toBe('@dungeonmaster/npm/_test_literal_');
    });
  });

  describe('conditions-object target', () => {
    it('VALID: {source and import both present} => picks source', () => {
      const { imports: importsMap } = WorkspacePackageJsonStub({
        imports: {
          '#gateway/npm/*': {
            source: '@dungeonmaster/npm-source/*',
            import: '@dungeonmaster/npm-import/*',
          },
        },
      });
      const specifier = '#gateway/npm/_test_/glob';

      const result = workspacePackageImportsTargetTransformer({ importsMap, specifier });

      expect(result).toBe('@dungeonmaster/npm-source/_test_/glob');
    });

    it('VALID: {no source, import and require both present} => falls back to import', () => {
      const { imports: importsMap } = WorkspacePackageJsonStub({
        imports: {
          '#gateway/npm/*': {
            import: '@dungeonmaster/npm-import/*',
            require: '@dungeonmaster/npm-require/*',
          },
        },
      });
      const specifier = '#gateway/npm/_test_/glob';

      const result = workspacePackageImportsTargetTransformer({ importsMap, specifier });

      expect(result).toBe('@dungeonmaster/npm-import/_test_/glob');
    });

    it('VALID: {no source or import, require and default both present} => falls back to require', () => {
      const { imports: importsMap } = WorkspacePackageJsonStub({
        imports: {
          '#gateway/npm/*': {
            require: '@dungeonmaster/npm-require/*',
            default: '@dungeonmaster/npm-default/*',
          },
        },
      });
      const specifier = '#gateway/npm/_test_/glob';

      const result = workspacePackageImportsTargetTransformer({ importsMap, specifier });

      expect(result).toBe('@dungeonmaster/npm-require/_test_/glob');
    });

    it('VALID: {only default present} => falls back to default', () => {
      const { imports: importsMap } = WorkspacePackageJsonStub({
        imports: { '#gateway/npm/*': { default: '@dungeonmaster/npm-default/*' } },
      });
      const specifier = '#gateway/npm/_test_/glob';

      const result = workspacePackageImportsTargetTransformer({ importsMap, specifier });

      expect(result).toBe('@dungeonmaster/npm-default/_test_/glob');
    });

    it('INVALID: {conditions object has no known condition} => returns null', () => {
      const { imports: importsMap } = WorkspacePackageJsonStub({
        imports: { '#gateway/npm/*': {} },
      });
      const specifier = '#gateway/npm/_test_/glob';

      const result = workspacePackageImportsTargetTransformer({ importsMap, specifier });

      expect(result).toBe(null);
    });
  });

  describe('no match', () => {
    it('INVALID: {specifier: "#foo", no matching key} => returns null', () => {
      const { imports: importsMap } = WorkspacePackageJsonStub({
        imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
      });
      const specifier = '#foo';

      const result = workspacePackageImportsTargetTransformer({ importsMap, specifier });

      expect(result).toBe(null);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {importsMap: undefined} => returns null', () => {
      const specifier = '#gateway/npm/_test_/glob';

      const result = workspacePackageImportsTargetTransformer({
        importsMap: undefined,
        specifier,
      });

      expect(result).toBe(null);
    });
  });
});
