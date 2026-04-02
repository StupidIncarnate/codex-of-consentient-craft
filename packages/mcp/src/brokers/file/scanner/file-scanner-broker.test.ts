import { fileScannerBroker } from './file-scanner-broker';
import { fileScannerBrokerProxy } from './file-scanner-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';
import { GlobPatternStub } from '../../../contracts/glob-pattern/glob-pattern.stub';
import { DiscoverInputStub } from '../../../contracts/discover-input/discover-input.stub';

describe('fileScannerBroker', () => {
  describe('no filters', () => {
    it('VALID: {} => returns all matched files with metadata', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = FilePathStub({ value: '/project/src/guards/has-permission-guard.ts' });
      const pattern = GlobPatternStub({ value: '**/*' });
      const contents = FileContentsStub({
        value: `/**
 * PURPOSE: Validates that user has permission to edit resource
 *
 * USAGE:
 * if (hasPermissionGuard({ user, resource })) {
 *   // User can edit
 * }
 */
export const hasPermissionGuard = ({ user, resource }: { user?: User; resource?: Resource }): boolean => {
  return user?.permissions.includes(resource?.requiredPermission);
};`,
      });

      proxy.setupFiles({ files: [{ filepath, contents }], pattern });

      const results = await fileScannerBroker({});

      expect(results).toStrictEqual([
        {
          fileType: 'guard',
          metadata: {},
          name: 'has-permission-guard',
          path: '/project/src/guards/has-permission-guard.ts',
          purpose: 'Validates that user has permission to edit resource',
          relatedFiles: [],
          signature: {
            parameters: [
              {
                name: 'destructured object',
                type: { 'resource?': 'Resource', 'user?': 'User' },
              },
            ],
            raw: 'export const hasPermissionGuard = ({ user, resource }: { user?: User; resource?: Resource }): boolean =>',
            returnType: 'boolean',
          },
          usage: 'if (hasPermissionGuard({ user, resource })) {\n// User can edit\n}',
        },
      ]);
    });

    it('VALID: files without PURPOSE/USAGE => still returned with undefined metadata', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = FilePathStub({ value: '/project/src/transformers/plain-transformer.ts' });
      const pattern = GlobPatternStub({ value: '**/*' });
      const contents = FileContentsStub({
        value: `export const plainTransformer = () => true;`,
      });

      proxy.setupFiles({ files: [{ filepath, contents }], pattern });

      const results = await fileScannerBroker({});

      expect(results).toStrictEqual([
        {
          fileType: 'transformer',
          metadata: undefined,
          name: 'plain-transformer',
          path: '/project/src/transformers/plain-transformer.ts',
          purpose: undefined,
          relatedFiles: [],
          signature: undefined,
          usage: undefined,
        },
      ]);
    });

    it('VALID: files without exported function => still returned (no gate)', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = FilePathStub({ value: '/project/src/guards/no-export-guard.ts' });
      const pattern = GlobPatternStub({ value: '**/*' });
      const contents = FileContentsStub({
        value: `/**
 * PURPOSE: Validates something
 * USAGE: example
 */
const privateFunction = () => true;`,
      });

      proxy.setupFiles({ files: [{ filepath, contents }], pattern });

      const results = await fileScannerBroker({});

      expect(results).toStrictEqual([
        {
          fileType: 'guard',
          metadata: {},
          name: 'no-export-guard',
          path: '/project/src/guards/no-export-guard.ts',
          purpose: 'Validates something',
          relatedFiles: [],
          signature: undefined,
          usage: 'example',
        },
      ]);
    });
  });

  describe('glob filter', () => {
    it('VALID: {glob: "**/*.ts"} => glob with extension used as-is', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = FilePathStub({ value: '/project/src/guards/has-permission-guard.ts' });
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const contents = FileContentsStub({
        value: `/**
 * PURPOSE: Validates permission
 * USAGE: hasPermissionGuard({ user })
 */
export const hasPermissionGuard = ({ user }: { user?: User }): boolean => true;`,
      });
      const { glob } = DiscoverInputStub({ glob: '**/*.ts' });

      proxy.setupFiles({ files: [{ filepath, contents }], pattern });

      const results = await fileScannerBroker({ glob: glob! });

      expect(results).toStrictEqual([
        {
          fileType: 'guard',
          metadata: {},
          name: 'has-permission-guard',
          path: '/project/src/guards/has-permission-guard.ts',
          purpose: 'Validates permission',
          relatedFiles: [],
          signature: {
            parameters: [
              {
                name: 'destructured object',
                type: { 'user?': 'User' },
              },
            ],
            raw: 'export const hasPermissionGuard = ({ user }: { user?: User }): boolean =>',
            returnType: 'boolean',
          },
          usage: 'hasPermissionGuard({ user })',
        },
      ]);
    });
  });

  describe('grep filter', () => {
    it('VALID: {grep: "permission"} => returns files with matching content and hits', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = FilePathStub({ value: '/project/src/guards/has-permission-guard.ts' });
      const pattern = GlobPatternStub({ value: '**/*' });
      const contents = FileContentsStub({
        value: `/**
 * PURPOSE: Validates permission
 * USAGE: hasPermissionGuard({ user })
 */
export const hasPermissionGuard = ({ user }: { user?: User }): boolean => true;`,
      });
      const { grep } = DiscoverInputStub({ grep: 'permission' });

      proxy.setupFiles({ files: [{ filepath, contents }], pattern });

      const results = await fileScannerBroker({ grep: grep! });

      expect(results).toStrictEqual([
        {
          fileType: 'guard',
          hits: [{ line: 2, text: ' * PURPOSE: Validates permission' }],
          metadata: {},
          name: 'has-permission-guard',
          path: '/project/src/guards/has-permission-guard.ts',
          purpose: 'Validates permission',
          relatedFiles: [],
          signature: {
            parameters: [
              {
                name: 'destructured object',
                type: { 'user?': 'User' },
              },
            ],
            raw: 'export const hasPermissionGuard = ({ user }: { user?: User }): boolean =>',
            returnType: 'boolean',
          },
          usage: 'hasPermissionGuard({ user })',
        },
      ]);
    });

    it('EMPTY: {grep: "nonexistent"} => returns empty array', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = FilePathStub({ value: '/project/src/guards/has-permission-guard.ts' });
      const pattern = GlobPatternStub({ value: '**/*' });
      const contents = FileContentsStub({
        value: `export const hasPermissionGuard = (): boolean => true;`,
      });
      const { grep } = DiscoverInputStub({ grep: 'nonexistent' });

      proxy.setupFiles({ files: [{ filepath, contents }], pattern });

      const results = await fileScannerBroker({ grep: grep! });

      expect(results).toStrictEqual([]);
    });

    it('VALID: {grep: "ERROR", context: 1} => returns hits with context lines', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = FilePathStub({ value: '/project/src/adapters/fs-access-adapter.ts' });
      const pattern = GlobPatternStub({ value: '**/*' });
      const contents = FileContentsStub({
        value: `line1
line2
ERROR here
line4
line5`,
      });
      const { grep, context } = DiscoverInputStub({ grep: 'ERROR', context: 1 });

      proxy.setupFiles({ files: [{ filepath, contents }], pattern });

      const results = await fileScannerBroker({ grep: grep!, context: context! });

      expect(results).toStrictEqual([
        {
          fileType: 'adapter',
          hits: [
            { line: 2, text: 'line2' },
            { line: 3, text: 'ERROR here' },
            { line: 4, text: 'line4' },
          ],
          metadata: undefined,
          name: 'fs-access-adapter',
          path: '/project/src/adapters/fs-access-adapter.ts',
          purpose: undefined,
          relatedFiles: [],
          signature: undefined,
          usage: undefined,
        },
      ]);
    });
  });

  describe('multi-dot files as regular results', () => {
    it('VALID: test and proxy files => appear as standalone results with companion linking', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*' });

      const implPath = FilePathStub({
        value: '/project/src/brokers/user-broker.ts',
      });
      const testPath = FilePathStub({
        value: '/project/src/brokers/user-broker.test.ts',
      });
      const proxyPath = FilePathStub({
        value: '/project/src/brokers/user-broker.proxy.ts',
      });

      const implContents = FileContentsStub({
        value: `/**
 * PURPOSE: Manages user operations
 * USAGE: userBroker({ userId })
 */
export const userBroker = ({ userId }: { userId: string }): boolean => true;`,
      });

      const testContents = FileContentsStub({
        value: `export const userBrokerTest = () => { it('works', () => {}); };`,
      });

      const proxyContents = FileContentsStub({
        value: `export const userBrokerProxy = () => ({ mock: jest.fn() });`,
      });

      proxy.setupFiles({
        pattern,
        files: [
          { filepath: implPath, contents: implContents },
          { filepath: testPath, contents: testContents },
          { filepath: proxyPath, contents: proxyContents },
        ],
      });

      const results = await fileScannerBroker({});

      const implResult = results.filter((r) => r.path === '/project/src/brokers/user-broker.ts');

      expect(implResult).toStrictEqual([
        {
          fileType: 'broker',
          metadata: {},
          name: 'user-broker',
          path: '/project/src/brokers/user-broker.ts',
          purpose: 'Manages user operations',
          relatedFiles: ['user-broker.proxy.ts', 'user-broker.test.ts'],
          signature: {
            parameters: [
              {
                name: 'destructured object',
                type: { userId: 'string' },
              },
            ],
            raw: 'export const userBroker = ({ userId }: { userId: string }): boolean =>',
            returnType: 'boolean',
          },
          usage: 'userBroker({ userId })',
        },
      ]);
    });
  });

  describe('relatedFiles enrichment', () => {
    it('VALID: implementation with multiple multi-dot companions => all appear in relatedFiles sorted', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*' });

      const implPath = FilePathStub({ value: '/project/src/brokers/data-broker.ts' });
      const testPath = FilePathStub({ value: '/project/src/brokers/data-broker.test.ts' });
      const proxyPath = FilePathStub({ value: '/project/src/brokers/data-broker.proxy.ts' });
      const stubPath = FilePathStub({ value: '/project/src/brokers/data-broker.stub.ts' });

      const implContents = FileContentsStub({
        value: `export const dataBroker = (): boolean => true;`,
      });
      const testContents = FileContentsStub({
        value: `export const dataBrokerTest = () => {};`,
      });
      const proxyContents = FileContentsStub({
        value: `export const dataBrokerProxy = () => {};`,
      });
      const stubContents = FileContentsStub({
        value: `export const dataBrokerStub = () => {};`,
      });

      proxy.setupFiles({
        pattern,
        files: [
          { filepath: implPath, contents: implContents },
          { filepath: testPath, contents: testContents },
          { filepath: proxyPath, contents: proxyContents },
          { filepath: stubPath, contents: stubContents },
        ],
      });

      const results = await fileScannerBroker({});

      const implResult = results.filter((r) => r.path === '/project/src/brokers/data-broker.ts');

      expect(implResult).toStrictEqual([
        {
          fileType: 'broker',
          metadata: undefined,
          name: 'data-broker',
          path: '/project/src/brokers/data-broker.ts',
          purpose: undefined,
          relatedFiles: ['data-broker.proxy.ts', 'data-broker.stub.ts', 'data-broker.test.ts'],
          signature: {
            parameters: [],
            raw: 'export const dataBroker = (): boolean =>',
            returnType: 'boolean',
          },
          usage: undefined,
        },
      ]);
    });

    it('VALID: implementation with no related files => relatedFiles is empty', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*' });
      const filepath = FilePathStub({ value: '/project/src/guards/orphan-guard.ts' });
      const contents = FileContentsStub({
        value: `/**
 * PURPOSE: Orphaned guard
 * USAGE: orphanGuard()
 */
export const orphanGuard = (): boolean => true;`,
      });

      proxy.setupFiles({ files: [{ filepath, contents }], pattern });

      const results = await fileScannerBroker({});

      expect(results).toStrictEqual([
        {
          fileType: 'guard',
          metadata: {},
          name: 'orphan-guard',
          path: '/project/src/guards/orphan-guard.ts',
          purpose: 'Orphaned guard',
          relatedFiles: [],
          signature: {
            parameters: [],
            raw: 'export const orphanGuard = (): boolean =>',
            returnType: 'boolean',
          },
          usage: 'orphanGuard()',
        },
      ]);
    });
  });

  describe('empty results', () => {
    it('EMPTY: no files matched => returns empty array', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*' });

      proxy.setupFiles({ files: [], pattern });

      const results = await fileScannerBroker({});

      expect(results).toStrictEqual([]);
    });
  });

  describe('sorting', () => {
    it('VALID: multiple files => sorted alphabetically by name', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*' });

      const fileZ = FilePathStub({ value: '/project/src/guards/zebra-guard.ts' });
      const fileA = FilePathStub({ value: '/project/src/guards/alpha-guard.ts' });
      const fileM = FilePathStub({ value: '/project/src/guards/middle-guard.ts' });

      const contentsZ = FileContentsStub({
        value: `export const zebraGuard = (): boolean => true;`,
      });
      const contentsA = FileContentsStub({
        value: `export const alphaGuard = (): boolean => true;`,
      });
      const contentsM = FileContentsStub({
        value: `export const middleGuard = (): boolean => true;`,
      });

      proxy.setupFiles({
        files: [
          { filepath: fileZ, contents: contentsZ },
          { filepath: fileA, contents: contentsA },
          { filepath: fileM, contents: contentsM },
        ],
        pattern,
      });

      const results = await fileScannerBroker({});

      expect(results).toStrictEqual([
        {
          fileType: 'guard',
          metadata: undefined,
          name: 'alpha-guard',
          path: '/project/src/guards/alpha-guard.ts',
          purpose: undefined,
          relatedFiles: [],
          signature: {
            parameters: [],
            raw: 'export const alphaGuard = (): boolean =>',
            returnType: 'boolean',
          },
          usage: undefined,
        },
        {
          fileType: 'guard',
          metadata: undefined,
          name: 'middle-guard',
          path: '/project/src/guards/middle-guard.ts',
          purpose: undefined,
          relatedFiles: [],
          signature: {
            parameters: [],
            raw: 'export const middleGuard = (): boolean =>',
            returnType: 'boolean',
          },
          usage: undefined,
        },
        {
          fileType: 'guard',
          metadata: undefined,
          name: 'zebra-guard',
          path: '/project/src/guards/zebra-guard.ts',
          purpose: undefined,
          relatedFiles: [],
          signature: {
            parameters: [],
            raw: 'export const zebraGuard = (): boolean =>',
            returnType: 'boolean',
          },
          usage: undefined,
        },
      ]);
    });
  });

  describe('glob + grep combined', () => {
    it('VALID: {glob, grep} => glob filters files, grep filters contents', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const matchingFile = FilePathStub({ value: '/project/src/guards/permission-guard.ts' });
      const nonMatchingFile = FilePathStub({ value: '/project/src/guards/other-guard.ts' });

      const matchingContents = FileContentsStub({
        value: `export const permissionGuard = (): boolean => checkPermission();`,
      });
      const nonMatchingContents = FileContentsStub({
        value: `export const otherGuard = (): boolean => true;`,
      });

      const { glob, grep } = DiscoverInputStub({ glob: '**/*.ts', grep: 'checkPermission' });

      proxy.setupFiles({
        files: [
          { filepath: matchingFile, contents: matchingContents },
          { filepath: nonMatchingFile, contents: nonMatchingContents },
        ],
        pattern,
      });

      const results = await fileScannerBroker({ glob: glob!, grep: grep! });

      expect(results).toStrictEqual([
        {
          fileType: 'guard',
          hits: [
            { line: 1, text: 'export const permissionGuard = (): boolean => checkPermission();' },
          ],
          metadata: undefined,
          name: 'permission-guard',
          path: '/project/src/guards/permission-guard.ts',
          purpose: undefined,
          relatedFiles: [],
          signature: {
            parameters: [],
            raw: 'export const permissionGuard = (): boolean =>',
            returnType: 'boolean',
          },
          usage: undefined,
        },
      ]);
    });
  });
});
