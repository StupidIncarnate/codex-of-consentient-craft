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

  it('VALID: markdown => gives every observable type its own modality row', () => {
    const { markdown } = flowEvidenceContractStatics;
    const types = ['ui-state', 'cache-state', 'api-call', 'db-query', 'process-state', 'custom'];

    expect(types.filter((type) => markdown.includes(`| \`${type}\` |`))).toStrictEqual(types);
  });

  it('VALID: markdown => routes a browser-storage lifecycle claim to a real browser', () => {
    const { markdown } = flowEvidenceContractStatics;

    expect({
      namesTheStorages: markdown.includes('localStorage, sessionStorage, IndexedDB'),
      namesTheLifecycleEvents: markdown.includes(
        'mount, reload, navigation, a second tab, or a sweep that runs on mount',
      ),
      rejectsDirectHelperCall: markdown.includes("proves the helper's shape ONLY"),
    }).toStrictEqual({
      namesTheStorages: true,
      namesTheLifecycleEvents: true,
      rejectsDirectHelperCall: true,
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
