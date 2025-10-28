import { fileScannerBroker } from './file-scanner-broker';
import { fileScannerBrokerProxy } from './file-scanner-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';
import { GlobPatternStub } from '../../../contracts/glob-pattern/glob-pattern.stub';

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
 *
 * RELATED: isAdminGuard, canEditPostGuard
 */
export const hasPermissionGuard = ({ user, resource }: { user?: User; resource?: Resource }): boolean => {
  return user?.permissions.includes(resource?.requiredPermission);
};`,
      });

      proxy.setupFileWithMetadata({ filepath, contents, pattern });

      const results = await fileScannerBroker({});

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
 *
 * RELATED: isAdminGuard
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
    it('EMPTY: files without PURPOSE/USAGE/RELATED => returns empty array', async () => {
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
});
