import { workspacePackageJsonContract } from './workspace-package-json-contract';
import { WorkspacePackageJsonStub } from './workspace-package-json.stub';

describe('workspacePackageJsonContract', () => {
  describe('workspace root shape', () => {
    it('VALID: {name, workspaces: array} => parses successfully', () => {
      const result = workspacePackageJsonContract.parse({
        name: 'dungeonmaster',
        workspaces: ['packages/*'],
      });

      expect(result).toStrictEqual({ name: 'dungeonmaster', workspaces: ['packages/*'] });
    });

    it('VALID: {name, workspaces: object} => parses successfully', () => {
      const result = workspacePackageJsonContract.parse({
        name: 'acme-app',
        workspaces: { packages: ['packages/*'] },
      });

      expect(result).toStrictEqual({
        name: 'acme-app',
        workspaces: { packages: ['packages/*'] },
      });
    });
  });

  describe('sibling package shape', () => {
    it('VALID: {name, exports with source} => parses successfully', () => {
      const packageJson = WorkspacePackageJsonStub({
        name: '@dungeonmaster/bin',
        exports: { './testing': { source: './src/testing/index.ts' } },
      });

      const result = workspacePackageJsonContract.parse(packageJson);

      expect(result).toStrictEqual({
        name: '@dungeonmaster/bin',
        exports: { './testing': { source: './src/testing/index.ts' } },
      });
    });

    it('VALID: {name, exports, extra fields} => keeps extra fields via passthrough', () => {
      const result = workspacePackageJsonContract.parse({
        name: '@dungeonmaster/shared',
        exports: { './testing': { source: './testing.ts' } },
        version: '0.1.0',
      });

      expect(result).toStrictEqual({
        name: '@dungeonmaster/shared',
        exports: { './testing': { source: './testing.ts' } },
        version: '0.1.0',
      });
    });

    it('VALID: {exports entry with no source} => keeps its other fields via passthrough', () => {
      const result = workspacePackageJsonContract.parse({
        name: '@dungeonmaster/npm',
        exports: { './axios': { import: './dist/axios/index.js' } },
      });

      expect(result).toStrictEqual({
        name: '@dungeonmaster/npm',
        exports: { './axios': { import: './dist/axios/index.js' } },
      });
    });

    it('VALID: {exports entry with a bare string target} => parses successfully', () => {
      const result = workspacePackageJsonContract.parse({
        name: '@dungeonmaster/testing',
        exports: { './jest-config-base': './jest-config-base.js' },
      });

      expect(result).toStrictEqual({
        name: '@dungeonmaster/testing',
        exports: { './jest-config-base': './jest-config-base.js' },
      });
    });
  });

  describe('importing package shape', () => {
    it('VALID: {imports entry with a bare string target} => parses successfully', () => {
      const result = workspacePackageJsonContract.parse({
        name: '@dungeonmaster/mcp',
        imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
      });

      expect(result).toStrictEqual({
        name: '@dungeonmaster/mcp',
        imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
      });
    });

    it('VALID: {imports entry with a conditions-object target} => parses successfully', () => {
      const result = workspacePackageJsonContract.parse({
        name: '@dungeonmaster/mcp',
        imports: {
          '#gateway/npm/*': { source: '@dungeonmaster/npm/*', import: '@dungeonmaster/npm/*' },
        },
      });

      expect(result).toStrictEqual({
        name: '@dungeonmaster/mcp',
        imports: {
          '#gateway/npm/*': { source: '@dungeonmaster/npm/*', import: '@dungeonmaster/npm/*' },
        },
      });
    });

    it('VALID: {imports conditions-object entry, extra condition} => keeps it via passthrough', () => {
      const result = workspacePackageJsonContract.parse({
        name: '@dungeonmaster/mcp',
        imports: { '#gateway/npm/*': { node: '@dungeonmaster/npm/*' } },
      });

      expect(result).toStrictEqual({
        name: '@dungeonmaster/mcp',
        imports: { '#gateway/npm/*': { node: '@dungeonmaster/npm/*' } },
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {name: 123} => safeParse fails', () => {
      const result = workspacePackageJsonContract.safeParse({ name: 123 });

      expect(result.success).toBe(false);
    });

    it('INVALID: {exports entry source: 123} => safeParse fails', () => {
      const result = workspacePackageJsonContract.safeParse({
        name: '@dungeonmaster/bin',
        exports: { './testing': { source: 123 } },
      });

      expect(result.success).toBe(false);
    });

    it('INVALID: {imports entry target: 123} => safeParse fails', () => {
      const result = workspacePackageJsonContract.safeParse({
        name: '@dungeonmaster/mcp',
        imports: { '#gateway/npm/*': 123 },
      });

      expect(result.success).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {} => parses to an empty object', () => {
      const result = workspacePackageJsonContract.parse({});

      expect(result).toStrictEqual({});
    });
  });
});
