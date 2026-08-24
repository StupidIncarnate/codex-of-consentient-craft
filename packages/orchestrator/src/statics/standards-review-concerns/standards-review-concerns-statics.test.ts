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
        skipEveryMechanicalRule: has('Skip every mechanical rule.'),
        lintOwnsMechanical: has('Lint already enforces all of them.'),
        namesTheRules: has(
          'naming, imports, exports, destructuring, return types, no-any, proxy colocation, stub usage, no-console, silent catches, unused and unreachable code',
        ),
        syntacticTestStructureToo: has(
          'Skip pure syntactic test structure\ntoo, for the same reason.',
        ),
        namesTheTestStructureRules: has(
          'name prefixes, `{input} => {expected}` titles, `describe` shape',
        ),
        skipAllOfIt: has('What is left is the judgement a linter cannot make.'),
      }).toStrictEqual({
        skipEveryMechanicalRule: true,
        lintOwnsMechanical: true,
        namesTheRules: true,
        syntacticTestStructureToo: true,
        namesTheTestStructureRules: true,
        skipAllOfIt: true,
      });
    });

    it('VALID: markdown => reads the discipline and the concerns as one reading, not two passes', () => {
      expect({
        oneReading: has(
          'Your discipline above and the five concerns below are ONE reading, not two passes.',
        ),
        allFivePerFile: has('Take all five against it before you move to the next.'),
      }).toStrictEqual({ oneReading: true, allFivePerFile: true });
    });
  });

  describe('the scope that frames one round', () => {
    // Each of the other three scopes fails this session in its own direction:
    //   1. `working-tree` finds nothing, because this session committed the round one step earlier.
    //   2. `commit` sees one piece out of the round's several.
    //   3. `quest` buries the round in work already dispositioned.
    it("VALID: markdown => makes scope 'unpushed' the only scope this reviewer may pass", () => {
      expect({
        surfaceIsThisRound: has('**Your surface is the files THIS ROUND produced.**'),
        theCall: has("get-blight-checklist({ questId: 'QUEST_ID', scope: 'unpushed' })"),
        onlyCorrectScope: has(
          "**`scope: 'unpushed'` is the only correct scope for you. You must pass it.**",
        ),
        definesTheScope: has(
          'It measures\neverything committed in this worktree and not yet pushed',
        ),
        namesTheBoundary: has('because you have not pushed yet — you push as your LAST act'),
        noIdToPass: has('You pass no id. You name no range.'),
        workingTreeFindsNothing: has('| `working-tree` | NOTHING'),
        commitSeesOnePiece: has('| `commit` | the last commit alone'),
        questBuriesTheRound: has('| `quest` | every file every session has ever touched'),
        unitIdGrammar: has('| `<implPath>:<concern>` | the id of one unit |'),
        // The round's ward is `npm run ward -- --staged`, and THIS SESSION runs it — the operator
        // used to. This enumeration is `scope: 'unpushed'`. Both mean "what origin does not have
        // yet", so the two cannot disagree about what the round was. The parent's single push per
        // round resets both at once.
        sameBoundaryAsItsOwnRoundWard: has('That is the SAME boundary your OWN'),
        theStagedCommand: has('`npm run ward -- --staged` used'),
        // The enumeration happens AFTER this session's own fix commit, never before. It reads
        // COMMITTED history. The parent's completion gate measures a range that includes that
        // commit. An earlier version of this block said both "commit everything first" and
        // "disposition as you go", which cannot both hold.
        enumerateAfterTheFixCommit: has('Commit your own fixes before you enumerate, never after.'),
      }).toStrictEqual({
        surfaceIsThisRound: true,
        theCall: true,
        onlyCorrectScope: true,
        definesTheScope: true,
        namesTheBoundary: true,
        noIdToPass: true,
        workingTreeFindsNothing: true,
        commitSeesOnePiece: true,
        questBuriesTheRound: true,
        unitIdGrammar: true,
        sameBoundaryAsItsOwnRoundWard: true,
        theStagedCommand: true,
        enumerateAfterTheFixCommit: true,
      });
    });

    // The post-push re-review is the only brief that may read a wider scope. This block names that
    // brief in the same words the brief itself uses, so a session cannot reason its way to `quest`
    // on its own.
    it("VALID: markdown => opens 'SCOPE: quest' only to the brief that names it", () => {
      expect({
        theOneException: has('**There is ONE exception: `SCOPE: quest`.**'),
        theBriefSaysSo: has('Your brief says so in as many words.'),
        unpushedIsEmptyThere: has('`unpushed` is empty. An empty scope dispositions nothing.'),
        questOverReports: has(
          '`quest`\nover-reports instead: units already dispositioned come back marked done.',
        ),
        spansAPushedRound: has('the only agent-facing scope that still spans a pushed round'),
      }).toStrictEqual({
        theOneException: true,
        theBriefSaysSo: true,
        unpushedIsEmptyThere: true,
        questOverReports: true,
        spansAPushedRound: true,
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
          'Lint checks that the header EXISTS. Nothing checks that it is TRUE.\n  No test and no typecheck reads a comment.',
        ),
        discoverServesIt: has(
          "`discover --verbose` then serves it as that file's primary\n  description to every later agent",
        ),
        fourShapes: has('Four shapes to flag:'),
        shapeReturn: has('a return-shape claim the code contradicts'),
        shapeValidation: has('a validation claim the contract does not make'),
        // Judge shape 2 against what the zod chain tests, never against the message the `.refine()`
        // carries. A message is a claim about the check, not the check.
        readTheZodChainNotTheMessage: has(
          'read the zod chain itself. Read what each `.refine()` tests. Never take the\n  `.refine()` message as the claim.',
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
        noAstComparison: has('It compares no AST shapes at all.'),
        cleanRunSaysNothing: has(
          'So a clean run from\nit says nothing about the duplicate code you are looking for',
        ),
        showYourWork: has(
          'Name both implementations. State what you compared: parameters, return\nshapes, control flow. Never report that the text looked similar.',
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
        skipTheSweep: has('**Skip that sweep entirely.**'),
        whatIsLeft: has(
          'What you own is the change that typechecks and still MEANS something different:',
        ),
        semanticShapes: has(
          'units, ordering, whether a bound is inclusive, what an empty\n  array now signifies',
        ),
        enumerateConsumers: has(
          '`discover` grep the\n  export name to enumerate consumers across the monorepo.',
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
          'each `if`/`else`, each `switch` arm, each ternary, each optional chain, each `try`/`catch`, each\nearly return',
        ),
        judgeTheAssertion: has('Judge the assertion too, not just its presence'),
        vacuousCountsAsNone: has(
          'A test that asserts `rendered` or `was called`\nproves nothing. It counts as NO case.',
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
          'a property of the whole import graph\nAFTER every later round lands. You cannot answer that from inside one round.',
        ),
        doNotHunt: has('Do not go hunting orphans.'),
        noDispositionOwed: has('It is still not a unit you owe a disposition on.'),
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
        doNotReviewAnyway: has('Do not\nreview them anyway. Do not record their absence as a gap.'),
        theMeasurement: has(
          'Across 88 review units of exactly that file mix, `perf` and\n`integrity` produced ZERO findings',
        ),
        propertyOfTheQuestion: has('That ZERO comes from the question itself.'),
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
          '| `routed` | a real finding needing a decision this round cannot make. Name it in your `NEXT: rework` line, or it goes nowhere. |',
        ),
        recorded: has(
          '| `recorded` | you handed a real finding to a named owner outside this quest. It is not closed this round. |',
        ),
        noQuestionTool: has('ask-user-question'),
        saysWhyNoQuestions: has('**You have no way to ask the user anything.**'),
        insideTheParentsTurn: has(
          "You are a sub-agent inside your parent's turn. No\nhuman sees your questions",
        ),
        answerItOrHandItUp: has('Answer your own question, or hand it\nup in `NEXT: rework`.'),
        gap: has('| `gap` | no one can assess the concern at this layer. Say precisely why. |'),
        allFiveClear: has('**Every one of these clears a unit.**'),
        honestAnswers: has(
          '`gap` and `recorded` are honest answers, so you can always\ncomplete the record truthfully',
        ),
        absenceIsRefused: has('A unit with NO entry at all is never acceptable.'),
        // A style note gets skipped. A named consequence does not. The completion gate rebuilds
        // this ledger against everything the parent's work item committed and refuses its `done`
        // per unit, so a skipped unit stops the parent's session from ending. The block names it
        // as "the completion gate" rather than by tool, because the last describe below forbids
        // this markdown from ever putting the word `signal-back` in front of a minion.
        namesTheParentsGate: has(
          "The completion gate recomputes this ledger against everything your parent's work item\ncommitted. It REFUSES your parent's `done` while any unit carries no entry.",
        ),
        namesWhatSkippingCosts: has("A unit you skip stops\nyour parent's session from ending."),
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
          'Write each one immediately after you\nfinish that concern for that file',
        ),
        deathAtFileFour: has(
          'A session that dies at file four otherwise loses every\ndisposition it earned',
        ),
        nothingReDerivesThem: has('Nothing behind you re-derives them.'),
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
        rippleAndOwner: has('| `fixed` | `rippleSites` |\n| `recorded` | `owner` |'),
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
