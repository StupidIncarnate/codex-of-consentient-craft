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

  it('VALID: prompt template => flags a declared style value carrying no verifyByReading as a Warning', () => {
    const needle = '**A declared style value with no `verifyByReading`.**';
    const { template } = chaoswhispererGapMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  // The warning has to stop at the values the SOURCE declares. Siegemaster is told to treat a
  // misaligned control or a truncated label as a defect, so a minion that swept those into the same
  // finding would be arguing for deleting the coverage that catches them.
  it('VALID: prompt template => exempts a painted outcome from the style-value warning', () => {
    const needle = '- Do NOT flag a PAINTED OUTCOME.';
    const { template } = chaoswhispererGapMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
    expect(template.indexOf('could this break with no user-visible change?')).toBeGreaterThan(-1);
  });

  it('VALID: prompt template => flags a lint-owned or library-choice criterion as not an observable', () => {
    const needle = '**An observable that is not an observable.**';
    const { template } = chaoswhispererGapMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  // `flowObservableContract` is FLAT and has no `then`. A minion reviewing observables against the
  // retired BDD shape grades a field the save drops.
  it('VALID: prompt template => describes an observable as flat, with no given/when/then block', () => {
    const { template } = chaoswhispererGapMinionStatics.prompt;

    expect(template.indexOf('Each contains a `then` array of assertion outcomes')).toBe(-1);
    expect(template.indexOf('**THEN (assertions):**')).toBe(-1);
    expect(template.indexOf('vague THEN outcomes')).toBe(-1);
    expect(template.indexOf('There is no `given`/`when`/`then` block')).toBeGreaterThan(-1);
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

  it('VALID: prompt template => reads the ledger from the same spec-stage response as the flows', () => {
    const needle = 'and the `operations` ledger you check in Step 11.';
    const { template } = chaoswhispererGapMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => reviews the operations ledger against the spec as its own step', () => {
    const needle = '### Step 11: Review the Operations Ledger Against the Spec';
    const { template } = chaoswhispererGapMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => checks flow coverage via flowIds set arithmetic before the judgment checks', () => {
    const needle =
      '**Flow coverage by `flowIds` (do this first — it is set arithmetic, not judgment).**';
    const { template } = chaoswhispererGapMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => does not flag empty flowIds or a flow claimed by several items', () => {
    const { template } = chaoswhispererGapMinionStatics.prompt;

    expect(
      template.indexOf('An item with `flowIds: []` is NOT a finding on its own.'),
    ).toBeGreaterThan(-1);
    expect(
      template.indexOf('A flow referenced by SEVERAL items is NOT a finding.'),
    ).toBeGreaterThan(-1);
  });

  it('VALID: prompt template => scopes the ledger review to coverage, not implementation', () => {
    const needle = '**You are checking COVERAGE and CONSISTENCY, not implementation.**';
    const { template } = chaoswhispererGapMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => assembles the report from Steps 3-11 after the ledger review', () => {
    const needle = '### Step 12: Assemble the Final Report';
    const { template } = chaoswhispererGapMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
    expect(template.indexOf('Findings blocks you emitted in Steps 3–11')).toBeGreaterThan(-1);
  });

  it('VALID: prompt template => carries no stale planning-model or legacy-signal references', () => {
    const { template } = chaoswhispererGapMinionStatics.prompt;

    expect(template.indexOf('PathSeeker')).toBe(-1);
    expect(template.indexOf('pathseeker')).toBe(-1);
    expect(template.indexOf('failed-replan')).toBe(-1);
  });
});
