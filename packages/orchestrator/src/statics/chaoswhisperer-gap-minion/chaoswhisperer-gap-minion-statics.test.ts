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

  it('VALID: prompt template => flags a redundant ward/build observable as a Warning', () => {
    const needle = '**Redundant ward/build observable.**';
    const { template } = chaoswhispererGapMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => no longer treats "Ward green" as the expected operational terminal', () => {
    const { template } = chaoswhispererGapMinionStatics.prompt;

    expect(template.indexOf('(Ward green, grep zero, service healthy)')).toBe(-1);
  });
});
