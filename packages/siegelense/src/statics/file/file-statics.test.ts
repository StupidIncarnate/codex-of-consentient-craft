import { fileStatics } from './file-statics';

describe('fileStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(fileStatics).toStrictEqual({
      defaults: {
        encoding: 'utf8',
      },
      errors: {
        notFoundTemplate: 'file "{path}" does not exist in lane home "{homePath}"',
        leadingSlash:
          'a `file` step path is resolved against the lane\'s own throwaway home and must not start with "/" — a leading slash would escape the lane the walk is driving. Try { "step": "file", "path": "guilds/<id>/quests/<id>/quest.json" }',
        traversal:
          'a `file` step path must not contain ".." directory traversal — traversal would escape the lane the walk is driving. Try { "step": "file", "path": "guilds/<id>/quests/<id>/quest.json" }',
      },
    });
  });

  it('VALID: {defaults.encoding} => is utf8', () => {
    expect(fileStatics.defaults.encoding).toBe('utf8');
  });
});
