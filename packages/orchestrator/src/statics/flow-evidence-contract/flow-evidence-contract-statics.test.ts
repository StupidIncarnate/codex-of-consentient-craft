import { mcpToolResultStatics, qaCheckSurfaceStatics } from '@dungeonmaster/shared/statics';

import { codeweaverReviewerStatics } from '../codeweaver-reviewer/codeweaver-reviewer-statics';
import { flowriderReviewerStatics } from '../flowrider-reviewer/flowrider-reviewer-statics';
import { stepScopeStatics } from '../step-scope/step-scope-statics';
import { flowEvidenceContractStatics } from './flow-evidence-contract-statics';

// PROSE COMPARES IGNORE WRAPPING. `judgingMarkdown` is bound with every whitespace run — spaces,
// newlines, indent — collapsed to a single space, so a needle written on ONE line finds its
// sentence however the contract happens to wrap. Re-flowing a paragraph in the statics file then
// reds nothing that is still true, which is why no needle in this file carries an escaped newline.
// The two tests that measure the real bytes — the length floor, and the once-each interpolation
// count against the consuming prompts — name `flowEvidenceContractStatics` directly instead.
const WHITESPACE_RUN = /\s+/gu;

const judgingMarkdown = flowEvidenceContractStatics.judgingMarkdown.replace(WHITESPACE_RUN, ' ');

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

    // THE MECHANISM: a reviewer reads its scope via `get-quest-work`, marks every assigned unit via
    // `quest-work` observations, and calls `signal-back` itself. There is no parent and no per-track
    // sign-off — a unit carries exactly one of three marks, never a verdict per track.
    it('VALID: judgingMarkdown => defines exactly three marks, with no parent and no per-track sign-off', () => {
      expect({
        heading: /^## Marks — every assigned unit ends the pass carrying one of three$/mu.test(
          flowEvidenceContractStatics.judgingMarkdown,
        ),
        noBriefingAndNoTrackOfItsOwn: judgingMarkdown.includes(
          'nobody briefs this session and no track keeps a sign-off of its own.',
        ),
        metIsTheEvidenceContract: judgingMarkdown.includes(
          '**`met`** — you settled it. The evidence is **The Evidence Contract** above, all five items,',
        ),
        cantMeetNeedsToSettle: judgingMarkdown.includes(
          '**A `toSettle` is REQUIRED**; the contract refuses a `cant-meet` carrying none.',
        ),
        unmetMintsASuccessor: judgingMarkdown.includes(
          'marking a unit this way mints a successor scoped to exactly the units you marked `unmet`.',
        ),
      }).toStrictEqual({
        heading: true,
        noBriefingAndNoTrackOfItsOwn: true,
        metIsTheEvidenceContract: true,
        cantMeetNeedsToSettle: true,
        unmetMintsASuccessor: true,
      });
    });

    // A MISSING TEST IS WORK REMAINING, NEVER `cant-meet` — `cant-meet` is for a unit tried and not
    // reached; a test nobody wrote yet is `unmet`, which is what mints the successor that writes it.
    it('VALID: judgingMarkdown => a unit needing an unwritten test is unmet, not cant-meet', () => {
      expect({
        needsAnUnwrittenTestIsUnmet: judgingMarkdown.includes(
          '**A unit that simply needs a test nobody has written yet is NOT `cant-meet`.** Mark it `unmet` — that mints the `work` successor.',
        ),
      }).toStrictEqual({ needsAnUnwrittenTestIsUnmet: true });
    });

    // NOTHING COUNTS MARKS, AND NOTHING OFFERS A WAY TO STOP SHORT. The only gate is `signal-back`
    // refusing an unmarked unit BY NAME — never grading a mark's value — which is what stops a
    // session padding `met` to get past it.
    it('VALID: judgingMarkdown => refuses an unbacked met mark, and the only gate checks presence, not value', () => {
      expect({
        neverMarkMetUnsettled: judgingMarkdown.includes(
          '**Never mark `met` what you did not settle.**',
        ),
        gateChecksPresenceNotValue: judgingMarkdown.includes(
          'or `signal-back` refuses the call by name — but the gate checks only that a mark exists, never its VALUE.',
        ),
        paddingMetShipsUnprovenWork: judgingMarkdown.includes(
          'Padding `met` over an existence-only citation gets past that gate and ships a unit nobody proved',
        ),
        markingUnmetThatBitesIsWasted: judgingMarkdown.includes(
          'marking a unit `unmet` that a test genuinely bites sends it back out for nothing.',
        ),
      }).toStrictEqual({
        neverMarkMetUnsettled: true,
        gateChecksPresenceNotValue: true,
        paddingMetShipsUnprovenWork: true,
        markingUnmetThatBitesIsWasted: true,
      });
    });

    // No fourth mark exists to hold a measured defect. Signing one as a mark would leave the unit's
    // own positive expectation unanswered, because a defect is the INVERSE of an observable. The
    // defect goes into the spec as its own observable, where it takes its own marks.
    it('VALID: judgingMarkdown => routes a measured defect to a new observable rather than a fourth mark', () => {
      expect({
        newObservable: judgingMarkdown.includes(
          '**A measured defect is a NEW observable, not a third verdict.**',
        ),
        marksTheOriginUnmet: judgingMarkdown.includes(
          'mark the unit it came from `unmet`, naming the inverse expectation in its evidence,',
        ),
        noParentToHandItTo: judgingMarkdown.includes(
          'since a reviewer writes no spec of its own and there is no parent to hand one to.',
        ),
        noOtherVerdicts: judgingMarkdown.includes(
          '**There is no `defect`, `deferred`, `gap` or `recorded` SIGN-OFF verdict.**',
        ),
        threeIsTheWholeVocabulary: judgingMarkdown.includes(
          '`met`, `cant-meet` and `unmet` are the whole vocabulary.',
        ),
        provenanceIsSeparate: judgingMarkdown.includes('**Provenance is a SEPARATE axis.**'),
        // The blight ledger and its five dispositions are deleted. A reference to them here sends a
        // reader to a record that no longer exists and a tool that no longer answers.
        namesTheDeletedLedger: judgingMarkdown.includes('blightLedger'),
      }).toStrictEqual({
        newObservable: true,
        marksTheOriginUnmet: true,
        noParentToHandItTo: true,
        noOtherVerdicts: true,
        threeIsTheWholeVocabulary: true,
        provenanceIsSeparate: true,
        namesTheDeletedLedger: false,
      });
    });

    it('VALID: judgingMarkdown => is substantial enough to carry the shared contract and within verbatim ceiling', () => {
      expect(flowEvidenceContractStatics.judgingMarkdown.length).toBeGreaterThan(2000);
      expect(Buffer.byteLength(flowEvidenceContractStatics.judgingMarkdown, 'utf8')).toBeLessThan(
        mcpToolResultStatics.maxVerbatimChars,
      );
    });
  });

  // A check-surface map reaches a session through the `surface` field `get-quest-work` hands back
  // on every entry in `assignedUnits`. An earlier version restated that map here as a legend keyed
  // on `get-qa-checklist`. The copy cost characters in the served prompt and was also wider and
  // staler than the per-unit value the reviewer already holds. These tests fail if the table
  // creeps back in.
  describe('the check-surface map is deferred to get-quest-work, never restated', () => {
    it.each(Object.keys(qaCheckSurfaceStatics.byOutcomeType))(
      'VALID: {outcomeType: %s} => has no hand-rendered table row',
      (outcomeType) => {
        const row = `| \`${outcomeType}\` |`;

        expect({ hasRow: judgingMarkdown.includes(row) }).toStrictEqual({ hasRow: false });
      },
    );

    it.each(Object.values(qaCheckSurfaceStatics.byOutcomeType))(
      'VALID: {surface sentence} => is not copied verbatim',
      (surface) => {
        expect({ hasSurface: judgingMarkdown.includes(surface) }).toStrictEqual({
          hasSurface: false,
        });
      },
    );

    it("VALID: judgingMarkdown => sends the reader to the unit's own surface field instead", () => {
      expect({
        namesGetQuestWork: judgingMarkdown.includes(
          "Take it from the unit's own `surface` field on `get-quest-work`'s `assignedUnits`",
        ),
        namesTheRetiredTool: judgingMarkdown.includes('get-qa-checklist'),
        surfaceIsAuthoritative: judgingMarkdown.includes('and that string is authoritative'),
        disagreementIsRejection: judgingMarkdown.includes(
          'reject an assertion whose layer disagrees with it, on that disagreement alone.',
        ),
      }).toStrictEqual({
        namesGetQuestWork: true,
        namesTheRetiredTool: false,
        surfaceIsAuthoritative: true,
        disagreementIsRejection: true,
      });
    });
  });

  // CROSS-FILE. `judgingMarkdown` is INTERPOLATED into `flowriderReviewerStatics` alone. Nothing
  // typechecks that, and no test but these ones spans this file and the files that read it. Every
  // needle below is READ off the value the consumer interpolates, never copied into a second place
  // where it could drift quietly.
  describe('the reviewer prompts that consume or withhold this block', () => {
    // PAIR: `flowEvidenceContractStatics` and its reviewer consumers. The flowrider REVIEWER grades
    // the suite that came back, so it takes the judging block; `codeweaver-reviewer` withholds it
    // entirely — it opens product code, not a test suite.
    it('VALID: reviewer prompts => carry the judging block in exactly the prompt that needs it', () => {
      // RAW: this counts BYTE-EXACT interpolations of the block into a prompt.
      const { judgingMarkdown: rawJudging } = flowEvidenceContractStatics;
      const templates = [
        flowriderReviewerStatics.prompt.template,
        codeweaverReviewerStatics.prompt.template,
      ];

      expect({
        judgingPerPrompt: templates.map((template) => template.split(rawJudging).length - 1),
      }).toStrictEqual({
        judgingPerPrompt: [1, 0],
      });
    });

    it('VALID: flowriderReviewer => sign-off vocabulary contains no refused sign-off verdict', () => {
      const { judgingMarkdown: rawJudging } = flowEvidenceContractStatics;
      const refused = Array.from(
        rawJudging
          .slice(rawJudging.indexOf('There is no'), rawJudging.indexOf('SIGN-OFF verdict'))
          .matchAll(/`([a-z]+)`/gu),
      ).flatMap((match) => match.slice(1));
      const authoredFlowrider = flowriderReviewerStatics.prompt.template.split(rawJudging).join('');

      expect({
        refused,
        refusedWordsInPrompt: refused.filter((word) => authoredFlowrider.includes(`\`${word}\``)),
      }).toStrictEqual({
        refused: ['defect', 'deferred', 'gap', 'recorded'],
        refusedWordsInPrompt: [],
      });
    });

    // PAIR: this block's track names and `stepScopeStatics.byFamilyStep`, which defines the scope
    // per family step. The names are read off the step scope, so a track/family added there and
    // never named here would leave that track's provenance value unrecognisable to a reviewer.
    it('VALID: judgingMarkdown => names every track the step scope statics define, and no other', () => {
      const tracks = Object.keys(stepScopeStatics.byFamilyStep).sort();

      expect({
        tracks,
        tracksThisBlockNeverNames: tracks.filter(
          (track) => !judgingMarkdown.includes(`\`${track}\``),
        ),
      }).toStrictEqual({
        tracks: ['codeweaver', 'flowrider', 'siegemaster'],
        tracksThisBlockNeverNames: [],
      });
    });

    // PAIR: this block's provenance sentence and
    // `stepScopeStatics.byFamilyStep.siegemaster.happyWalk.observableOrigins` — the only step
    // measured over every origin, so its list is the full one. `addedBy` is a SEPARATE axis from the
    // mark, and a stale list here hands a reviewer an origin nothing else recognises.
    it('VALID: judgingMarkdown => lists exactly the observable origins the step scope statics carry', () => {
      const sentence = judgingMarkdown.slice(
        judgingMarkdown.indexOf('Its values are'),
        judgingMarkdown.indexOf('It never answers'),
      );

      expect(
        Array.from(sentence.matchAll(/`([a-z]+)`/gu)).flatMap((match) => match.slice(1)),
      ).toStrictEqual([...stepScopeStatics.byFamilyStep.siegemaster.happyWalk.observableOrigins]);
    });
  });
});
