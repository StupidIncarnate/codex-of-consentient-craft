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

    it('VALID: judgingMarkdown => defines exactly two per-track verdicts, both of which clear the gate', () => {
      const { judgingMarkdown } = flowEvidenceContractStatics;

      expect({
        heading: /^## Verdicts — every unit carries TWO independent sign-offs$/mu.test(
          judgingMarkdown,
        ),
        perTrack: judgingMarkdown.includes(
          'A unit is settled PER TRACK, never once for everybody.',
        ),
        bothTracksMustSign: judgingMarkdown.includes(
          'a unit is done only when BOTH tracks have signed it',
        ),
        bothVerdictsClear: judgingMarkdown.includes(
          'Both verdicts CLEAR the completion\ngate; what the gate refuses is the ABSENCE of a sign-off.',
        ),
        confirmedNeedsAFailure: judgingMarkdown.includes(
          'a test `file:line` PLUS what makes that test fail',
        ),
        confirmedIsMeasuredForSiegemaster: judgingMarkdown.includes(
          'Siegemaster: the value measured off the\n  running system',
        ),
        unconfirmableNeedsAQuestion: judgingMarkdown.includes(
          'the contract refuses an `unconfirmable` that carries none',
        ),
      }).toStrictEqual({
        heading: true,
        perTrack: true,
        bothTracksMustSign: true,
        bothVerdictsClear: true,
        confirmedNeedsAFailure: true,
        confirmedIsMeasuredForSiegemaster: true,
        unconfirmableNeedsAQuestion: true,
      });
    });

    // A defect is the INVERSE of an observable, so recording it as a verdict would leave the unit's
    // own positive expectation unanswered. It goes into the spec as its own observable and carries
    // its own two sign-offs, which is why no third verdict exists to hold it.
    it('VALID: judgingMarkdown => routes a measured defect to a new observable rather than a third verdict', () => {
      const { judgingMarkdown } = flowEvidenceContractStatics;

      expect({
        newObservable: judgingMarkdown.includes(
          '**A measured defect is a NEW observable, not a third verdict.**',
        ),
        inverseExpectation: judgingMarkdown.includes(
          'is the INVERSE\nexpectation and it belongs in the spec',
        ),
        carriesItsOwnSignoffs: judgingMarkdown.includes(
          'it arrives unsigned and then\ncarries its own two sign-offs like every other unit',
        ),
        noOtherVerdicts: judgingMarkdown.includes(
          'There is no `defect`, `deferred`, `gap` or `recorded`\nSIGN-OFF verdict.',
        ),
        // The same composed reviewer prompt carries the standing concerns' disposition table, where
        // `gap` and `recorded` are honest answers that CLEAR a unit. Unqualified, the two blocks
        // read as one vocabulary contradicting itself.
        dispositionsAreADifferentRecord: judgingMarkdown.includes(
          "(The standing concerns' `blightLedger` dispositions are a separate record with a\nvocabulary of their own; nothing here governs them.)",
        ),
        provenanceIsSeparate: judgingMarkdown.includes('**Provenance is a SEPARATE axis.**'),
        unsignedIsARealState: judgingMarkdown.includes(
          '**A unit nobody can settle stays UNSIGNED.**',
        ),
        unconfirmableIsNotForMissingTests: judgingMarkdown.includes(
          'Never reach for `unconfirmable` to\nclear a unit that simply needs a test nobody has written yet.',
        ),
      }).toStrictEqual({
        newObservable: true,
        inverseExpectation: true,
        carriesItsOwnSignoffs: true,
        noOtherVerdicts: true,
        dispositionsAreADifferentRecord: true,
        provenanceIsSeparate: true,
        unsignedIsARealState: true,
        unconfirmableIsNotForMissingTests: true,
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
        // Journey-vs-matrix and checkSurface answer different questions. Read as competing, a
        // session picks one and drops the other: a "journey" e2e that never asserts at the layer
        // the claim lives on, or a matrix that flattens a branchy flow into one parameterized case.
        shapeVersusLayer: authoringMarkdown.includes(
          '**Two rules compose here, and they never compete. Journey-vs-matrix chooses the test SHAPE;\n`checkSurface` chooses the LAYER.**',
        ),
        journeyIsOneTestPerPath: authoringMarkdown.includes(
          'a branchy flow is a JOURNEY — one test per path, driven end to end',
        ),
        matrixIsParameterized: authoringMarkdown.includes(
          'a set of\nindependent input combinations is a MATRIX, one parameterized test over the combinations',
        ),
        journeyRendersPerSurface: authoringMarkdown.includes(
          'a branchy flow is a\njourney rendered as e2e for a web surface and as integration for a non-web one; a combination matrix\nis integration',
        ),
        neitherOverridesTheOther: authoringMarkdown.includes(
          'Picking the shape never licenses asserting at the wrong layer, and picking the layer\nnever collapses a journey into a matrix.',
        ),
      }).toStrictEqual({
        heading: true,
        flowTypeIsOnlyAHint: true,
        operationalStillNeedsBrowser: true,
        shapeVersusLayer: true,
        journeyIsOneTestPerPath: true,
        matrixIsParameterized: true,
        journeyRendersPerSurface: true,
        neitherOverridesTheOther: true,
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
        namesTheTool: judgingMarkdown.includes('`get-qa-checklist` stamps a'),
        showsNoArgumentsOfItsOwn: !judgingMarkdown.includes('get-qa-checklist({'),
        surfaceIsAuthoritative: judgingMarkdown.includes(
          'That\nstring is the authoritative surface for that unit.',
        ),
        disagreementIsRejection: judgingMarkdown.includes(
          "An assertion whose layer disagrees with its unit's\n`checkSurface` is rejected",
        ),
      }).toStrictEqual({
        namesTheTool: true,
        showsNoArgumentsOfItsOwn: true,
        surfaceIsAuthoritative: true,
        disagreementIsRejection: true,
      });
    });
  });
});
