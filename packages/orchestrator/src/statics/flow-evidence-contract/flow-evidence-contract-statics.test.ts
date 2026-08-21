import { qaCheckSurfaceStatics } from '@dungeonmaster/shared/statics';

import { disciplineBelowBrowserStatics } from '../discipline-below-browser/discipline-below-browser-statics';
import { disciplineBrowserE2eStatics } from '../discipline-browser-e2e/discipline-browser-e2e-statics';
import { signoffTrackEligibilityStatics } from '../signoff-track-eligibility/signoff-track-eligibility-statics';
import { flowEvidenceContractStatics } from './flow-evidence-contract-statics';

describe('flowEvidenceContractStatics', () => {
  describe('judgingMarkdown — what a reviewer accepts or rejects an artifact against', () => {
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
        '"Fails if the text is wrong" is not an answer. "Fails if the row\nrenders the older comment first, because the assertion pins the exact order `[newer, older]`" is one.';
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
          'A unit is done only when BOTH tracks have signed it.',
        ),
        bothVerdictsClear: judgingMarkdown.includes(
          'Both verdicts CLEAR the\ncompletion gate. The gate refuses an ABSENT sign-off. It refuses nothing else.',
        ),
        confirmedNeedsAFailure: judgingMarkdown.includes(
          'a test `file:line` PLUS what makes that test fail',
        ),
        confirmedIsMeasuredForSiegemaster: judgingMarkdown.includes(
          'Siegemaster: the value you measured off the running system.',
        ),
        unconfirmableNeedsAQuestion: judgingMarkdown.includes(
          'The contract refuses an `unconfirmable` that carries\n  none.',
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

    // No third verdict exists to hold a measured defect. Signing one as a verdict would leave the
    // unit's own positive expectation unanswered, because a defect is the INVERSE of an observable.
    // The defect goes into the spec as its own observable. There it carries its own two sign-offs.
    it('VALID: judgingMarkdown => routes a measured defect to a new observable rather than a third verdict', () => {
      const { judgingMarkdown } = flowEvidenceContractStatics;

      expect({
        newObservable: judgingMarkdown.includes(
          '**A measured defect is a NEW observable, not a third verdict.**',
        ),
        inverseExpectation: judgingMarkdown.includes(
          'is the INVERSE\nexpectation. That belongs in the spec.',
        ),
        carriesItsOwnSignoffs: judgingMarkdown.includes(
          'It arrives unsigned. It then carries its\nown two sign-offs, like every other unit.',
        ),
        noOtherVerdicts: judgingMarkdown.includes(
          'There is no `defect`, `deferred`,\n`gap` or `recorded` SIGN-OFF verdict.',
        ),
        // Without that qualifier, the two blocks read as one vocabulary contradicting itself. The
        // same composed reviewer prompt carries the standing concerns' disposition table, where
        // `gap` and `recorded` are honest answers that CLEAR a unit.
        dispositionsAreADifferentRecord: judgingMarkdown.includes(
          "(The standing concerns' `blightLedger` dispositions are a\nseparate record with a vocabulary of their own. Nothing here governs them.)",
        ),
        provenanceIsSeparate: judgingMarkdown.includes('**Provenance is a SEPARATE axis.**'),
      }).toStrictEqual({
        newObservable: true,
        inverseExpectation: true,
        carriesItsOwnSignoffs: true,
        noOtherVerdicts: true,
        dispositionsAreADifferentRecord: true,
        provenanceIsSeparate: true,
      });
    });

    // The gate refuses an ABSENT sign-off. `signoffOutstandingTransformer` returns every unit whose
    // track field is `undefined`. BOTH verdicts clear one. The machinery routes a blank nowhere. It
    // refuses the parent's `done`. It spends the pt chain. The two discipline packs that embed this
    // block say exactly that, ~120 rendered lines further down the same served prompt. This closing
    // paragraph used to tell the reviewer the opposite.
    it('VALID: judgingMarkdown => closes an unsettleable unit with `unconfirmable` rather than leaving it blank', () => {
      const { judgingMarkdown } = flowEvidenceContractStatics;

      expect({
        unsettleableIsUnconfirmable: judgingMarkdown.includes(
          '**A unit nobody can settle after real effort is `unconfirmable`.** Sign it with `evidence` and a\n`question`. Never leave it blank.',
        ),
        blankRoutesNothingBack: judgingMarkdown.includes(
          'A blank sign-off routes nothing back to anybody, because nothing server-side reopens an unsigned\nunit.',
        ),
        blankSpendsThePtChain: judgingMarkdown.includes('A blank spends the pt chain as well.'),
        honestVerdictClears: judgingMarkdown.includes(
          'An honest `unconfirmable` clears\nthe gate. A blank never does.',
        ),
        // A verdict CLOSES the unit, so it can never stand in for a test that is merely still
        // unwritten. The old close reached for that half. This pin keeps it.
        missingTestIsNotUnconfirmable: judgingMarkdown.includes(
          '**A unit that simply needs a test nobody has written yet is NOT `unconfirmable`.**',
        ),
        missingTestGoesToRework: judgingMarkdown.includes(
          'Put it in your `NEXT: rework` line, where the next round picks it up.',
        ),
        aVerdictClosesTheUnit: judgingMarkdown.includes('A verdict CLOSES a unit permanently'),
        // This string names the claim the paragraph replaced. Nothing reopens an unsigned unit, so
        // no later pass ever picks the work up.
        noRoutesBackClaim: judgingMarkdown.includes(
          'an unsigned unit routes the work back to another pass',
        ),
      }).toStrictEqual({
        unsettleableIsUnconfirmable: true,
        blankRoutesNothingBack: true,
        blankSpendsThePtChain: true,
        honestVerdictClears: true,
        missingTestIsNotUnconfirmable: true,
        missingTestGoesToRework: true,
        aVerdictClosesTheUnit: true,
        noRoutesBackClaim: false,
      });
    });

    it('VALID: judgingMarkdown => is substantial enough to carry the shared contract', () => {
      expect(flowEvidenceContractStatics.judgingMarkdown.length).toBeGreaterThan(2000);
    });
  });

  describe('authoringMarkdown — where an author decides to assert', () => {
    it('VALID: authoringMarkdown => picks modality per observable rather than per flow', () => {
      const { authoringMarkdown } = flowEvidenceContractStatics;

      expect({
        heading: /^## Modality — chosen per OBSERVABLE, never per flow$/mu.test(authoringMarkdown),
        flowTypeIsOnlyAHint: authoringMarkdown.includes(
          'It never overrides the modality\nyou chose for a single observable.',
        ),
        operationalStillNeedsBrowser: authoringMarkdown.includes(
          'An `operational` flow carrying `ui-state` observables still needs a browser for those.',
        ),
        // Journey-vs-matrix and `checkSurface` answer different questions. A session that reads
        // them as competing picks one and drops the other. It writes a "journey" e2e that never
        // asserts at the layer the claim lives on, or a matrix that flattens a branchy flow into
        // one parameterized case.
        shapeVersusLayer: authoringMarkdown.includes(
          '**Two rules compose here. They never compete.**\n\n1. Journey-vs-matrix chooses the test SHAPE.\n2. `checkSurface` chooses the LAYER.',
        ),
        journeyIsOneTestPerPath: authoringMarkdown.includes(
          'A branchy flow is a\nJOURNEY: one test per path, driven end to end.',
        ),
        matrixIsParameterized: authoringMarkdown.includes(
          'A set of independent input combinations is a MATRIX,\none parameterized test over the combinations.',
        ),
        journeyRendersPerSurface: authoringMarkdown.includes(
          '- A branchy flow on a web surface is a journey rendered as e2e.\n- A branchy flow on a non-web surface is a journey rendered as integration.\n- A combination matrix is integration.',
        ),
        neitherOverridesTheOther: authoringMarkdown.includes(
          'Never let the shape you picked move an assertion off its `checkSurface`. Never let the layer you\npicked collapse a journey into one parameterized test.',
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
          'jsdom has no layout engine. Every measured\n  width reads 0.',
        ),
        textContentIsNotPaint: authoringMarkdown.includes(
          '`textContent`\n  proves a string is in the DOM, never that a user can read it.',
        ),
        namesTheLifecycleEvents: authoringMarkdown.includes(
          '(mount, reload, navigation, a second tab, a sweep that runs on mount)',
        ),
        rejectsDirectHelperCall: authoringMarkdown.includes(
          "That call proves the helper's shape\n  ONLY.",
        ),
        rejectsMockedFetch: authoringMarkdown.includes('That proves your mock, not the route'),
        rejectsWriteSpy: authoringMarkdown.includes(
          'The spy proves the call happened, never that what\n  landed is correct.',
        ),
        rejectsMockedSpawner: authoringMarkdown.includes(
          'A mocked spawner cannot prove the "zero processes\n  spawned" half of the claim at all.',
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

  // A check-surface map reaches a session through `get-qa-checklist`. That tool stamps a
  // `checkSurface` on every unit. It also prints a legend for the types that flow actually carries.
  // An earlier version restated that map here. The copy cost 1,850 characters in each of two
  // prompts. It was also wider and staler than the per-unit value both roles already hold. Both
  // roles fetch that value before they author or judge anything. These tests fail if the table
  // creeps back in.
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
          'That string is the\nauthoritative surface for that unit.',
        ),
        disagreementIsRejection: judgingMarkdown.includes(
          "Reject an assertion whose layer disagrees with its unit's\n`checkSurface`.",
        ),
      }).toStrictEqual({
        namesTheTool: true,
        showsNoArgumentsOfItsOwn: true,
        surfaceIsAuthoritative: true,
        disagreementIsRejection: true,
      });
    });
  });

  // CROSS-FILE. Both halves above are INTERPOLATED into other files, and each consumer hands a
  // different half to a different session. Nothing typechecks that split, and no test but these
  // ones spans this file and the files that read it. Every needle below is READ off the value the
  // consumer interpolates, never copied into a second place where it could drift quietly.
  describe('the two discipline packs that interpolate these halves', () => {
    // PAIR: `flowEvidenceContractStatics` and both packs. `discipline-below-browser` needs BOTH
    // halves — its worker authors and its reviewer judges. `discipline-browser-e2e` needs the
    // judging half alone, and its authoring half must stay absent: that worker chooses no modality.
    // A second copy of either half puts the same ~8,000 characters into two prompts at once, and a
    // copy drifts away from the value the other pack still interpolates. Neither session notices.
    it('VALID: both packs => carry each half in exactly the blocks that need it, once each', () => {
      const { judgingMarkdown, authoringMarkdown } = flowEvidenceContractStatics;
      const belowBrowser = [
        disciplineBelowBrowserStatics.operatorMarkdown,
        disciplineBelowBrowserStatics.plannerMarkdown,
        disciplineBelowBrowserStatics.workerMarkdown,
        disciplineBelowBrowserStatics.reviewerMarkdown,
      ];
      const browserE2e = [
        disciplineBrowserE2eStatics.operatorMarkdown,
        disciplineBrowserE2eStatics.plannerMarkdown,
        disciplineBrowserE2eStatics.workerMarkdown,
        disciplineBrowserE2eStatics.reviewerMarkdown,
      ];

      expect({
        neitherHalfContainsTheOther: [
          judgingMarkdown.includes(authoringMarkdown),
          authoringMarkdown.includes(judgingMarkdown),
        ],
        belowBrowserJudging: belowBrowser.map((block) => block.split(judgingMarkdown).length - 1),
        belowBrowserAuthoring: belowBrowser.map(
          (block) => block.split(authoringMarkdown).length - 1,
        ),
        browserE2eJudging: browserE2e.map((block) => block.split(judgingMarkdown).length - 1),
        browserE2eAuthoring: browserE2e.map((block) => block.split(authoringMarkdown).length - 1),
      }).toStrictEqual({
        neitherHalfContainsTheOther: [false, false],
        belowBrowserJudging: [0, 0, 0, 1],
        belowBrowserAuthoring: [0, 0, 1, 0],
        browserE2eJudging: [0, 0, 0, 1],
        browserE2eAuthoring: [0, 0, 0, 0],
      });
    });

    // PAIR: this block's verdict vocabulary and both packs' AUTHORED halves. The two verdicts come
    // off the bullets here; the four refused words come off the sentence that refuses them. Both
    // packs restate the vocabulary in their own words, so the token is what has to agree. A pack
    // that signed a `gap` — or left a unit blank — settles nothing: the completion gate refuses an
    // ABSENT sign-off, so the parent's `done` is refused, the round spends its pt chain to its
    // budget, and the quest blocks.
    it('VALID: both packs => sign in the verdict vocabulary this block defines, and name no refused one', () => {
      const { judgingMarkdown } = flowEvidenceContractStatics;
      const verdicts = Array.from(judgingMarkdown.matchAll(/^- \*\*`([a-z]+)`\*\* —/gmu)).flatMap(
        (match) => match.slice(1),
      );
      const refused = Array.from(
        judgingMarkdown
          .slice(
            judgingMarkdown.indexOf('There is no'),
            judgingMarkdown.indexOf('SIGN-OFF verdict'),
          )
          .matchAll(/`([a-z]+)`/gu),
      ).flatMap((match) => match.slice(1));
      const authoredHalves = [
        disciplineBelowBrowserStatics.reviewerMarkdown,
        disciplineBrowserE2eStatics.reviewerMarkdown,
      ].map((block) => block.split(judgingMarkdown).join(''));

      expect({
        verdicts,
        refused,
        verdictsMissingFromAPack: verdicts.filter((verdict) =>
          authoredHalves.some((half) => !half.includes(`\`${verdict}\``)),
        ),
        refusedWordsAPackSignsAnyway: refused.filter((word) =>
          authoredHalves.some((half) => half.includes(`\`${word}\``)),
        ),
      }).toStrictEqual({
        verdicts: ['confirmed', 'unconfirmable'],
        refused: ['defect', 'deferred', 'gap', 'recorded'],
        verdictsMissingFromAPack: [],
        refusedWordsAPackSignsAnyway: [],
      });
    });

    // PAIR: this block's sign-off FIELD names and `signoffTrackEligibilityStatics.byTrack`, which
    // assigns them — three denominators over two fields, because Flowrider and Groundstomper both
    // write `flowriderSignoff`. The names are read off the data. A third field added there and
    // never named here would leave that track judged against a contract that does not mention it.
    it('VALID: judgingMarkdown => names every sign-off field the eligibility statics assign, and no other', () => {
      const { judgingMarkdown } = flowEvidenceContractStatics;
      const tracks = Object.values(signoffTrackEligibilityStatics.byTrack);
      const fields = Array.from(new Set(tracks.map((track) => track.signoffField))).sort();

      expect({
        fields,
        moreDenominatorsThanFields: tracks.length > fields.length,
        fieldsThisBlockNeverNames: fields.filter(
          (field) => !judgingMarkdown.includes(`\`${field}\``),
        ),
        bothTracksMustSign: judgingMarkdown.includes(
          'A unit is done only when BOTH tracks have signed it.',
        ),
      }).toStrictEqual({
        fields: ['flowriderSignoff', 'siegemasterSignoff'],
        moreDenominatorsThanFields: true,
        fieldsThisBlockNeverNames: [],
        bothTracksMustSign: true,
      });
    });

    // PAIR: this block's provenance sentence and
    // `signoffTrackEligibilityStatics.byTrack.siegemaster.observableOrigins` — the only track
    // measured over every origin, so its list is the full one. `addedBy` is a SEPARATE axis from
    // the verdict, and a stale list here hands a reviewer an origin the gate does not count.
    it('VALID: judgingMarkdown => lists exactly the observable origins the eligibility statics carry', () => {
      const { judgingMarkdown } = flowEvidenceContractStatics;
      const sentence = judgingMarkdown.slice(
        judgingMarkdown.indexOf('Its values are'),
        judgingMarkdown.indexOf('It never answers'),
      );

      expect(
        Array.from(sentence.matchAll(/`([a-z]+)`/gu)).flatMap((match) => match.slice(1)),
      ).toStrictEqual([...signoffTrackEligibilityStatics.byTrack.siegemaster.observableOrigins]);
    });
  });
});
