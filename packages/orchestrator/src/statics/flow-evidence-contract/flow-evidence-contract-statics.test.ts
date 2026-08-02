import { qaCheckSurfaceStatics } from '@dungeonmaster/shared/statics';

import { flowEvidenceContractStatics } from './flow-evidence-contract-statics';

describe('flowEvidenceContractStatics', () => {
  it('VALID: exported value => has a markdown string', () => {
    expect(flowEvidenceContractStatics).toStrictEqual({
      markdown: expect.stringMatching(/^.+$/su),
    });
  });

  it('VALID: markdown => starts with the evidence-contract heading', () => {
    const needle = '## The Evidence Contract — what makes an observable COVERED';
    const { markdown } = flowEvidenceContractStatics;

    expect(markdown.slice(0, needle.length)).toBe(needle);
  });

  it('VALID: markdown => states all five evidence items in order', () => {
    const { markdown } = flowEvidenceContractStatics;

    expect({
      verbatimText: markdown.includes('its **verbatim** text from the spec'),
      fileAndLine: markdown.includes('the **test file and line**'),
      quotedAssertion: markdown.includes('the **assertion itself, quoted**'),
      failureMode: markdown.includes('**what makes it fail**'),
      witnessedRed: markdown.includes('the **witnessed red**'),
    }).toStrictEqual({
      verbatimText: true,
      fileAndLine: true,
      quotedAssertion: true,
      failureMode: true,
      witnessedRed: true,
    });
  });

  it('VALID: markdown => rejects a restated failure mode with a concrete counter-example', () => {
    const needle =
      '"Fails if the text is wrong" is not an answer; "fails if the row\nrenders the older comment first, because the assertion pins the exact order `[newer, older]`" is.';
    const { markdown } = flowEvidenceContractStatics;
    const found = markdown.slice(
      markdown.indexOf(needle),
      markdown.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: markdown => picks modality per observable rather than per flow', () => {
    const { markdown } = flowEvidenceContractStatics;

    expect({
      heading: /^## Modality — chosen per OBSERVABLE, never per flow$/mu.test(markdown),
      flowTypeIsOnlyAHint: markdown.includes('it never overrides the per-observable\nchoice'),
      operationalStillNeedsBrowser: markdown.includes(
        'an `operational` flow carrying `ui-state` observables still needs a browser for those',
      ),
    }).toStrictEqual({
      heading: true,
      flowTypeIsOnlyAHint: true,
      operationalStillNeedsBrowser: true,
    });
  });

  // The table is GENERATED from qaCheckSurfaceStatics rather than hand-listed, so a newly added
  // outcome type reaches this prompt automatically. That static's own colocated test asserts its
  // keys 1:1 against outcomeTypeContract, so covering every key here inherits full contract
  // coverage — which is the guarantee a hand-maintained list could not give, and is exactly how
  // `cache-state` came to be named by no modality at all.
  it('VALID: markdown => carries a check-surface row for EVERY outcome type the shared static maps', () => {
    const { markdown } = flowEvidenceContractStatics;
    const missing = Object.keys(qaCheckSurfaceStatics.byOutcomeType).filter(
      (outcomeType) => !markdown.includes(`| \`${outcomeType}\` |`),
    );

    expect(missing).toStrictEqual([]);
  });

  // Rendering the static's own sentence (not a paraphrase of it) is what makes the checklist a
  // session fetches and the contract it is judged against agree by construction.
  it('VALID: markdown => renders each row with the shared static’s own surface sentence', () => {
    const { markdown } = flowEvidenceContractStatics;
    const mismatched = Object.entries(qaCheckSurfaceStatics.byOutcomeType)
      .filter(([outcomeType, surface]) => !markdown.includes(`| \`${outcomeType}\` | ${surface} |`))
      .map(([outcomeType]) => outcomeType);

    expect(mismatched).toStrictEqual([]);
  });

  it('VALID: markdown => names the wrong proof each type attracts', () => {
    const { markdown } = flowEvidenceContractStatics;

    expect({
      jsdomHasNoLayout: markdown.includes('It has no layout engine, every measured width reads 0'),
      textContentIsNotPaint: markdown.includes(
        '`textContent` proves a string is in the DOM,\n  never that a user can read it',
      ),
      namesTheLifecycleEvents: markdown.includes(
        'mount, reload,\n  navigation, a second tab, a sweep that runs on mount',
      ),
      rejectsDirectHelperCall: markdown.includes("proves the helper's shape\n  ONLY"),
      rejectsMockedFetch: markdown.includes('That proves your mock, not the route'),
      rejectsWriteSpy: markdown.includes('It proves the call happened, never that what landed is'),
      rejectsMockedSpawner: markdown.includes('a mocked spawner, which cannot prove the "zero'),
    }).toStrictEqual({
      jsdomHasNoLayout: true,
      textContentIsNotPaint: true,
      namesTheLifecycleEvents: true,
      rejectsDirectHelperCall: true,
      rejectsMockedFetch: true,
      rejectsWriteSpy: true,
      rejectsMockedSpawner: true,
    });
  });

  it('VALID: markdown => requires a negative claim to be proven at its positive twin’s layer', () => {
    const needle = '**A negative claim needs the same layer as its positive twin.**';
    const { markdown } = flowEvidenceContractStatics;
    const found = markdown.slice(
      markdown.indexOf(needle),
      markdown.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: markdown => catalogues every known false green', () => {
    const { markdown } = flowEvidenceContractStatics;
    const patterns = [
      '**Existence-only coverage.**',
      '**Layer blindness.**',
      '**Stopping at the browser when the flow goes deeper.**',
      '**Single-instance fixtures.**',
      '**Benign-input monoculture.**',
      '**Vacuous negatives.**',
      '**Unwitnessed red.**',
      '**Self-referential tests.**',
      '**A guard for an input the product cannot produce.**',
    ];

    expect(patterns.filter((pattern) => markdown.includes(pattern))).toStrictEqual(patterns);
  });

  it('VALID: markdown => keeps DEFECT and GAP as distinct evidentiary states', () => {
    const { markdown } = flowEvidenceContractStatics;

    expect({
      neverCollapsed: markdown.includes('must never be\ncollapsed into one label'),
      defectHasAProvingTest: markdown.includes(
        'the behaviour is wrong and a test **proves it, left red**',
      ),
      defectInstruction: markdown.includes("The reader's instruction is *fix\n  this*."),
      gapHasNoTest: markdown.includes(
        '**cannot be proven at any layer available here**, so no test exists',
      ),
      gapInstruction: markdown.includes("reader's instruction is *go verify this yourself*."),
      gapIsNotUnfinishedWork: markdown.includes(
        'A `GAP:` is never a place to put something\n  that was simply not reached',
      ),
    }).toStrictEqual({
      neverCollapsed: true,
      defectHasAProvingTest: true,
      defectInstruction: true,
      gapHasNoTest: true,
      gapInstruction: true,
      gapIsNotUnfinishedWork: true,
    });
  });

  it('VALID: markdown => is substantial enough to carry the shared contract', () => {
    expect(flowEvidenceContractStatics.markdown.length).toBeGreaterThan(2000);
  });
});
