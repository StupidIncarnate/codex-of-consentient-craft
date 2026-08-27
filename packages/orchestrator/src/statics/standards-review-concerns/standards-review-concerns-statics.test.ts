import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { blightConcernGatingStatics } from '../blight-concern-gating/blight-concern-gating-statics';
import { standardsReviewConcernsStatics } from './standards-review-concerns-statics';

// PROSE COMPARES IGNORE WRAPPING. `has` collapses every whitespace run — spaces, newlines, indent —
// on BOTH sides before it matches, so a needle written on one line finds its sentence however the
// markdown happens to wrap. Re-flowing a paragraph in the statics file then reds nothing that is
// still true, which is why no needle below carries an escaped newline. Anything measuring the real
// bytes reads `standardsReviewConcernsStatics.markdown` directly instead.
const WHITESPACE_RUN = /\s+/gu;
const FLAT_MARKDOWN = standardsReviewConcernsStatics.markdown.replace(WHITESPACE_RUN, ' ');

const has = (needle: string): boolean =>
  FLAT_MARKDOWN.includes(needle.replace(WHITESPACE_RUN, ' '));

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

  // The reviewer template embeds this block. One substitution pass then replaces that template's
  // `$DISCIPLINE` / `$ARGUMENTS` placeholders, which other agents depend on as a wire contract. The
  // same pass would replace either token sitting in here. One briefing would then split across two
  // places.
  it('VALID: markdown => carries neither template placeholder', () => {
    expect({
      discipline: has('$DISCIPLINE'),
      arguments: has('$ARGUMENTS'),
    }).toStrictEqual({ discipline: false, arguments: false });
  });

  describe('the framing that makes the five concerns worth reading', () => {
    // Without this framing, a reviewer re-derives naming, import and return-type findings lint
    // already emits. It then spends the whole pass on them.
    it('VALID: markdown => keeps only the judgement a linter cannot make', () => {
      expect({
        skipEveryMechanicalRule: has('Skip every mechanical rule'),
        syntacticTestStructureToo: has('and pure syntactic test structure with it'),
        lintOwnsMechanical: has('Lint already enforces both.'),
        namesTheRules: has(
          'naming, imports, exports, destructuring, return types, no-any, proxy colocation, stub usage, no-console, silent catches, unused and unreachable code',
        ),
        namesTheTestStructureRules: has(
          'name prefixes, `{input} => {expected}` titles, `describe` shape',
        ),
        skipAllOfIt: has('What is left is the judgement a linter cannot make.'),
      }).toStrictEqual({
        skipEveryMechanicalRule: true,
        syntacticTestStructureToo: true,
        lintOwnsMechanical: true,
        namesTheRules: true,
        namesTheTestStructureRules: true,
        skipAllOfIt: true,
      });
    });

    it('VALID: markdown => reads the discipline and the concerns as one reading, not two passes', () => {
      expect({
        oneReading: has(
          '**The per-file questions your own prompt sets, and the five concerns below, are ONE reading**',
        ),
        allFivePerFile: has('take them all against it before you move to the next'),
      }).toStrictEqual({ oneReading: true, allFivePerFile: true });
    });
  });

  describe('the scope that frames one round', () => {
    // THE ROUND IS UNCOMMITTED WHEN THIS RUNS, so `working-tree` is the only scope that can see it.
    // This block said `unpushed` for as long as worker-minions committed their own chunks. They no
    // longer do, and the text outlived the premise: before its reviewer commits, `@{upstream}..HEAD`
    // holds the PLANNER's commit of the round document and nothing else, so `unpushed` handed back a
    // checklist over one markdown file — green-looking, with not a line of the round's code in it.
    // Each of the other three scopes still fails this session in its own direction:
    //   1. `unpushed` sees the plan commit alone.
    //   2. `commit` sees that same plan commit.
    //   3. `quest` buries the round in work already dispositioned.
    it("VALID: markdown => makes scope 'working-tree' the only scope this reviewer may pass", () => {
      expect({
        surfaceIsThisRound: has(
          '**Your surface is the files THIS ROUND produced, and they are UNCOMMITTED when you enumerate.**',
        ),
        theCall: has("get-blight-checklist({ questId: 'QUEST_ID', scope: 'working-tree' })"),
        onlyCorrectScope: has(
          "**On a whole-round brief, `scope: 'working-tree'` is the only correct scope and you must pass it.**",
        ),
        definesTheScope: has('It measures everything changed since `HEAD` and not yet committed'),
        // `git diff` in every form reports TRACKED paths only, and a fresh round is mostly net-new
        // files — so a scope blind to untracked additions returns green having opened none of them.
        namesUntracked: has('**including untracked files**'),
        noIdToPass: has('You pass no id and name no range'),
        unpushedSeesThePlanCommit: has('| `unpushed` | the PLAN COMMIT and nothing else'),
        commitSeesTheSame: has('| `commit` | that same plan commit, alone |'),
        questBuriesTheRound: has('| `quest` | every file every session has ever touched'),
        unitIdGrammar: has(
          '`<implPath>:<concern>` is the id of one unit — one implementation file crossed with one concern.',
        ),
        // ORDER, and it is the whole of why this scope works. Commit first and `working-tree` is
        // empty, which reads downstream as "nothing to review" and dispositions nothing.
        enumerateBeforeTheCommit: has('**Enumerate BEFORE you commit, never after.**'),
        namesWhatCommittingFirstCosts: has('this call dispositions nothing'),
        // Pinned ABSENT: the scope this replaced, and the premise that justified it.
        stillMandatesUnpushed: has("`scope: 'unpushed'` is the only correct scope"),
        stillClaimsWorkersCommitted: has('the workers already committed the round'),
      }).toStrictEqual({
        surfaceIsThisRound: true,
        theCall: true,
        onlyCorrectScope: true,
        definesTheScope: true,
        namesUntracked: true,
        noIdToPass: true,
        unpushedSeesThePlanCommit: true,
        commitSeesTheSame: true,
        questBuriesTheRound: true,
        unitIdGrammar: true,
        enumerateBeforeTheCommit: true,
        namesWhatCommittingFirstCosts: true,
        stillMandatesUnpushed: false,
        stillClaimsWorkersCommitted: false,
      });
    });

    // The post-push re-review is the only brief that may read a wider scope. This block names that
    // brief in the same words the brief itself uses, so a session cannot reason its way to `quest`
    // on its own.
    it("VALID: markdown => opens scope 'quest' only to the brief that names it", () => {
      expect({
        theOneException: has(
          '**There is ONE exception, and you know it by the brief line `SECTION: Re-review`.**',
        ),
        theTreeIsCleanThere: has('the working tree is clean, so'),
        questOverReports: has(
          'It over-reports — units earlier rounds dispositioned come back marked done',
        ),
        spansAPushedRound: has('it is the only agent-facing scope that still spans a pushed round'),
        thePromptNamesTheStep: has('**Your own prompt names the step that makes the call.**'),
      }).toStrictEqual({
        theOneException: true,
        theTreeIsCleanThere: true,
        questOverReports: true,
        spansAPushedRound: true,
        thePromptNamesTheStep: true,
      });
    });
  });

  describe('the five concerns', () => {
    it('VALID: markdown => carries exactly these seven headings in this order', () => {
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
        '### Two concerns are withheld from declaration-shaped files',
      ]);
    });

    // Lint proves the header EXISTS. Nothing proves it is TRUE. `discover --verbose` then serves a
    // false PURPOSE to every later agent as that file's primary description.
    it('VALID: craft => carries the PURPOSE-header-vs-body check with its four failure shapes', () => {
      expect({
        heading: has('**PURPOSE header vs body.**'),
        lintOnlyChecksExistence: has(
          'Lint checks the header EXISTS; nothing checks it is TRUE, because no test and no typecheck reads a comment.',
        ),
        discoverServesIt: has(
          "`discover --verbose` then serves it as that file's primary description to every later agent",
        ),
        fourShapes: has('Four shapes to flag:'),
        shapeReturn: has('a return-shape claim the code contradicts'),
        shapeValidation: has('a validation claim the contract does not make'),
        // Judge shape 2 against what the zod chain tests, never against the message the `.refine()`
        // carries. A message is a claim about the check, not the check.
        readTheZodChainNotTheMessage: has(
          'read the zod chain itself and what each `.refine()` tests; never take the `.refine()` message as the claim.',
        ),
        shapeFromName: has('a claim derived from the NAME rather than the body'),
        shapeRestatesSignature: has('a PURPOSE that only restates the signature'),
        fixTheCommentNotTheCode: has('Correct the PURPOSE to what the code does NOW'),
        logicVsSignature: has('A `findLatest` that returns the first match is a finding.'),
      }).toStrictEqual({
        heading: true,
        lintOnlyChecksExistence: true,
        discoverServesIt: true,
        fourShapes: true,
        shapeReturn: true,
        shapeValidation: true,
        readTheZodChainNotTheMessage: true,
        shapeFromName: true,
        shapeRestatesSignature: true,
        fixTheCommentNotTheCode: true,
        logicVsSignature: true,
      });
    });

    it('VALID: perf => keeps the hot-path judgement that stops a startup path being reported', () => {
      expect({
        judgeTheHotPath: has('**Judge the hot path.**'),
        likelyFinding: has('| a request, websocket or orchestration path | likely |'),
        usuallyNot: has('| a startup, migration or one-off path | usually not |'),
        smallConstant: has('| an array bounded to a small constant | usually not |'),
        simplificationLivesHere: has('Plus **simplification**'),
      }).toStrictEqual({
        judgeTheHotPath: true,
        likelyFinding: true,
        usuallyNot: true,
        smallConstant: true,
        simplificationLivesHere: true,
      });
    });

    // A repo-scoped search is the whole mechanism. The earlier of a duplicate pair is already on
    // disk, and a search scoped to the round's own files can never see it.
    it("VALID: dedup => makes structural duplication the reviewer's own repo-wide judgement", () => {
      expect({
        repoWide: has("**Search REPO-WIDE, never within the round's own files.**"),
        namesTheFailure: has('two sessions ship the same function twice'),
        detectorPath: has('`packages/tooling/src/brokers/duplicate-detection/`'),
        literalsOnly: has('duplicate **string and regex literals ONLY**'),
        noAstComparison: has('and compares no AST shapes'),
        cleanRunSaysNothing: has(
          'so a clean run from it says nothing about the duplicate code you are looking for',
        ),
        showYourWork: has(
          'name both implementations and state what you compared — parameters, return shapes, control flow. Never report that the text looked similar.',
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

    // The signature sweep is the expensive half, and ward and tsc already own it. What is left is
    // the change that compiles and means something else.
    it('VALID: integrity => scopes the concern to the change that typechecks and means something else', () => {
      expect({
        toolsOwnCompilation: has(
          '`ward` and `tsc` already catch every consumer that stops COMPILING.',
        ),
        skipTheSweep: has('**Skip the signature sweep entirely**'),
        whatIsLeft: has(
          'What you own is the change that typechecks and still MEANS something different:',
        ),
        semanticShapes: has(
          'units, ordering, whether a bound is inclusive, what an empty array now signifies',
        ),
        enumerateConsumers: has(
          '`discover` grep the export name to enumerate consumers across the monorepo',
        ),
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

    // A present-but-vacuous assertion is the shape that passes ward and proves nothing. Presence
    // alone is explicitly not enough to clear the concern.
    it('VALID: test-cases => judges the assertion, not just its presence', () => {
      expect({
        everyAddedBranch: has('**Did every branch this round ADDED get a test at all?**'),
        walksTheControlFlow: has(
          'each `if`/`else`, each `switch` arm, each ternary, each optional chain, each `try`/`catch`, each early return',
        ),
        judgeTheAssertion: has('Judge the assertion too, not just its presence'),
        vacuousCountsAsNone: has(
          'A test that asserts `rendered` or `was called` proves nothing and counts as NO case.',
        ),
        writeTheMissingCase: has('Write the missing case yourself where you can.'),
      }).toStrictEqual({
        everyAddedBranch: true,
        walksTheControlFlow: true,
        judgeTheAssertion: true,
        vacuousCountsAsNone: true,
        writeTheMissingCase: true,
      });
    });

    it('VALID: markdown => puts dead code outside this pass entirely', () => {
      expect({
        namesTheReason: has(
          'a property of the whole import graph AFTER every later round lands. You cannot answer that from inside one round.',
        ),
        doNotHunt: has('Do not go hunting orphans.'),
        noDispositionOwed: has('That deletion is still not a unit you owe a disposition on.'),
      }).toStrictEqual({
        namesTheReason: true,
        doNotHunt: true,
        noDispositionOwed: true,
      });
    });
  });

  // A reviewer that reads an absent unit as a hole either reviews it anyway or records a `gap` for
  // a question the checklist deliberately never asked. Both spend the review pass that gating
  // exists to save.
  describe('the checklist-level gating of perf and integrity', () => {
    it('VALID: markdown => tells the reviewer a withheld unit is the tool being right, not a gap', () => {
      expect({
        namesTheGatedPair: has(
          'The checklist itself withholds `perf` and `integrity` from declaration-shaped files',
        ),
        namesTheGatingStatics: has('`blight-concern-gating-statics.ts`'),
        withheldDeliberately: has(
          '**When those two units do not appear for such a file, the tool withheld them deliberately.**',
        ),
        doNotReviewAnyway: has(
          'Do not review them anyway, and do not record their absence as a gap.',
        ),
        theMeasurement: has(
          'Across 88 review units of exactly that file mix, `perf` and `integrity` produced ZERO findings',
        ),
        propertyOfTheQuestion: has('That ZERO comes from the question itself'),
        otherThreeStillApply: has('The other three concerns apply to those files in full.'),
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

    // The prose names file KINDS. The gating names SUFFIXES. Nothing couples the two mechanically,
    // so pinning the gating's own values here is that coupling. Widen the gating without widening
    // the sentence and this goes red. Without it, a reviewer is told to expect units the tool now
    // withholds, or is sent hunting for a concern nobody asked it.
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
        reviewed: has('| `reviewed` | you checked the concern against this unit. It holds. |'),
        fixed: has('| `fixed` | you found a real defect here. You corrected it in place. |'),
        // `routed` used to read "asked via `ask-user-question`", which a minion cannot act on. A
        // minion runs inside its parent's turn, so no human sees the question and nothing resumes
        // it with an answer. It now routes through the one channel the parent does read.
        routed: has(
          '| `routed` | a real finding needing a decision this round cannot make. Name it in your `NEXT: rework` line, or no later session ever acts on it. |',
        ),
        recorded: has(
          '| `recorded` | you handed a real finding to a named owner outside this quest. It is not closed this round. |',
        ),
        noQuestionTool: has('ask-user-question'),
        saysWhyNoQuestions: has('**You have no way to ask the user anything.**'),
        insideTheParentsTurn: has(
          "You are a sub-agent inside your parent's turn, so no human sees your questions",
        ),
        answerItOrHandItUp: has('Answer your own question, or hand it up in `NEXT: rework`.'),
        gap: has('| `gap` | no one can assess the concern at this layer. Say precisely why. |'),
        allFiveClear: has('**Every one of these dispositions clears a unit**'),
        honestAnswers: has(
          '`gap` and `recorded` included, so you can always complete the record truthfully',
        ),
        absenceIsRefused: has('**A unit with NO entry is never acceptable**'),
        // A style note gets skipped. A named consequence does not. The completion gate rebuilds
        // this ledger against everything the parent's work item committed and refuses its `done`
        // per unit, so a skipped unit stops the parent's session from ending. The block names it
        // as "the completion gate" rather than by tool, because the last describe below forbids
        // this markdown from ever putting the word `signal-back` in front of a minion.
        namesTheParentsGate: has(
          "the completion gate recomputes this ledger against everything your parent's work item committed and REFUSES your parent's `done` while any unit carries no entry",
        ),
        namesWhatSkippingCosts: has("so a unit you skip stops your parent's session from ending"),
      }).toStrictEqual({
        reviewed: true,
        fixed: true,
        routed: true,
        recorded: true,
        noQuestionTool: false,
        saysWhyNoQuestions: true,
        insideTheParentsTurn: true,
        answerItOrHandItUp: true,
        gap: true,
        allFiveClear: true,
        honestAnswers: true,
        absenceIsRefused: true,
        namesTheParentsGate: true,
        namesWhatSkippingCosts: true,
      });
    });

    // The named consequence is the whole reason this one write is the exception to batching.
    it('VALID: markdown => writes each disposition the moment it is earned, never batched', () => {
      expect({
        theOneThingNotBatched: has('**These dispositions are the one thing you do NOT batch.**'),
        immediatelyPerConcern: has(
          'Write each one immediately after you finish that concern for that file',
        ),
        deathAtFileFour: has(
          'A session that dies at file four otherwise loses every disposition it recorded',
        ),
        nothingReDerivesThem: has('nothing behind you re-derives them'),
      }).toStrictEqual({
        theOneThingNotBatched: true,
        immediatelyPerConcern: true,
        deathAtFileFour: true,
        nothingReDerivesThem: true,
      });
    });

    it('VALID: markdown => carries the modify-quest blightLedger payload the server timestamps itself', () => {
      expect({
        call: has("modify-quest({ questId: 'QUEST_ID', planningNotes: { blightLedger: ["),
        itemIdFromChecklist: has("itemId: '<unit id from the checklist>'"),
        dispositionUnion: has("disposition: 'reviewed'|'fixed'|'routed'|'recorded'|'gap'"),
        evidenceIsConcrete: has("evidence: '<the concrete thing observed — never an adjective>'"),
        observedByIsTheMinion: has("observedBy: 'reviewer-minion'"),
        workItemFromBriefing: has("workItemId: '<the work item id your briefing names>'"),
        rippleAndOwner: has('| `fixed` | `rippleSites` | | `recorded` | `owner` |'),
        serverStampsTheTime: has(
          'Write no timestamp field. The server stamps the time. It ignores any value you supply.',
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

  // A minion has no work item of its own. A `signal-back` reference would point it at its parent's
  // item and let it complete the parent's operation mid-round. The git verbs stay out of THIS block
  // for a different reason: the reviewer template embeds this markdown, and the reviewer's own
  // commit step lives in that template. A second instruction here would be a copy free to drift
  // from the one that actually governs.
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
