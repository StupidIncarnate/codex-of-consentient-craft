import { responderFolderFromImportPathTransformer } from './responder-folder-from-import-path-transformer';

describe('responderFolderFromImportPathTransformer', () => {
  it('VALID: {deep responder import path} => returns folder path without filename', () => {
    const result = responderFolderFromImportPathTransformer({
      importPath: '../../responders/quest/start/quest-start-responder',
    });

    expect(result).toBe('responders/quest/start');
  });

  it('VALID: {responder import with two levels} => strips filename', () => {
    const result = responderFolderFromImportPathTransformer({
      importPath: '../responders/guild/list',
    });

    expect(result).toBe('responders/guild');
  });

  it('VALID: {responders/ with single segment} => returns responders/segment', () => {
    const result = responderFolderFromImportPathTransformer({
      importPath: '../../responders/health',
    });

    expect(result).toBe('responders/health');
  });

  it('EMPTY: {import path without responders/ segment} => returns empty string', () => {
    const result = responderFolderFromImportPathTransformer({
      importPath: '../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter',
    });

    expect(result).toBe('');
  });
});
