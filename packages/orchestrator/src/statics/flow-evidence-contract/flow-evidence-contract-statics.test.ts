import { qaCheckSurfaceStatics } from '@dungeonmaster/shared/statics';

import { codeweaverPromptStatics } from '../codeweaver-prompt/codeweaver-prompt-statics';
import { flowriderPromptStatics } from '../flowrider-prompt/flowrider-prompt-statics';
import { flowriderReviewerStatics } from '../flowrider-reviewer/flowrider-reviewer-statics';
import { siegemasterWalkerStatics } from '../siegemaster-walker/siegemaster-walker-statics';
import { signoffTrackEligibilityStatics } from '../signoff-track-eligibility/signoff-track-eligibility-statics';
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

    it('VALID: judgingMarkdown => defines exactly two per-track verdicts over three tracks', () => {
      expect({
        heading:
          /^## Verdicts — a unit carries one sign-off per track, and there are three$/mu.test(
            flowEvidenceContractStatics.judgingMarkdown,
          ),
        perTrack: judgingMarkdown.includes(
          'A unit is settled PER TRACK, never once for everybody.',
        ),
        codeweaverIsAUnitTest: judgingMarkdown.includes(
          '| `codeweaverSignoff` | proven by a unit test, beside the code |',
        ),
        flowriderIsAFlowTest: judgingMarkdown.includes(
          '| `flowriderSignoff` | proven by a flow-perspective test |',
        ),
        siegemasterIsMeasured: judgingMarkdown.includes(
          '| `siegemasterSignoff` | holds when a person drives the real system |',
        ),
        unconfirmableNeedsAQuestion: judgingMarkdown.includes(
          'the contract refuses an `unconfirmable` carrying none.',
        ),
      }).toStrictEqual({
        heading: true,
        perTrack: true,
        codeweaverIsAUnitTest: true,
        flowriderIsAFlowTest: true,
        siegemasterIsMeasured: true,
        unconfirmableNeedsAQuestion: true,
      });
    });

    // NO GATE COUNTS SIGN-OFFS ANY MORE. The completion gate that refused a parent's `done` over an
    // absent sign-off is deleted, so the pressure that made a session reach for a verdict it could
    // not back is gone with it. This block has to say so, or a reader carries the old incentive:
    // sign something rather than leave a unit blank. The FALSE pins below name the three claims the
    // deleted gate made, so none of them can drift back in.
    it('VALID: judgingMarkdown => tells a reader an unsigned unit is honest, and claims no gate', () => {
      expect({
        unsignedIsHonest: judgingMarkdown.includes(
          '**An unsigned unit is honest, and nothing refuses a `done` over one.**',
        ),
        noGateCounts: judgingMarkdown.includes('No gate counts sign-offs.'),
        leaveItUnsigned: judgingMarkdown.includes(
          'leave a unit you did not reach unsigned rather than reaching for a verdict that closes it',
        ),
        missingTestIsNotUnconfirmable: judgingMarkdown.includes(
          '**A unit that simply needs a test nobody has written yet is NOT `unconfirmable`.**',
        ),
        missingTestGoesToRework: judgingMarkdown.includes('put it in your `NEXT: rework` line'),
        aVerdictClosesTheUnit: judgingMarkdown.includes('A verdict CLOSES a unit'),
        blankNeverClears: judgingMarkdown.includes(
          'A blank sign-off is the one thing that never clears',
        ),
        gateRefusesTheParentsDone: judgingMarkdown.includes(
          "the completion gate refuses your parent's `done`",
        ),
        blankSpendsThePtChain: judgingMarkdown.includes('the pt chain spends itself against it'),
      }).toStrictEqual({
        unsignedIsHonest: true,
        noGateCounts: true,
        leaveItUnsigned: true,
        missingTestIsNotUnconfirmable: true,
        missingTestGoesToRework: true,
        aVerdictClosesTheUnit: true,
        blankNeverClears: false,
        gateRefusesTheParentsDone: false,
        blankSpendsThePtChain: false,
      });
    });

    // No third verdict exists to hold a measured defect. Signing one as a verdict would leave the
    // unit's own positive expectation unanswered, because a defect is the INVERSE of an observable.
    // The defect goes into the spec as its own observable, where it takes its tracks' sign-offs.
    it('VALID: judgingMarkdown => routes a measured defect to a new observable rather than a third verdict', () => {
      expect({
        newObservable: judgingMarkdown.includes(
          '**A measured defect is a NEW observable, not a third verdict.**',
        ),
        inverseExpectation: judgingMarkdown.includes(
          'is the INVERSE expectation and belongs in the spec.',
        ),
        takesItsTracksSignoffs: judgingMarkdown.includes(
          "it arrives unsigned and then takes its tracks' sign-offs like every other unit.",
        ),
        noOtherVerdicts: judgingMarkdown.includes(
          '**There is no `defect`, `deferred`, `gap` or `recorded` SIGN-OFF verdict.**',
        ),
        twoIsTheWholeVocabulary: judgingMarkdown.includes(
          '`confirmed` and `unconfirmable` are the whole vocabulary.',
        ),
        provenanceIsSeparate: judgingMarkdown.includes('**Provenance is a SEPARATE axis.**'),
        // The blight ledger and its five dispositions are deleted. A reference to them here sends a
        // reader to a record that no longer exists and a tool that no longer answers.
        namesTheDeletedLedger: judgingMarkdown.includes('blightLedger'),
      }).toStrictEqual({
        newObservable: true,
        inverseExpectation: true,
        takesItsTracksSignoffs: true,
        noOtherVerdicts: true,
        twoIsTheWholeVocabulary: true,
        provenanceIsSeparate: true,
        namesTheDeletedLedger: false,
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
  describe('the two prompts that interpolate these halves', () => {
    // PAIR: `flowEvidenceContractStatics` and its two consumers. The flowrider OPERATOR chooses the
    // layer for every unit on its flow, so it takes the authoring half; the flowrider REVIEWER
    // grades the suite that came back, so it takes the judging half. Neither takes both — a reviewer
    // does not need the method that produced the artifact it grades, and a copy of either half in a
    // second prompt drifts away from the value the other consumer still interpolates, silently.
    it('VALID: both prompts => carry each half in exactly the prompt that needs it, once each', () => {
      // RAW on both sides: this counts BYTE-EXACT interpolations of each half into a prompt.
      const { judgingMarkdown: rawJudging, authoringMarkdown: rawAuthoring } =
        flowEvidenceContractStatics;
      const templates = [
        flowriderReviewerStatics.prompt.template,
        flowriderPromptStatics.prompt.template,
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
        judgingPerPrompt: [1, 0],
        authoringPerPrompt: [0, 1],
      });
    });

    // PAIR: this block's verdict vocabulary and the three prompts that actually WRITE a sign-off.
    // Those are not the three operators. Codeweaver and Flowrider sign from their sub-agents' PROVED
    // lines, wave by wave — but Siegemaster signs nothing: its WALKER does, because it is the only
    // session that ever drives the running system, and by the time anything else reads the record
    // that system state is gone. Only the flowrider prompt interpolates this half, so the other two
    // restate the vocabulary in their own words and the TOKEN is what has to agree. A prompt that
    // signed a `gap` or a `deferred` would write a verdict `signoffContract` rejects, and the write
    // fails at parse time.
    //
    // The judging half is subtracted byte-exactly from the flowrider prompt before the count, so
    // that prompt is measured on its own words rather than on the text it is being checked against.
    it('VALID: all three SIGNING prompts => sign in this vocabulary, and name no refused verdict', () => {
      // RAW: the verdict bullets are line-anchored, and the shared half is subtracted byte-exactly.
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
        codeweaverPromptStatics.prompt.template,
        flowriderPromptStatics.prompt.template,
        siegemasterWalkerStatics.prompt.template,
      ].map((template) => template.split(rawJudging).join(''));

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
    // assigns them. The names are read off the data, so a track added there and never named here
    // would leave that track judged against a contract that does not mention it. Each track now owns
    // exactly one field, which is what the three-row table in the verdicts section renders.
    it('VALID: judgingMarkdown => names every sign-off field the eligibility statics assign, and no other', () => {
      const tracks = Object.values(signoffTrackEligibilityStatics.byTrack);
      const fields = Array.from(new Set(tracks.map((track) => track.signoffField))).sort();

      expect({
        fields,
        fieldsThisBlockNeverNames: fields.filter(
          (field) => !judgingMarkdown.includes(`\`${field}\``),
        ),
      }).toStrictEqual({
        fields: ['codeweaverSignoff', 'flowriderSignoff', 'siegemasterSignoff'],
        fieldsThisBlockNeverNames: [],
      });
    });

    // PAIR: this block's provenance sentence and
    // `signoffTrackEligibilityStatics.byTrack.siegemaster.observableOrigins` — the only track
    // measured over every origin, so its list is the full one. `addedBy` is a SEPARATE axis from
    // the verdict, and a stale list here hands a reviewer an origin nothing else recognises.
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
