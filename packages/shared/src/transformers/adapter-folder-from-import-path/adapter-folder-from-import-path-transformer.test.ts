import { adapterFolderFromImportPathTransformer } from './adapter-folder-from-import-path-transformer';

describe('adapterFolderFromImportPathTransformer', () => {
  it('VALID: {deep adapter import path} => returns folder path without filename', () => {
    const result = adapterFolderFromImportPathTransformer({
      importPath: '../../../adapters/orchestrator/start-quest/orchestrator-start-quest-adapter',
    });

    expect(String(result)).toBe('adapters/orchestrator/start-quest');
  });

  it('VALID: {adapter import with two levels} => strips filename', () => {
    const result = adapterFolderFromImportPathTransformer({
      importPath: '../adapters/fs/write-file',
    });

    expect(String(result)).toBe('adapters/fs');
  });

  it('VALID: {adapters/ with single segment} => returns adapters/segment', () => {
    const result = adapterFolderFromImportPathTransformer({
      importPath: '../adapters/hono',
    });

    expect(String(result)).toBe('adapters/hono');
  });

  it('EMPTY: {import path without adapters/ segment} => returns empty string', () => {
    const result = adapterFolderFromImportPathTransformer({
      importPath: '../../responders/quest/start/quest-start-responder',
    });

    expect(String(result)).toBe('');
  });
});
