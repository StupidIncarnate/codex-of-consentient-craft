import { pathseekerPipelineStatics } from './pathseeker-pipeline-statics';

describe('pathseekerPipelineStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(pathseekerPipelineStatics).toStrictEqual({
      limits: {
        maxAttempts: 3,
      },
    });
  });
});
