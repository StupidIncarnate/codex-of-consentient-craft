import { fileScannerBroker } from './file-scanner-broker';
import { fileScannerBrokerProxy } from './file-scanner-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';
import { GlobPatternStub } from '../../../contracts/glob-pattern/glob-pattern.stub';
import { FileTypeStub } from '../../../contracts/file-type/file-type.stub';

describe('fileScannerBroker', () => {
  describe('with valid metadata', () => {
    it('VALID: {} => returns guards with metadata', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = FilePathStub({ value: '/project/src/guards/has-permission-guard.ts' });
      const pattern = GlobPatternStub({ value: '**/*.{ts,tsx}' });
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

      proxy.setupFileWithMetadata({ filepath, contents, pattern });

      const results = await fileScannerBroker({});

      expect(results).toHaveLength(1);
      expect(results[0]?.name).toBe('has-permission-guard');
      expect(results[0]?.purpose).toBe('Validates that user has permission to edit resource');
    });

    it('VALID: {name: "has-permission-guard"} => returns single specific file', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = FilePathStub({ value: '/project/src/guards/has-permission-guard.ts' });
      const pattern = GlobPatternStub({ value: '**/*.{ts,tsx}' });
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

      proxy.setupFileWithMetadata({ filepath, contents, pattern });

      const results = await fileScannerBroker({ name: 'has-permission-guard' });

      expect(results).toHaveLength(1);
      expect(results[0]?.name).toBe('has-permission-guard');
    });
  });

  describe('without metadata', () => {
    it('VALID: files without PURPOSE/USAGE but with exported function => returns file with undefined metadata', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = FilePathStub({ value: '/project/src/transformers/plain-transformer.ts' });
      const pattern = GlobPatternStub({ value: '**/*.{ts,tsx}' });
      const contents = FileContentsStub({
        value: `export const plainTransformer = () => true;`,
      });

      proxy.setupFileWithMetadata({ filepath, contents, pattern });

      const results = await fileScannerBroker({});

      expect(results).toHaveLength(1);
      expect(results[0]?.name).toBe('plain-transformer');
      expect(results[0]?.purpose).toBeUndefined();
      expect(results[0]?.usage).toBeUndefined();
    });
  });

  describe('without signature', () => {
    it('EMPTY: files without exported function => returns empty array', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = FilePathStub({ value: '/project/src/guards/no-export-guard.ts' });
      const pattern = GlobPatternStub({ value: '**/*.{ts,tsx}' });
      const contents = FileContentsStub({
        value: `/**
 * PURPOSE: Validates something
 * USAGE: example
 */
const privateFunction = () => true;`,
      });

      proxy.setupFileWithMetadata({ filepath, contents, pattern });

      const results = await fileScannerBroker({});

      expect(results).toStrictEqual([]);
    });
  });

  describe('with path filter', () => {
    it('VALID: {path: "src/guards"} => returns files from that path only', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = FilePathStub({ value: 'src/guards/has-permission-guard.ts' });
      const path = FilePathStub({ value: 'src/guards' });
      const pattern = GlobPatternStub({ value: 'src/guards/**/*.{ts,tsx}' });
      const contents = FileContentsStub({
        value: `/**
 * PURPOSE: Validates permission
 * USAGE: hasPermissionGuard({ user })
 */
export const hasPermissionGuard = ({ user }: { user?: User }): boolean => true;`,
      });

      proxy.setupFileWithMetadata({ filepath, contents, pattern });

      const results = await fileScannerBroker({ path });

      expect(results).toHaveLength(1);
      expect(results[0]?.name).toBe('has-permission-guard');
    });
  });

  describe('with fileType filter', () => {
    it('VALID: {fileType: "guard"} => returns only guard files', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = FilePathStub({ value: '/project/src/guards/has-permission-guard.ts' });
      const pattern = GlobPatternStub({ value: '**/*.{ts,tsx}' });
      const fileType = FileTypeStub({ value: 'guard' });
      const contents = FileContentsStub({
        value: `/**
 * PURPOSE: Validates permission
 * USAGE: hasPermissionGuard({ user })
 */
export const hasPermissionGuard = ({ user }: { user?: User }): boolean => true;`,
      });

      proxy.setupFileWithMetadata({ filepath, contents, pattern });

      const results = await fileScannerBroker({ fileType });

      expect(results).toHaveLength(1);
      expect(results[0]?.name).toBe('has-permission-guard');
      expect(results[0]?.fileType).toBe('guard');
    });
  });

  describe('with search filter', () => {
    it('VALID: {search: "permission"} => returns files matching search in purpose or name', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = FilePathStub({ value: '/project/src/guards/has-permission-guard.ts' });
      const pattern = GlobPatternStub({ value: '**/*.{ts,tsx}' });
      const contents = FileContentsStub({
        value: `/**
 * PURPOSE: Validates that user has permission to edit resource
 * USAGE: hasPermissionGuard({ user })
 */
export const hasPermissionGuard = ({ user }: { user?: User }): boolean => true;`,
      });

      proxy.setupFileWithMetadata({ filepath, contents, pattern });

      const results = await fileScannerBroker({ search: 'permission' });

      expect(results).toHaveLength(1);
      expect(results[0]?.name).toBe('has-permission-guard');
    });

    it('VALID: {search: "PERMISSION"} => matches case-insensitively', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = FilePathStub({ value: '/project/src/guards/has-permission-guard.ts' });
      const pattern = GlobPatternStub({ value: '**/*.{ts,tsx}' });
      const contents = FileContentsStub({
        value: `/**
 * PURPOSE: Validates that user has permission to edit resource
 * USAGE: hasPermissionGuard({ user })
 */
export const hasPermissionGuard = ({ user }: { user?: User }): boolean => true;`,
      });

      proxy.setupFileWithMetadata({ filepath, contents, pattern });

      const results = await fileScannerBroker({ search: 'PERMISSION' });

      expect(results).toHaveLength(1);
      expect(results[0]?.name).toBe('has-permission-guard');
    });

    it('EMPTY: {search: "nonexistent"} => returns empty array', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = FilePathStub({ value: '/project/src/guards/has-permission-guard.ts' });
      const pattern = GlobPatternStub({ value: '**/*.{ts,tsx}' });
      const contents = FileContentsStub({
        value: `/**
 * PURPOSE: Validates permission
 * USAGE: hasPermissionGuard({ user })
 */
export const hasPermissionGuard = ({ user }: { user?: User }): boolean => true;`,
      });

      proxy.setupFileWithMetadata({ filepath, contents, pattern });

      const results = await fileScannerBroker({ search: 'nonexistent' });

      expect(results).toStrictEqual([]);
    });

    it('VALID: {search: "plain"} => finds files without metadata by name', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = FilePathStub({ value: '/project/src/transformers/plain-transformer.ts' });
      const pattern = GlobPatternStub({ value: '**/*.{ts,tsx}' });
      const contents = FileContentsStub({
        value: `export const plainTransformer = () => true;`,
      });

      proxy.setupFileWithMetadata({ filepath, contents, pattern });

      const results = await fileScannerBroker({ search: 'plain' });

      expect(results).toHaveLength(1);
      expect(results[0]?.name).toBe('plain-transformer');
      expect(results[0]?.purpose).toBeUndefined();
    });
  });

  describe('relatedFiles', () => {
    it('VALID: implementation file with test and proxy => includes both in relatedFiles', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.{ts,tsx}' });

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

      proxy.setupMultipleFiles({
        pattern,
        files: [
          { filepath: implPath, contents: implContents },
          { filepath: testPath, contents: testContents },
          { filepath: proxyPath, contents: proxyContents },
        ],
      });

      const results = await fileScannerBroker({});

      expect(results).toHaveLength(1);
      expect(results[0]?.name).toBe('user-broker');
      expect(results[0]?.relatedFiles).toStrictEqual([
        'user-broker.proxy.ts',
        'user-broker.test.ts',
      ]);
    });

    it('VALID: implementation file with only test => includes test in relatedFiles', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.{ts,tsx}' });

      const implPath = FilePathStub({
        value: '/project/src/guards/has-permission-guard.ts',
      });
      const testPath = FilePathStub({
        value: '/project/src/guards/has-permission-guard.test.ts',
      });

      const implContents = FileContentsStub({
        value: `/**
 * PURPOSE: Checks permissions
 * USAGE: hasPermissionGuard({ user })
 */
export const hasPermissionGuard = ({ user }: { user?: User }): boolean => true;`,
      });

      const testContents = FileContentsStub({
        value: `export const hasPermissionGuardTest = () => { it('works', () => {}); };`,
      });

      proxy.setupMultipleFiles({
        pattern,
        files: [
          { filepath: implPath, contents: implContents },
          { filepath: testPath, contents: testContents },
        ],
      });

      const results = await fileScannerBroker({});

      expect(results).toHaveLength(1);
      expect(results[0]?.name).toBe('has-permission-guard');
      expect(results[0]?.relatedFiles).toStrictEqual(['has-permission-guard.test.ts']);
    });

    it('VALID: implementation file with no related files => relatedFiles is empty', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.{ts,tsx}' });

      const implPath = FilePathStub({
        value: '/project/src/guards/orphan-guard.ts',
      });

      const implContents = FileContentsStub({
        value: `/**
 * PURPOSE: Orphaned guard
 * USAGE: orphanGuard()
 */
export const orphanGuard = (): boolean => true;`,
      });

      proxy.setupMultipleFiles({
        pattern,
        files: [{ filepath: implPath, contents: implContents }],
      });

      const results = await fileScannerBroker({});

      expect(results).toHaveLength(1);
      expect(results[0]?.name).toBe('orphan-guard');
      expect(results[0]?.relatedFiles).toStrictEqual([]);
    });

    it('VALID: relatedFiles are sorted alphabetically', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.{ts,tsx}' });

      const implPath = FilePathStub({
        value: '/project/src/brokers/user-broker.ts',
      });
      const testPath = FilePathStub({
        value: '/project/src/brokers/user-broker.test.ts',
      });
      const proxyPath = FilePathStub({
        value: '/project/src/brokers/user-broker.proxy.ts',
      });
      const stubPath = FilePathStub({
        value: '/project/src/brokers/user-broker.stub.ts',
      });

      const implContents = FileContentsStub({
        value: `/**
 * PURPOSE: User broker
 * USAGE: userBroker()
 */
export const userBroker = (): boolean => true;`,
      });

      const relatedContents = FileContentsStub({
        value: `export const placeholder = () => true;`,
      });

      proxy.setupMultipleFiles({
        pattern,
        files: [
          { filepath: implPath, contents: implContents },
          { filepath: testPath, contents: relatedContents },
          { filepath: proxyPath, contents: relatedContents },
          { filepath: stubPath, contents: relatedContents },
        ],
      });

      const results = await fileScannerBroker({});

      expect(results).toHaveLength(1);
      expect(results[0]?.relatedFiles).toStrictEqual([
        'user-broker.proxy.ts',
        'user-broker.stub.ts',
        'user-broker.test.ts',
      ]);
    });

    it('VALID: test file without exported function => included in relatedFiles', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.{ts,tsx}' });

      const implPath = FilePathStub({
        value: '/project/src/brokers/rule/my-rule-broker.ts',
      });
      const testPath = FilePathStub({
        value: '/project/src/brokers/rule/my-rule-broker.test.ts',
      });

      const implContents = FileContentsStub({
        value: `/**
 * PURPOSE: Custom ESLint rule
 * USAGE: myRuleBroker()
 */
export const myRuleBroker = (): RuleModule => ({ create: () => ({}) });`,
      });

      const testContents = FileContentsStub({
        value: `import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { myRuleBroker } from './my-rule-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('my-rule', myRuleBroker(), {
  valid: [],
  invalid: [],
});`,
      });

      proxy.setupMultipleFiles({
        pattern,
        files: [
          { filepath: implPath, contents: implContents },
          { filepath: testPath, contents: testContents },
        ],
      });

      const results = await fileScannerBroker({});

      expect(results).toHaveLength(1);
      expect(results[0]?.name).toBe('my-rule-broker');
      expect(results[0]?.relatedFiles).toStrictEqual(['my-rule-broker.test.ts']);
    });

    it('VALID: proxy file without exported function => included in relatedFiles', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.{ts,tsx}' });

      const implPath = FilePathStub({
        value: '/project/src/adapters/http/http-adapter.ts',
      });
      const proxyPath = FilePathStub({
        value: '/project/src/adapters/http/http-adapter.proxy.ts',
      });

      const implContents = FileContentsStub({
        value: `/**
 * PURPOSE: HTTP adapter
 * USAGE: httpAdapter({ url })
 */
export const httpAdapter = async ({ url }: { url: string }): Promise<Response> => fetch(url);`,
      });

      const proxyContents = FileContentsStub({
        value: `import axios from 'axios';
jest.mock('axios');

const mockAxios = jest.mocked(axios);
mockAxios.mockResolvedValue({ data: {} });`,
      });

      proxy.setupMultipleFiles({
        pattern,
        files: [
          { filepath: implPath, contents: implContents },
          { filepath: proxyPath, contents: proxyContents },
        ],
      });

      const results = await fileScannerBroker({});

      expect(results).toHaveLength(1);
      expect(results[0]?.name).toBe('http-adapter');
      expect(results[0]?.relatedFiles).toStrictEqual(['http-adapter.proxy.ts']);
    });

    it('VALID: implementation file without exported function => not returned in results', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = GlobPatternStub({ value: '**/*.{ts,tsx}' });

      const implPath = FilePathStub({
        value: '/project/src/utils/helper.ts',
      });

      const implContents = FileContentsStub({
        value: `/**
 * PURPOSE: Helper utilities
 * USAGE: Not applicable
 */
const privateHelper = (): boolean => true;`,
      });

      proxy.setupMultipleFiles({
        pattern,
        files: [{ filepath: implPath, contents: implContents }],
      });

      const results = await fileScannerBroker({});

      expect(results).toStrictEqual([]);
    });
  });
});
