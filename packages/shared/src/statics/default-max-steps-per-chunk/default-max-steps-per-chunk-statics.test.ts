import { defaultMaxStepsPerChunkStatics } from './default-max-steps-per-chunk-statics';

describe('defaultMaxStepsPerChunkStatics', () => {
  it('VALID: value => caps batch chunks at 6 steps per work item', () => {
    expect(defaultMaxStepsPerChunkStatics).toStrictEqual({ value: 6 });
  });
});
