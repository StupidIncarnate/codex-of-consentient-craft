import { graphOutcomeWordStatics } from './graph-outcome-word-statics';

describe('graphOutcomeWordStatics', () => {
  it('VALID: {} => the four outcome words, in order', () => {
    expect(graphOutcomeWordStatics.words).toStrictEqual(['done', 'unmet', 'empty', 'wall']);
  });
});
