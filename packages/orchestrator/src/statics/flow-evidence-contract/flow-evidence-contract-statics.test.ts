import { qaCheckSurfaceStatics } from '@dungeonmaster/shared/statics';

import { flowEvidenceContractStatics } from './flow-evidence-contract-statics';

describe('flowEvidenceContractStatics', () => {
  describe('judgingMarkdown — what an artifact is accepted or rejected against', () => {
    it('VALID: judgingMarkdown => starts with the evidence-contract heading', () => {
      const needle = '## The Evidence Contract — what makes an observable COVERED';
      const { judgingMarkdown } = flowEvidenceContractStatics;

      expect(judgingMarkdown.slice(0, needle.length)).toBe(needle);
    });

    it('VALID: judgingMarkdown => states all five evidence items in order', () => {
      const { judgingMarkdown } = flowEvidenceContractStatics;

      expect({
        verbatimText: judgingMarkdown.includes('its **verbatim** text from the spec'),
        fileAndLine: judgingMarkdown.includes('the **test file and line**'),
        quotedAssertion: judgingMarkdown.includes('the **assertion itself, quoted**'),
        failureMode: judgingMarkdown.includes('**what makes it fail**'),
        witnessedRed: judgingMarkdown.includes('the **witnessed red**'),
      }).toStrictEqual({
        verbatimText: true,
        fileAndLine: true,
        quotedAssertion: true,
        failureMode: true,
        witnessedRed: true,
      });
    });

    it('VALID: judgingMarkdown => rejects a restated failure mode with a concrete counter-example', () => {
      const needle =
        '"Fails if the text is wrong" is not an answer; "fails if the row\nrenders the older comment first, because the assertion pins the exact order `[newer, older]`" is.';
      const { judgingMarkdown } = flowEvidenceContractStatics;
      const found = judgingMarkdown.slice(
        judgingMarkdown.indexOf(needle),
        judgingMarkdown.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: judgingMarkdown => catalogues every known false green', () => {
      const { judgingMarkdown } = flowEvidenceContractStatics;
      const patterns = [
        '**Existence-only coverage.**',
        '**Layer blindness.**',
        '**Stopping at the browser when the flow goes deeper.**',
        '**A negative claim proved at the wrong layer.**',
        '**Single-instance fixtures.**',
        '**Benign-input monoculture.**',
        '**Vacuous negatives.**',
        '**Unwitnessed red.**',
        '**Self-referential tests.**',
        '**A guard for an input the product cannot produce.**',
      ];

      expect(patterns.filter((pattern) => judgingMarkdown.includes(pattern))).toStrictEqual(
        patterns,
      );
    });

    it('VALID: judgingMarkdown => keeps DEFECT and GAP as distinct evidentiary states', () => {
      const { judgingMarkdown } = flowEvidenceContractStatics;

      expect({
        neverCollapsed: judgingMarkdown.includes('must never be\ncollapsed into one label'),
        defectHasAProvingTest: judgingMarkdown.includes(
          'the behaviour is wrong and a test **proves it, left red**',
        ),
        defectInstruction: judgingMarkdown.includes("The reader's instruction is *fix\n  this*."),
        gapHasNoTest: judgingMarkdown.includes(
          '**cannot be proven at any layer available here**, so no test exists',
        ),
        gapInstruction: judgingMarkdown.includes(
          "reader's instruction is *go verify this yourself*.",
        ),
        gapIsNotUnfinishedWork: judgingMarkdown.includes(
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

    it('VALID: judgingMarkdown => is substantial enough to carry the shared contract', () => {
      expect(flowEvidenceContractStatics.judgingMarkdown.length).toBeGreaterThan(2000);
    });
  });

  describe('authoringMarkdown — the method for choosing where to assert', () => {
    it('VALID: authoringMarkdown => picks modality per observable rather than per flow', () => {
      const { authoringMarkdown } = flowEvidenceContractStatics;

      expect({
        heading: /^## Modality — chosen per OBSERVABLE, never per flow$/mu.test(authoringMarkdown),
        flowTypeIsOnlyAHint: authoringMarkdown.includes(
          'it never overrides the\nper-observable choice',
        ),
        operationalStillNeedsBrowser: authoringMarkdown.includes(
          'an `operational` flow carrying `ui-state` observables still needs a\nbrowser for those',
        ),
      }).toStrictEqual({
        heading: true,
        flowTypeIsOnlyAHint: true,
        operationalStillNeedsBrowser: true,
      });
    });

    it('VALID: authoringMarkdown => names the wrong proof each type attracts', () => {
      const { authoringMarkdown } = flowEvidenceContractStatics;

      expect({
        jsdomHasNoLayout: authoringMarkdown.includes(
          'It has no layout engine, every measured width reads 0',
        ),
        textContentIsNotPaint: authoringMarkdown.includes(
          '`textContent` proves a string is in the DOM,\n  never that a user can read it',
        ),
        namesTheLifecycleEvents: authoringMarkdown.includes(
          'mount, reload,\n  navigation, a second tab, a sweep that runs on mount',
        ),
        rejectsDirectHelperCall: authoringMarkdown.includes("proves the helper's shape\n  ONLY"),
        rejectsMockedFetch: authoringMarkdown.includes('That proves your mock, not the route'),
        rejectsWriteSpy: authoringMarkdown.includes(
          'It proves the call happened, never that what landed is',
        ),
        rejectsMockedSpawner: authoringMarkdown.includes(
          'a mocked spawner, which cannot prove the "zero',
        ),
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
  });

  // The check-surface map reaches a session through `get-qa-checklist`, which stamps a
  // `checkSurface` on every unit and prints a legend for the types that flow actually carries.
  // Restating it here put a second, wider, staler rendering of a per-unit value into two prompts at
  // once — 1,850 characters each, for something both roles fetch before they author or judge
  // anything. These tests fail if the table creeps back in.
  describe('the check-surface map is deferred to get-qa-checklist, never restated', () => {
    it.each(Object.keys(qaCheckSurfaceStatics.byOutcomeType))(
      'VALID: {outcomeType: %s} => has no hand-rendered table row in either block',
      (outcomeType) => {
        const { judgingMarkdown, authoringMarkdown } = flowEvidenceContractStatics;
        const row = `| \`${outcomeType}\` |`;

        expect({
          judging: judgingMarkdown.includes(row),
          authoring: authoringMarkdown.includes(row),
        }).toStrictEqual({ judging: false, authoring: false });
      },
    );

    it.each(Object.values(qaCheckSurfaceStatics.byOutcomeType))(
      'VALID: {surface sentence} => is not copied verbatim into either block',
      (surface) => {
        const { judgingMarkdown, authoringMarkdown } = flowEvidenceContractStatics;

        expect({
          judging: judgingMarkdown.includes(surface),
          authoring: authoringMarkdown.includes(surface),
        }).toStrictEqual({ judging: false, authoring: false });
      },
    );

    it('VALID: judgingMarkdown => sends the reader to the checklist for the surface instead', () => {
      const { judgingMarkdown } = flowEvidenceContractStatics;

      expect({
        namesTheTool: judgingMarkdown.includes('`get-qa-checklist({ questId, flowId })` stamps a'),
        surfaceIsAuthoritative: judgingMarkdown.includes(
          'That\nstring is the authoritative surface for that unit.',
        ),
        disagreementIsRejection: judgingMarkdown.includes(
          "An assertion whose layer disagrees with its unit's\n`checkSurface` is rejected",
        ),
      }).toStrictEqual({
        namesTheTool: true,
        surfaceIsAuthoritative: true,
        disagreementIsRejection: true,
      });
    });
  });
});
