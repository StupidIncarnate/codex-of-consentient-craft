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
    it('EMPTY: files without PURPOSE/USAGE => returns empty array', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = FilePathStub({ value: '/project/src/guards/plain-guard.ts' });
      const pattern = GlobPatternStub({ value: '**/*.{ts,tsx}' });
      const contents = FileContentsStub({
        value: `export const plainGuard = () => true;`,
      });

      proxy.setupFileWithMetadata({ filepath, contents, pattern });

      const results = await fileScannerBroker({});

      expect(results).toStrictEqual([]);
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
  });
});
