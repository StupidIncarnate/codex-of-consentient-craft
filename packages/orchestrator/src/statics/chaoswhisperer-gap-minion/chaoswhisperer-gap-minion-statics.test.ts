import { chaoswhispererGapMinionStatics } from './chaoswhisperer-gap-minion-statics';

describe('chaoswhispererGapMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(chaoswhispererGapMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });
});
