import type { FolderType } from '../../contracts/folder-type/folder-type-contract';
import { folderTypeTransformer } from './folder-type-transformer';

describe('folderTypeTransformer', () => {
  describe('valid folder type extraction', () => {
    it('VALID: broker path returns brokers', () => {
      const result = folderTypeTransformer({
        filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      });

      expect(result).toBe('brokers');
    });

    it('VALID: contract path returns contracts', () => {
      const result = folderTypeTransformer({
        filename: '/project/src/contracts/user/user-contract.ts',
      });

      expect(result).toBe('contracts');
    });

    it('VALID: transformer path returns transformers', () => {
      const result = folderTypeTransformer({
        filename: '/project/packages/eslint-plugin/src/transformers/foo.ts',
      });

      expect(result).toBe('transformers');
    });

    it('VALID: guards path returns guards', () => {
      const result = folderTypeTransformer({
        filename: '/project/src/guards/user/user-guard.ts',
      });

      expect(result).toBe('guards');
    });

    it('VALID: statics path returns statics', () => {
      const result = folderTypeTransformer({
        filename: '/project/src/statics/config/app-config-static.ts',
      });

      expect(result).toBe('statics');
    });

    it('VALID: errors path returns errors', () => {
      const result = folderTypeTransformer({
        filename: '/project/src/errors/validation/validation-error.ts',
      });

      expect(result).toBe('errors');
    });

    it('VALID: flows path returns flows', () => {
      const result = folderTypeTransformer({
        filename: '/project/src/flows/auth/login-flow.ts',
      });

      expect(result).toBe('flows');
    });

    it('VALID: adapters path returns adapters', () => {
      const result = folderTypeTransformer({
        filename: '/project/src/adapters/api/api-adapter.ts',
      });

      expect(result).toBe('adapters');
    });

    it('VALID: middleware path returns middleware', () => {
      const result = folderTypeTransformer({
        filename: '/project/src/middleware/auth/auth-middleware.ts',
      });

      expect(result).toBe('middleware');
    });

    it('VALID: bindings path returns bindings', () => {
      const result = folderTypeTransformer({
        filename: '/project/src/bindings/ioc/ioc-binding.ts',
      });

      expect(result).toBe('bindings');
    });

    it('VALID: state path returns state', () => {
      const result = folderTypeTransformer({
        filename: '/project/src/state/user/user-state.ts',
      });

      expect(result).toBe('state');
    });

    it('VALID: responders path returns responders', () => {
      const result = folderTypeTransformer({
        filename: '/project/src/responders/api/api-responder.ts',
      });

      expect(result).toBe('responders');
    });

    it('VALID: widgets path returns widgets', () => {
      const result = folderTypeTransformer({
        filename: '/project/src/widgets/button/button-widget.ts',
      });

      expect(result).toBe('widgets');
    });

    it('VALID: startup path returns startup', () => {
      const result = folderTypeTransformer({
        filename: '/project/src/startup/initialize/app-initialize.ts',
      });

      expect(result).toBe('startup');
    });

    it('VALID: assets path returns assets', () => {
      const result = folderTypeTransformer({
        filename: '/project/src/assets/images/logo.png',
      });

      expect(result).toBe('assets');
    });

    it('VALID: migrations path returns migrations', () => {
      const result = folderTypeTransformer({
        filename: '/project/src/migrations/001/initial-migration.ts',
      });

      expect(result).toBe('migrations');
    });

    it('VALID: nested path extracts first folder correctly', () => {
      const result = folderTypeTransformer({
        filename: '/deep/nested/path/src/brokers/domain/subdomain/file.ts',
      });

      expect(result).toBe('brokers');
    });
  });

  describe('empty/null cases', () => {
    it('EMPTY: path without /src/ returns null', () => {
      const result = folderTypeTransformer({
        filename: '/project/config.ts',
      });

      expect(result).toBeNull();
    });

    it('EMPTY: path with /src/ but no folder returns null', () => {
      const result = folderTypeTransformer({
        filename: '/project/src/index.ts',
      });

      expect(result).toBeNull();
    });

    it('EMPTY: path with /src/ at the end returns null', () => {
      const result = folderTypeTransformer({
        filename: '/project/src/',
      });

      expect(result).toBeNull();
    });

    it('EMPTY: invalid folder type returns null', () => {
      const result = folderTypeTransformer({
        filename: '/project/src/invalid-folder/file.ts',
      });

      expect(result).toBeNull();
    });

    it('EMPTY: non-standard folder type returns null', () => {
      const result = folderTypeTransformer({
        filename: '/project/src/utilities/helper.ts',
      });

      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('EDGE: path like src/contracts/user.ts handles correctly', () => {
      const result = folderTypeTransformer({
        filename: 'src/contracts/user.ts',
      });

      expect(result).toBe('contracts');
    });

    it('EDGE: relative path with src handles correctly', () => {
      const result = folderTypeTransformer({
        filename: './src/brokers/user-broker.ts',
      });

      expect(result).toBe('brokers');
    });

    it('EDGE: Windows-style path works correctly', () => {
      const result = folderTypeTransformer({
        filename: 'C:\\Users\\project\\src\\contracts\\user-contract.ts',
      });

      expect(result).toBe('contracts');
    });

    it('EDGE: path with src in folder name but not as src folder returns null', () => {
      const result = folderTypeTransformer({
        filename: '/project/source/brokers/user.ts',
      });

      expect(result).toBeNull();
    });

    it('EDGE: multiple src occurrences uses first occurrence', () => {
      const result = folderTypeTransformer({
        filename: '/project/src/contracts/src/file.ts',
      });

      expect(result).toBe('contracts');
    });
  });

  describe('type safety', () => {
    it('VALID: returns FolderType branded type for valid folder', () => {
      const result: FolderType | null = folderTypeTransformer({
        filename: '/project/src/brokers/user.ts',
      });

      expect(result).toBe('brokers');
    });

    it('VALID: returns null type for invalid folder', () => {
      const result: FolderType | null = folderTypeTransformer({
        filename: '/project/other/file.ts',
      });

      expect(result).toBeNull();
    });
  });
});
