import { pathseekerWalkStatics } from './pathseeker-walk-statics';

describe('pathseekerWalkStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(pathseekerWalkStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: prompt template => length exceeds 5000 characters', () => {
    expect(pathseekerWalkStatics.prompt.template.length).toBeGreaterThan(5000);
  });

  it('VALID: prompt template => opening line declares pathseeker-walk role', () => {
    const needle =
      'You are pathseeker-walk, the architect-review pass that runs after every pathseeker-surface, pathseeker-dedup, and pathseeker-assertion-correctness agent has finished.';
    const { template } = pathseekerWalkStatics.prompt;

    expect(template.indexOf(needle)).toBe(0);
  });

  it('VALID: prompt template => instructs not to branch on seek_* statuses', () => {
    const needle = 'do NOT branch on `seek_*` statuses';
    const { template } = pathseekerWalkStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => seek_scope section header is absent', () => {
    expect(pathseekerWalkStatics.prompt.template.indexOf('### Status: `seek_scope`')).toBe(-1);
  });

  it('VALID: prompt template => seek_synth section header is absent', () => {
    expect(pathseekerWalkStatics.prompt.template.indexOf('### Status: `seek_synth`')).toBe(-1);
  });

  it('VALID: prompt template => seek_walk section header is absent (no status-branching)', () => {
    expect(pathseekerWalkStatics.prompt.template.indexOf('### Status: `seek_walk`')).toBe(-1);
  });

  it('VALID: prompt template => Wave A header is absent', () => {
    expect(pathseekerWalkStatics.prompt.template.indexOf('Wave A')).toBe(-1);
  });

  it('VALID: prompt template => Wave B header is absent', () => {
    expect(pathseekerWalkStatics.prompt.template.indexOf('Wave B')).toBe(-1);
  });

  it('VALID: prompt template => orchestrator-monitor dispatch framing is present', () => {
    const needle = 'The orchestrator monitor dispatched you';
    const { template } = pathseekerWalkStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => Architect-Review Walk section header is present', () => {
    const needle = '## The Architect-Review Walk';
    const { template } = pathseekerWalkStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => Step 1 pulls the full quest', () => {
    const needle = '#### Step 1 — Pull the full quest';
    const { template } = pathseekerWalkStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => Step 2 walks every flow entry to exit', () => {
    const needle = '#### Step 2 — Walk every user flow entry → exit';
    const { template } = pathseekerWalkStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => Step 3 patches and authors', () => {
    const needle = '#### Step 3 — Patch and author';
    const { template } = pathseekerWalkStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => Step 4 rolling commits with single terminal commit', () => {
    const needle = '#### Step 4 — Rolling commits during walk, single terminal commit at exit';
    const { template } = pathseekerWalkStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => Step 2 names upstream glue confirmation', () => {
    const needle = '**(a) Upstream glue.**';
    const { template } = pathseekerWalkStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => Step 2 names downstream glue confirmation', () => {
    const needle = '**(b) Downstream glue.**';
    const { template } = pathseekerWalkStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => Step 2 names requirement-reading correctness', () => {
    const needle = '**(c) Requirement-reading correctness.**';
    const { template } = pathseekerWalkStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => Step 2 names CLAUDE.md integrity check', () => {
    const needle = '**(d) CLAUDE.md / project-standards integrity**';
    const { template } = pathseekerWalkStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => Step 4 teaches partial-patch shape for edits', () => {
    const needle = 'EDIT an existing step — partial-patch shape';
    const { template } = pathseekerWalkStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => Step 4 teaches full-shape for brand-new exploratory steps', () => {
    const needle = 'CREATE a brand-new exploratory step — full shape required';
    const { template } = pathseekerWalkStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => Step 4 enforces one-clause-per-entry walkFindings rule', () => {
    const needle = 'ONE clause per entry, anchored on step ID, no narration';
    const { template } = pathseekerWalkStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => walkFindings example uses filesRead field', () => {
    const needle = 'filesRead: [';
    const { template } = pathseekerWalkStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => walkFindings example uses structuralIssuesFound field', () => {
    const needle = 'structuralIssuesFound: [';
    const { template } = pathseekerWalkStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => walkFindings example uses planPatches field', () => {
    const needle = 'planPatches: [';
    const { template } = pathseekerWalkStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => walkFindings example uses verifiedAt field', () => {
    const needle = 'verifiedAt:';
    const { template } = pathseekerWalkStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => Assertions vs Instructions section is present', () => {
    const needle = '## Assertions vs Instructions';
    const { template } = pathseekerWalkStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => contains banned-matcher validator reference', () => {
    const needle = '**Banned-matcher scan.**';
    const { template } = pathseekerWalkStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => contains observables coverage validator reference', () => {
    const needle = '**Observables coverage.**';
    const { template } = pathseekerWalkStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => mandates e2e/integration test steps be focusFile, never focusAction', () => {
    const needle =
      '**e2e / integration TEST steps MUST be `focusFile` — never `focusAction`.** Flowrider routing keys on the focusFile suffix:';
    const { template } = pathseekerWalkStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => requires .e2e.ts paths in the entry flow folder of the UI package', () => {
    const needle =
      "e2e is Playwright exclusively, and `.e2e.ts` paths MUST live in the entry flow's folder of the UI package";
    const { template } = pathseekerWalkStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => Quest Context section ends with $ARGUMENTS placeholder', () => {
    expect(pathseekerWalkStatics.prompt.template.endsWith('$ARGUMENTS')).toBe(true);
  });
});
