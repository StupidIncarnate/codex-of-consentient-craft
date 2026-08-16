import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { blightConcernGatingStatics } from '../blight-concern-gating/blight-concern-gating-statics';
import { standardsReviewConcernsStatics } from './standards-review-concerns-statics';

const has = (needle: string): boolean => standardsReviewConcernsStatics.markdown.includes(needle);

describe('standardsReviewConcernsStatics', () => {
  it('VALID: exported value => is exactly one markdown block and nothing else', () => {
    expect(standardsReviewConcernsStatics).toStrictEqual({
      markdown: expect.stringMatching(/^.+$/su),
    });
  });

  it('VALID: markdown => stays under the MCP tool-result verbatim-delivery ceiling on its own', () => {
    expect(standardsReviewConcernsStatics.markdown.length).toBeLessThan(
      mcpToolResultStatics.maxVerbatimChars,
    );
  });

  // The block is interpolated into a template whose `$DISCIPLINE` / `$ARGUMENTS` placeholders are a
  // wire contract other agents depend on. A stray placeholder token in here would substitute a
  // second time and split one briefing across two places.
  it('VALID: markdown => carries neither template placeholder', () => {
    expect({
      discipline: has('$DISCIPLINE'),
      arguments: has('$ARGUMENTS'),
    }).toStrictEqual({ discipline: false, arguments: false });
  });

  describe('the framing that makes the five concerns worth reading', () => {
    // Without this, a reviewer re-derives naming / import / return-type findings lint already emits
    // and spends the whole pass on them.
    it('VALID: markdown => hands every mechanical rule to lint and keeps only the judgement', () => {
      expect({
        lintOwnsMechanical: has('Lint already enforces every mechanical rule'),
        namesTheRules: has(
          'naming, imports, exports, destructuring, return types,\nno-any, proxy colocation, stub usage, no-console, silent catches, unused and unreachable code',
        ),
        syntacticTestStructureToo: has(
          "pure syntactic test structure (name prefixes, `{input} => {expected}` titles, `describe` shape) is\nlint's domain too",
        ),
        skipAllOfIt: has('Skip ALL of it. What is left is the judgement a linter cannot make.'),
      }).toStrictEqual({
        lintOwnsMechanical: true,
        namesTheRules: true,
        syntacticTestStructureToo: true,
        skipAllOfIt: true,
      });
    });

    it('VALID: markdown => reads the discipline and the concerns as one reading, not two passes', () => {
      expect({
        oneReading: has(
          'Your discipline above and the five concerns below are ONE reading, not two passes.',
        ),
        allFivePerFile: has('take all five against it before you move to the next'),
      }).toStrictEqual({ oneReading: true, allFivePerFile: true });
    });
  });

  describe("scope — the round's own uncommitted files, never a commit", () => {
    // The parent has not committed when the reviewer runs, so a commit-shaped reading measures the
    // PREVIOUS round and comes back clean on files nobody opened.
    it("VALID: markdown => names get-blight-checklist with scope 'working-tree' and why that is the only correct scope", () => {
      expect({
        surfaceIsThisRound: has('**Your surface is the files THIS ROUND produced**'),
        theCall: has("get-blight-checklist({ questId: 'QUEST_ID', scope: 'working-tree' })"),
        onlyCorrectScope: has(
          "**`scope: 'working-tree'` is the only correct scope for you, and you must pass it.**",
        ),
        definesTheScope: has('It means\nchanged since HEAD, untracked files INCLUDED.'),
        parentHasNotCommitted: has('Your parent has not committed yet when you run'),
        commitReadsThePreviousRound: has(
          'a commit-shaped reading hands you the round BEFORE yours',
        ),
        diffMissesUntracked: has('every form of `git diff` reports tracked paths only'),
        unitIdGrammar: has("Each unit is id'd `<implPath>:<concern>`"),
      }).toStrictEqual({
        surfaceIsThisRound: true,
        theCall: true,
        onlyCorrectScope: true,
        definesTheScope: true,
        parentHasNotCommitted: true,
        commitReadsThePreviousRound: true,
        diffMissesUntracked: true,
        unitIdGrammar: true,
      });
    });
  });

  describe('the five concerns', () => {
    it('VALID: markdown => carries exactly the five concern headings, in checklist order, plus the two scope notes', () => {
      const headings = standardsReviewConcernsStatics.markdown
        .split('\n')
        .filter((line) => line.startsWith('### '));

      expect(headings).toStrictEqual([
        '### craft',
        '### perf',
        '### dedup',
        '### integrity',
        '### test-cases',
        '### Dead code is NOT one of your concerns',
        '### Two concerns are withheld from declaration-shaped files — that is the tool being RIGHT',
      ]);
    });

    // Lint proves the header EXISTS and nothing proves it is TRUE, so a false PURPOSE is served to
    // every later agent by `discover --verbose` as that file's primary description.
    it('VALID: craft => carries the PURPOSE-header-vs-body check and its four failure shapes', () => {
      expect({
        heading: has('**PURPOSE header vs body.**'),
        lintOnlyChecksExistence: has(
          'Lint checks the header EXISTS, never that it is TRUE, and no test or\n  typecheck reads a comment',
        ),
        discoverServesIt: has(
          "`discover --verbose` then serves it as that file's primary description to\n  every later agent",
        ),
        fourShapes: has('Four shapes to flag:'),
        shapeReturn: has('a return-shape claim the code contradicts'),
        shapeValidation: has(
          'a validation\n  claim the contract does not make (read the zod chain and what each `.refine()` tests, not what its\n  message says)',
        ),
        shapeFromName: has('a claim derived from the NAME rather than the body'),
        shapeRestatesSignature: has('a PURPOSE that only\n  restates the signature'),
        fixTheCommentNotTheCode: has('Correct the PURPOSE to what the code does NOW'),
        logicVsSignature: has('A `findLatest` that returns the first match is a finding.'),
      }).toStrictEqual({
        heading: true,
        lintOnlyChecksExistence: true,
        discoverServesIt: true,
        fourShapes: true,
        shapeReturn: true,
        shapeValidation: true,
        shapeFromName: true,
        shapeRestatesSignature: true,
        fixTheCommentNotTheCode: true,
        logicVsSignature: true,
      });
    });

    it('VALID: perf => keeps the hot-path judgement that stops a startup path being reported', () => {
      expect({
        judgeTheHotPath: has('**Judge the hot path.**'),
        likelyFinding: has('A request/websocket/orchestration path is a likely finding'),
        usuallyNot: has('a\nstartup/migration/one-off is usually not'),
        smallConstant: has('an array bounded to a small constant usually is not'),
        simplificationLivesHere: has('Plus **simplification**'),
      }).toStrictEqual({
        judgeTheHotPath: true,
        likelyFinding: true,
        usuallyNot: true,
        smallConstant: true,
        simplificationLivesHere: true,
      });
    });

    // A repo-scoped search is the whole mechanism: the earlier of a duplicate pair is already on
    // disk, and a search scoped to the round's own files can never see it.
    it("VALID: dedup => searches repo-wide and does not trust the repo's literal-only detector", () => {
      expect({
        repoWide: has("**Search REPO-WIDE, never within the round's own files.**"),
        namesTheFailure: has('lets two sessions ship the same function twice'),
        detectorPath: has('`packages/tooling/src/brokers/duplicate-detection/`'),
        literalsOnly: has('duplicate **string and regex literals ONLY**'),
        noAstComparison: has('no AST-shape comparison of any kind'),
        cleanRunSaysNothing: has(
          'a clean run\nfrom it says nothing about the duplication you are looking for',
        ),
        showYourWork: has(
          'name both implementations and state what you compared —\nparameters, return shapes, control flow — never that the text looked similar',
        ),
      }).toStrictEqual({
        repoWide: true,
        namesTheFailure: true,
        detectorPath: true,
        literalsOnly: true,
        noAstComparison: true,
        cleanRunSaysNothing: true,
        showYourWork: true,
      });
    });

    // The signature sweep is the expensive half and ward/tsc already own it; what is left is the
    // change that compiles and means something else.
    it('VALID: integrity => skips the signature sweep and owns the semantic change instead', () => {
      expect({
        toolsOwnCompilation: has(
          '`ward` and `tsc` already catch every consumer that stops COMPILING against a changed export',
        ),
        skipTheSweep: has('**skip the signature sweep entirely**'),
        whatIsLeft: has(
          'What you own is the change that typechecks and still MEANS\nsomething different',
        ),
        semanticShapes: has(
          'units, ordering, whether a bound is inclusive, what an empty array now signifies',
        ),
        enumerateConsumers: has('`discover` grep the export name to enumerate'),
        stubsKeepingSuitesGreen: has('**Stubs and fixtures that keep a suite green**'),
      }).toStrictEqual({
        toolsOwnCompilation: true,
        skipTheSweep: true,
        whatIsLeft: true,
        semanticShapes: true,
        enumerateConsumers: true,
        stubsKeepingSuitesGreen: true,
      });
    });

    // A present-but-vacuous assertion is the shape that passes ward and proves nothing, so presence
    // alone is explicitly not enough to clear the concern.
    it('VALID: test-cases => judges the assertion, not just its presence', () => {
      expect({
        everyAddedBranch: has('**Did every branch this round ADDED get a test at all?**'),
        walksTheControlFlow: has(
          'each `if`/`else`, each `switch` arm, each ternary, each optional chain, each `try`/`catch`, each\nearly return',
        ),
        judgeTheAssertion: has('Judge the assertion too, not just its presence'),
        vacuousCountsAsNone: has(
          'a test that asserts `rendered` or `was called`\nproves nothing and counts as NO case',
        ),
        writeTheMissingCase: has('Where a case is missing and you can write it, write it.'),
      }).toStrictEqual({
        everyAddedBranch: true,
        walksTheControlFlow: true,
        judgeTheAssertion: true,
        vacuousCountsAsNone: true,
        writeTheMissingCase: true,
      });
    });

    it('VALID: markdown => puts dead code out of scope with the reason it cannot be answered here', () => {
      expect({
        namesTheReason: has(
          'a property of the whole import graph AFTER every later round\nlands, which no single-round pass can answer',
        ),
        doNotHunt: has('Do not go hunting orphans.'),
        noDispositionOwed: has('it is not a unit you owe a disposition on'),
      }).toStrictEqual({
        namesTheReason: true,
        doNotHunt: true,
        noDispositionOwed: true,
      });
    });
  });

  // A reviewer that reads an absent unit as a hole either reviews it anyway or records a `gap` for a
  // question the checklist deliberately never asked. Both spend the pass the gating exists to save.
  describe('the checklist-level gating of perf and integrity', () => {
    it('VALID: markdown => tells the reviewer a withheld unit is the tool being right, not a gap', () => {
      expect({
        namesTheGatedPair: has(
          '`perf` and `integrity` are suppressed at the checklist level for declaration-shaped files',
        ),
        namesTheGatingStatics: has('`blight-concern-gating-statics.ts`'),
        withheldDeliberately: has(
          '**When those two units do not appear for such a file, the tool\nwithheld them deliberately.**',
        ),
        doNotReviewAnyway: has(
          'Do not review them anyway, and do not record their absence as a gap.',
        ),
        theMeasurement: has(
          'across 88 review units of exactly that file mix, `perf` and `integrity`\nproduced ZERO findings',
        ),
        propertyOfTheQuestion: has('That is a property of the question.'),
        otherThreeStillApply: has('The other three concerns apply to those files in\nfull'),
      }).toStrictEqual({
        namesTheGatedPair: true,
        namesTheGatingStatics: true,
        withheldDeliberately: true,
        doNotReviewAnyway: true,
        theMeasurement: true,
        propertyOfTheQuestion: true,
        otherThreeStillApply: true,
      });
    });

    // The prose names file KINDS while the gating names SUFFIXES, so nothing couples them
    // mechanically. Pinning the gating's own values here is that coupling: widen the gating without
    // widening the sentence and this goes red, instead of a reviewer being told to expect units the
    // tool now withholds (or the reverse — hunting for a concern nobody asked it).
    it('VALID: gating statics => still hold exactly the concerns and file kinds the prose describes', () => {
      expect({
        kindsNamed: has(
          '`*-contract.ts`, `*.stub.ts`, `*.proxy.ts`, test/e2e/harness files, and barrels',
        ),
        gatedConcerns: blightConcernGatingStatics.structurallyInertConcerns,
        gatedSuffixes: blightConcernGatingStatics.inertImplSuffixes,
        gatedBarrel: blightConcernGatingStatics.barrelBasename,
      }).toStrictEqual({
        kindsNamed: true,
        gatedConcerns: ['perf', 'integrity'],
        gatedSuffixes: [
          '-contract.ts',
          '.stub.ts',
          '.proxy.ts',
          '.proxy.tsx',
          '.test.ts',
          '.test.tsx',
          '.e2e.ts',
          '.harness.ts',
        ],
        gatedBarrel: 'index.ts',
      });
    });
  });

  describe('dispositions', () => {
    it('VALID: markdown => carries all five disposition rows with their meanings', () => {
      expect({
        reviewed: has('| `reviewed` | the concern was checked against this unit and holds |'),
        fixed: has('| `fixed` | a real defect was found here and corrected in place |'),
        routed: has(
          '| `routed` | a real user-visible defect needing a product decision; asked via `ask-user-question` |',
        ),
        recorded: has(
          '| `recorded` | a real finding handed to a named owner, not closed this round |',
        ),
        gap: has('| `gap` | the concern cannot be assessed at this layer — say precisely why |'),
        allFiveClear: has('**Every one of these clears a unit.**'),
        honestAnswers: has(
          '`gap` and `recorded` are honest answers, so the record can\nalways be completed truthfully',
        ),
        absenceIsRefused: has('What is never acceptable is a unit with NO entry at all.'),
      }).toStrictEqual({
        reviewed: true,
        fixed: true,
        routed: true,
        recorded: true,
        gap: true,
        allFiveClear: true,
        honestAnswers: true,
        absenceIsRefused: true,
      });
    });

    // The named consequence is the whole reason this one write is the exception to batching.
    it('VALID: markdown => records as you go and names what a mid-read death costs', () => {
      expect({
        theOneThingNotBatched: has('**These dispositions are the one thing you do NOT batch.**'),
        immediatelyPerConcern: has(
          'Write each one immediately after you\nfinish that concern for that file',
        ),
        deathAtFileFour: has(
          'a session that dies at file four otherwise loses every\ndisposition it earned',
        ),
        nothingReDerivesThem: has('nothing behind you re-derives them'),
      }).toStrictEqual({
        theOneThingNotBatched: true,
        immediatelyPerConcern: true,
        deathAtFileFour: true,
        nothingReDerivesThem: true,
      });
    });

    it('VALID: markdown => carries the modify-quest blightLedger payload and no client-supplied timestamp', () => {
      expect({
        call: has("modify-quest({ questId: 'QUEST_ID', planningNotes: { blightLedger: ["),
        itemIdFromChecklist: has("itemId: '<unit id from the checklist>'"),
        dispositionUnion: has("disposition: 'reviewed'|'fixed'|'routed'|'recorded'|'gap'"),
        evidenceIsConcrete: has("evidence: '<the concrete thing observed — never an adjective>'"),
        observedByIsTheMinion: has("observedBy: 'reviewer-minion'"),
        workItemFromBriefing: has("workItemId: '<the work item id your briefing names>'"),
        rippleAndOwner: has('`fixed` also carries `rippleSites`; `recorded` also carries `owner`.'),
        serverStampsTheTime: has(
          'Write no timestamp field —\nthe server stamps the time and a value you supply is ignored.',
        ),
        createdAtField: has('createdAt'),
        atField: has(" at: '"),
      }).toStrictEqual({
        call: true,
        itemIdFromChecklist: true,
        dispositionUnion: true,
        evidenceIsConcrete: true,
        observedByIsTheMinion: true,
        workItemFromBriefing: true,
        rippleAndOwner: true,
        serverStampsTheTime: true,
        createdAtField: false,
        atField: false,
      });
    });
  });

  // A minion has no work item of its own, so a `signal-back` reference would point it at its
  // parent's item and let it complete the parent's operation mid-round. Its parent owns every `git`
  // write on the session.
  describe('what a sub-agent reader must never be told to do', () => {
    it('VALID: markdown => mentions neither signal-back nor a git write', () => {
      expect({
        signalBack: has('signal-back'),
        gitCommit: has('git commit'),
        gitAdd: has('git add'),
        gitStash: has('git stash'),
      }).toStrictEqual({
        signalBack: false,
        gitCommit: false,
        gitAdd: false,
        gitStash: false,
      });
    });
  });
});
