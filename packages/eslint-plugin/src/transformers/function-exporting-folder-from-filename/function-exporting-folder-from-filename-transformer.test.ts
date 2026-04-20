import { functionExportingFolderFromFilenameTransformer } from './function-exporting-folder-from-filename-transformer';
import { FolderTypeStub } from '@dungeonmaster/shared/contracts';

describe('functionExportingFolderFromFilenameTransformer', () => {
  it('VALID: broker filename => returns brokers', () => {
    const result = functionExportingFolderFromFilenameTransformer({
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
    });

    expect(result).toBe(FolderTypeStub({ value: 'brokers' }));
  });

  it('VALID: adapter filename => returns adapters', () => {
    const result = functionExportingFolderFromFilenameTransformer({
      filename: '/project/src/adapters/fs/read-file/fs-read-file-adapter.ts',
    });

    expect(result).toBe(FolderTypeStub({ value: 'adapters' }));
  });

  it('VALID: guard filename => returns guards', () => {
    const result = functionExportingFolderFromFilenameTransformer({
      filename: '/project/src/guards/is-valid/is-valid-guard.ts',
    });

    expect(result).toBe(FolderTypeStub({ value: 'guards' }));
  });

  it('VALID: widget tsx filename => returns widgets', () => {
    const result = functionExportingFolderFromFilenameTransformer({
      filename: '/project/src/widgets/pixel-btn/pixel-btn-widget.tsx',
    });

    expect(result).toBe(FolderTypeStub({ value: 'widgets' }));
  });

  it('VALID: startup filename with no suffix => returns startup', () => {
    const result = functionExportingFolderFromFilenameTransformer({
      filename: '/project/src/startup/start-server.ts',
    });

    expect(result).toBe(FolderTypeStub({ value: 'startup' }));
  });

  it('VALID: middleware filename => returns middleware', () => {
    const result = functionExportingFolderFromFilenameTransformer({
      filename: '/project/src/middleware/auth/auth-middleware.ts',
    });

    expect(result).toBe(FolderTypeStub({ value: 'middleware' }));
  });

  it('INVALID: contract filename => returns undefined', () => {
    const result = functionExportingFolderFromFilenameTransformer({
      filename: '/project/src/contracts/user/user-contract.ts',
    });

    expect(result).toBe(undefined);
  });

  it('INVALID: statics filename => returns undefined', () => {
    const result = functionExportingFolderFromFilenameTransformer({
      filename: '/project/src/statics/config/config-statics.ts',
    });

    expect(result).toBe(undefined);
  });

  it('INVALID: no filename => returns undefined', () => {
    const result = functionExportingFolderFromFilenameTransformer({});

    expect(result).toBe(undefined);
  });

  it('INVALID: empty filename => returns undefined', () => {
    const result = functionExportingFolderFromFilenameTransformer({ filename: '' });

    expect(result).toBe(undefined);
  });

  it('INVALID: file outside function-exporting folder => returns undefined', () => {
    const result = functionExportingFolderFromFilenameTransformer({
      filename: '/project/src/assets/images/logo.png',
    });

    expect(result).toBe(undefined);
  });
});
