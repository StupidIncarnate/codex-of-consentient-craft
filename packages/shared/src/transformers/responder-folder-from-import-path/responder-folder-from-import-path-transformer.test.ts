import { responderFolderFromImportPathTransformer } from './responder-folder-from-import-path-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('responderFolderFromImportPathTransformer', () => {
  it('VALID: {deep responder import path} => returns folder path without filename', () => {
    const result = responderFolderFromImportPathTransformer({
      importPath: ContentTextStub({
        value: '../../responders/quest/start/quest-start-responder',
      }),
    });

    expect(String(result)).toBe('responders/quest/start');
  });

  it('VALID: {responder import with two levels} => strips filename', () => {
    const result = responderFolderFromImportPathTransformer({
      importPath: ContentTextStub({
        value: '../responders/guild/list',
      }),
    });

    expect(String(result)).toBe('responders/guild');
  });

  it('VALID: {responders/ with single segment} => returns responders/segment', () => {
    const result = responderFolderFromImportPathTransformer({
      importPath: ContentTextStub({
        value: '../../responders/health',
      }),
    });

    expect(String(result)).toBe('responders/health');
  });

  it('EMPTY: {import path without responders/ segment} => returns empty string', () => {
    const result = responderFolderFromImportPathTransformer({
      importPath: ContentTextStub({
        value: '../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter',
      }),
    });

    expect(String(result)).toBe('');
  });
});
