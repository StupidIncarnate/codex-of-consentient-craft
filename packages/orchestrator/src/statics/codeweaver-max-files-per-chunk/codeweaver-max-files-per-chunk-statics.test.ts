import { codeweaverMaxFilesPerChunkStatics } from './codeweaver-max-files-per-chunk-statics';

describe('codeweaverMaxFilesPerChunkStatics', () => {
  it('VALID: exported value => caps codeweaver package chunks at 20 files', () => {
    expect(codeweaverMaxFilesPerChunkStatics).toStrictEqual({
      value: 20,
    });
  });
});
