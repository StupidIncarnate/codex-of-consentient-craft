import { qaCheckSurfaceStatics } from '@dungeonmaster/shared/statics';

import { flowriderReviewerMinionStatics } from '../flowrider-reviewer-minion/flowrider-reviewer-minion-statics';
import { flowriderWorkerMinionStatics } from '../flowrider-worker-minion/flowrider-worker-minion-statics';
import { groundstomperReviewerMinionStatics } from '../groundstomper-reviewer-minion/groundstomper-reviewer-minion-statics';
import { signoffTrackEligibilityStatics } from '../signoff-track-eligibility/signoff-track-eligibility-statics';
import { standardsReviewConcernsStatics } from '../standards-review-concerns/standards-review-concerns-statics';
import { flowEvidenceContractStatics } from './flow-evidence-contract-statics';

// PROSE COMPARES IGNORE WRAPPING. Both halves are bound with every whitespace run — spaces,
// newlines, indent — collapsed to a single space, so a needle written on ONE line finds its
// sentence however the contract happens to wrap. Re-flowing a paragraph in the statics file then
// reds nothing that is still true, which is why no needle in this file carries an escaped newline.
// The two tests that measure the real bytes — the length floor, and the once-each interpolation
// count against the consuming prompts — name `flowEvidenceContractStatics` directly instead.
const WHITESPACE_RUN = /\s+/gu;

const judgingMarkdown = flowEvidenceContractStatics.judgingMarkdown.replace(WHITESPACE_RUN, ' ');
const authoringMarkdown = flowEvidenceContractStatics.authoringMarkdown.replace(
  WHITESPACE_RUN,
  ' ',
);

describe('flowEvidenceContractStatics', () => {
  describe('judgingMarkdown — what a reviewer accepts or rejects an artifact against', () => {
    it('VALID: judgingMarkdown => starts with the evidence-contract heading', () => {
      const needle = '## The Evidence Contract — what makes an observable COVERED';

      expect(judgingMarkdown.slice(0, needle.length)).toBe(needle);
    });

    it('VALID: judgingMarkdown => states all five evidence items in order', () => {
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
        '"Fails if the text is wrong" is not an answer. "Fails if the row renders the older comment first, because the assertion pins the exact order `[newer, older]`" is one.';
      const found = judgingMarkdown.slice(
        judgingMarkdown.indexOf(needle),
        judgingMarkdown.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: judgingMarkdown => catalogues every known false green', () => {
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
      expect({
        heading: /^## Verdicts — every unit carries TWO independent sign-offs$/mu.test(
          flowEvidenceContractStatics.judgingMarkdown,
        ),
        perTrack: judgingMarkdown.includes(
          'A unit is settled PER TRACK, never once for everybody.',
        ),
        bothTracksMustSign: judgingMarkdown.includes(
          'A unit is done only when BOTH tracks have signed it.',
        ),
        bothVerdictsClear: judgingMarkdown.includes(
          '**Both verdicts CLEAR the completion gate — it refuses an ABSENT sign-off and nothing else.**',
        ),
        confirmedNeedsAFailure: judgingMarkdown.includes(
          'a test `file:line` PLUS what makes that test fail',
        ),
        confirmedIsMeasuredForSiegemaster: judgingMarkdown.includes(
          'Siegemaster: the value you measured off the running system.',
        ),
        unconfirmableNeedsAQuestion: judgingMarkdown.includes(
          'the contract refuses an `unconfirmable` carrying none.',
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
      expect({
        newObservable: judgingMarkdown.includes(
          '**A measured defect is a NEW observable, not a third verdict.**',
        ),
        inverseExpectation: judgingMarkdown.includes(
          'is the INVERSE expectation and belongs in the spec.',
        ),
        carriesItsOwnSignoffs: judgingMarkdown.includes(
          'it arrives unsigned and then carries its own two sign-offs like every other unit.',
        ),
        noOtherVerdicts: judgingMarkdown.includes(
          '**There is no `defect`, `deferred`, `gap` or `recorded` SIGN-OFF verdict**',
        ),
        // Without that qualifier, the two blocks read as one vocabulary contradicting itself. The
        // same composed reviewer prompt carries the standing concerns' disposition table, where
        // `gap` and `recorded` are honest answers that CLEAR a unit.
        dispositionsAreADifferentRecord: judgingMarkdown.includes(
          "the standing concerns' `blightLedger` dispositions are a separate record with a vocabulary of their own.",
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
      expect({
        blankIsTheOneThingThatNeverClears: judgingMarkdown.includes(
          '**A blank sign-off is the one thing that never clears.**',
        ),
        blankRoutesNothingBack: judgingMarkdown.includes(
          'Nothing server-side reopens an unsigned unit',
        ),
        blankRefusesTheParentsDone: judgingMarkdown.includes(
          "the completion gate refuses your parent's `done` while a unit carries no sign-off",
        ),
        blankSpendsThePtChain: judgingMarkdown.includes('the pt chain spends itself against it'),
        honestVerdictClears: judgingMarkdown.includes(
          'An honest `unconfirmable` clears that gate.',
        ),
        // A verdict CLOSES the unit, so it can never stand in for a test that is merely still
        // unwritten. The old close reached for that half. This pin keeps it.
        missingTestIsNotUnconfirmable: judgingMarkdown.includes(
          '**A unit that simply needs a test nobody has written yet is NOT `unconfirmable`.**',
        ),
        missingTestGoesToRework: judgingMarkdown.includes('put it in your `NEXT: rework` line'),
        aVerdictClosesTheUnit: judgingMarkdown.includes('A verdict CLOSES a unit permanently'),
        // This string names the claim the paragraph replaced. Nothing reopens an unsigned unit, so
        // no later pass ever picks the work up.
        noRoutesBackClaim: judgingMarkdown.includes(
          'an unsigned unit routes the work back to another pass',
        ),
      }).toStrictEqual({
        blankIsTheOneThingThatNeverClears: true,
        blankRoutesNothingBack: true,
        blankRefusesTheParentsDone: true,
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
      expect({
        heading: /^## Modality — chosen per OBSERVABLE, never per flow$/mu.test(
          flowEvidenceContractStatics.authoringMarkdown,
        ),
        flowTypeIsOnlyAHint: authoringMarkdown.includes(
          'It never overrides the modality you chose for a single observable.',
        ),
        operationalStillNeedsBrowser: authoringMarkdown.includes(
          'An `operational` flow carrying `ui-state` observables still needs a browser for those.',
        ),
        // Journey-vs-matrix and `checkSurface` answer different questions. A session that reads
        // them as competing picks one and drops the other. It writes a "journey" e2e that never
        // asserts at the layer the claim lives on, or a matrix that flattens a branchy flow into
        // one parameterized case.
        shapeVersusLayer: authoringMarkdown.includes(
          '**Two rules compose here. They never compete.** 1. Journey-vs-matrix chooses the test SHAPE. 2. `checkSurface` chooses the LAYER.',
        ),
        journeyIsOneTestPerPath: authoringMarkdown.includes(
          'A branchy flow is a JOURNEY: one test per path, driven end to end.',
        ),
        matrixIsParameterized: authoringMarkdown.includes(
          'A set of independent input combinations is a MATRIX, one parameterized test over the combinations.',
        ),
        journeyRendersPerSurface: authoringMarkdown.includes(
          '- A branchy flow on a web surface is a journey rendered as e2e. - A branchy flow on a non-web surface is a journey rendered as integration. - A combination matrix is integration.',
        ),
        neitherOverridesTheOther: authoringMarkdown.includes(
          'Never let the shape you picked move an assertion off its `checkSurface`. Never let the layer you picked collapse a journey into one parameterized test.',
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
      expect({
        jsdomHasNoLayout: authoringMarkdown.includes(
          'jsdom has no layout engine. Every measured width reads 0.',
        ),
        textContentIsNotPaint: authoringMarkdown.includes(
          '`textContent` proves a string is in the DOM, never that a user can read it.',
        ),
        namesTheLifecycleEvents: authoringMarkdown.includes(
          '(mount, reload, navigation, a second tab, a sweep that runs on mount)',
        ),
        rejectsDirectHelperCall: authoringMarkdown.includes(
          "That call proves the helper's shape ONLY.",
        ),
        rejectsMockedFetch: authoringMarkdown.includes('That proves your mock, not the route'),
        rejectsWriteSpy: authoringMarkdown.includes(
          'The spy proves the call happened, never that what landed is correct.',
        ),
        rejectsMockedSpawner: authoringMarkdown.includes(
          'A mocked spawner cannot prove the "zero processes spawned" half of the claim at all.',
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
        expect({
          judging: judgingMarkdown.includes(surface),
          authoring: authoringMarkdown.includes(surface),
        }).toStrictEqual({ judging: false, authoring: false });
      },
    );

    it('VALID: judgingMarkdown => sends the reader to the checklist for the surface instead', () => {
      expect({
        namesTheTool: judgingMarkdown.includes('`get-qa-checklist` prints a'),
        showsNoArgumentsOfItsOwn: !judgingMarkdown.includes('get-qa-checklist({'),
        surfaceIsAuthoritative: judgingMarkdown.includes('and that string is authoritative'),
        disagreementIsRejection: judgingMarkdown.includes(
          'reject an assertion whose layer disagrees with it, on that disagreement alone.',
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
  describe('the three prompts that interpolate these halves', () => {
    // PAIR: `flowEvidenceContractStatics` and its three consumers. The two REVIEWER prompts take
    // the judging half and must never take the authoring one — a reviewer does not need the method
    // that produced the artifact it grades — and the flowrider WORKER prompt takes the authoring
    // half alone. A second copy of either half puts the same thousands of characters into two
    // prompts at once, and a copy drifts away from the value the other consumers still
    // interpolate. No session notices.
    it('VALID: all three prompts => carry each half in exactly the prompt that needs it, once each', () => {
      // RAW on both sides: this counts BYTE-EXACT interpolations of each half into a prompt.
      const { judgingMarkdown: rawJudging, authoringMarkdown: rawAuthoring } =
        flowEvidenceContractStatics;
      const templates = [
        flowriderReviewerMinionStatics.prompt.template,
        groundstomperReviewerMinionStatics.prompt.template,
        flowriderWorkerMinionStatics.prompt.template,
      ];

      expect({
        neitherHalfContainsTheOther: [
          rawJudging.includes(rawAuthoring),
          rawAuthoring.includes(rawJudging),
        ],
        judgingPerPrompt: templates.map((template) => template.split(rawJudging).length - 1),
        authoringPerPrompt: templates.map((template) => template.split(rawAuthoring).length - 1),
      }).toStrictEqual({
        neitherHalfContainsTheOther: [false, false],
        judgingPerPrompt: [1, 1, 0],
        authoringPerPrompt: [0, 0, 1],
      });
    });

    // PAIR: this block's verdict vocabulary and what each reviewer prompt AUTHORS ITSELF. The two
    // verdicts come off the bullets here; the four refused words come off the sentence that refuses
    // them. Both prompts restate the vocabulary in their own words, so the token is what has to
    // agree. A prompt that signed a `gap` — or left a unit blank — settles nothing: the completion
    // gate refuses an ABSENT sign-off, so the parent's `done` is refused, the round spends its pt
    // chain to its budget, and the quest blocks.
    //
    // BOTH shared blocks are subtracted byte-exactly before the count, and each for its own reason.
    // This half is subtracted so the prompt is measured on its own words rather than on the text it
    // is being checked against. `standardsReviewConcernsStatics` is subtracted because its
    // disposition table legitimately spells `gap` and `recorded` — a DIFFERENT record with a
    // vocabulary of its own, which is exactly what the sentence in this half says.
    it('VALID: both reviewer prompts => sign in the verdict vocabulary this block defines, and name no refused one', () => {
      // RAW: the verdict bullets are line-anchored, and the shared blocks are subtracted byte-exactly.
      const { judgingMarkdown: rawJudging } = flowEvidenceContractStatics;
      const verdicts = Array.from(rawJudging.matchAll(/^- \*\*`([a-z]+)`\*\* —/gmu)).flatMap(
        (match) => match.slice(1),
      );
      const refused = Array.from(
        rawJudging
          .slice(rawJudging.indexOf('There is no'), rawJudging.indexOf('SIGN-OFF verdict'))
          .matchAll(/`([a-z]+)`/gu),
      ).flatMap((match) => match.slice(1));
      const authoredHalves = [
        flowriderReviewerMinionStatics.prompt.template,
        groundstomperReviewerMinionStatics.prompt.template,
      ].map((template) =>
        template.split(rawJudging).join('').split(standardsReviewConcernsStatics.markdown).join(''),
      );

      expect({
        verdicts,
        refused,
        verdictsMissingFromAPrompt: verdicts.filter((verdict) =>
          authoredHalves.some((half) => !half.includes(`\`${verdict}\``)),
        ),
        refusedWordsAPromptSignsAnyway: refused.filter((word) =>
          authoredHalves.some((half) => half.includes(`\`${word}\``)),
        ),
      }).toStrictEqual({
        verdicts: ['confirmed', 'unconfirmable'],
        refused: ['defect', 'deferred', 'gap', 'recorded'],
        verdictsMissingFromAPrompt: [],
        refusedWordsAPromptSignsAnyway: [],
      });
    });

    // PAIR: this block's sign-off FIELD names and `signoffTrackEligibilityStatics.byTrack`, which
    // assigns them — three denominators over two fields, because Flowrider and Groundstomper both
    // write `flowriderSignoff`. The names are read off the data. A third field added there and
    // never named here would leave that track judged against a contract that does not mention it.
    it('VALID: judgingMarkdown => names every sign-off field the eligibility statics assign, and no other', () => {
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
