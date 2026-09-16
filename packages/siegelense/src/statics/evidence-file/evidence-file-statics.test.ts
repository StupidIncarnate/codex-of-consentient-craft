import { evidenceFileStatics } from './evidence-file-statics';

describe('evidenceFileStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(evidenceFileStatics).toStrictEqual({
      extensions: {
        transcript: '.jsonl',
        runReturn: '.json',
        shot: '.png',
        socket: '.sock',
      },
      naming: {
        shotPrefix: 'step',
      },
    });
  });
});
