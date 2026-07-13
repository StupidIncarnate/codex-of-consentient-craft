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

  it('VALID: prompt template => describes implementation as operations-ledger work, not PathSeeker planning', () => {
    const needle =
      "those are implementation-time decisions the Codeweaver sessions make when they build the operations ledger's items, not spec-review concerns";
    const { template } = chaoswhispererGapMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => carries no stale planning-model or legacy-signal references', () => {
    const { template } = chaoswhispererGapMinionStatics.prompt;

    expect(template.indexOf('PathSeeker')).toBe(-1);
    expect(template.indexOf('pathseeker')).toBe(-1);
    expect(template.indexOf('failed-replan')).toBe(-1);
  });
});
