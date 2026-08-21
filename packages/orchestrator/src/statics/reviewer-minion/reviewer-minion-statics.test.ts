import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';
import { operatorPromptStatics } from '../operator-prompt/operator-prompt-statics';
import { plannerMinionStatics } from '../planner-minion/planner-minion-statics';
import { standardsReviewConcernsStatics } from '../standards-review-concerns/standards-review-concerns-statics';
import { reviewerMinionStatics } from './reviewer-minion-statics';

const { template } = reviewerMinionStatics.prompt;

const has = (needle: string): boolean => template.includes(needle);

const METHOD = template.slice(
  template.indexOf('## Method — in this order'),
  template.indexOf('## What is not yours'),
);

// ================================================================================================
// CROSS-FILE DERIVATIONS. Every needle built below comes out of the OTHER module's live value. A
// hardcoded copy of the other side's prose drifts exactly the way the prose drifts, and the test
// holding the stale copy goes quiet at the moment it should have failed.
// ================================================================================================
const OPERATOR = operatorPromptStatics.prompt.template;
const PLANNER = plannerMinionStatics.prompt.template;

// The operator's ROUND brief for this minion, and its POST-REFUSAL brief — the only two dispatches
// this template is ever read under.
const ROUND_BRIEF_OPENS = OPERATOR.indexOf(
  '```',
  OPERATOR.indexOf('**7. Dispatch ONE `reviewer-minion`**'),
);
const OPERATOR_ROUND_BRIEF = OPERATOR.slice(
  ROUND_BRIEF_OPENS + 3,
  OPERATOR.indexOf('```', ROUND_BRIEF_OPENS + 3),
);
const REFUSAL_BRIEF_OPENS = OPERATOR.indexOf(
  '```',
  OPERATOR.indexOf('Dispatch ONE more `reviewer-minion`:'),
);
const OPERATOR_REFUSAL_BRIEF = OPERATOR.slice(
  REFUSAL_BRIEF_OPENS + 3,
  OPERATOR.indexOf('```', REFUSAL_BRIEF_OPENS + 3),
);
const REFUSAL_BRIEF_LINES = OPERATOR_REFUSAL_BRIEF.split('\n').filter((line) => line !== '');

// The header the operator mandates at the top of both of those briefs.
const HEADER_OPENS = OPERATOR.indexOf(
  '```',
  OPERATOR.indexOf('**Open every brief with this header.**'),
);
const OPERATOR_BRIEF_HEADER = OPERATOR.slice(
  HEADER_OPENS + 3,
  OPERATOR.indexOf('```', HEADER_OPENS + 3),
);

// The three post-refusal overrides, read out of THIS template's own instructions and then looked
// for in the brief the operator actually writes.
const REFUSAL_LITERAL =
  /\*\*Read a `([^`]+)` line before anything else in the brief\.\*\*/u.exec(template)?.[1] ??
  'THIS TEMPLATE KEYS ON NO REFUSAL LINE';
const SCOPE_LITERAL =
  /instead when your brief says\s+`([^`]+)`\.\*\*/u.exec(template)?.[1] ??
  'THIS TEMPLATE KEYS ON NO SCOPE LINE';
const SCOPE_ARGUMENT =
  /\*\*Use `scope: '([a-z]+)'` instead/u.exec(template)?.[1] ?? 'THIS TEMPLATE PASSES NO SCOPE';

// The operator's routing table: the only reader of the last line this template writes.
const OPERATOR_NEXT_TABLE = OPERATOR.slice(
  OPERATOR.indexOf('| The line says | You do |'),
  OPERATOR.indexOf('**`continue` and `rework` do the same thing'),
);
const OPERATOR_ROUTED_VALUES = Array.from(OPERATOR_NEXT_TABLE.matchAll(/^\| `([a-z]+)` \|/gmu)).map(
  (match) => match[1] ?? '',
);
const OPERATOR_FALLBACK_VALUE =
  /^\| no `NEXT:` line at all \| treat it as `([a-z]+)`/mu.exec(OPERATOR_NEXT_TABLE)?.[1] ??
  'THE OPERATOR TABLE CARRIES NO DEFAULT ROW';

// This template's own menu line, its own value table, and any line that would read as a wrapped
// continuation of the menu.
const NEXT_MENU_LINES = template.split('\n').filter((line) => line.startsWith('NEXT:'));
const NEXT_VALUES = NEXT_MENU_LINES.flatMap((line) => line.slice('NEXT:'.length).split('|'))
  .map((arm) => arm.trim().split(' ')[0] ?? '')
  .filter((word) => word !== '');
// Scoped to THIS template's own `NEXT:` table: the embedded standards-concerns block carries
// tables of its own whose first column is backticked lowercase too.
const NEXT_VALUE_TABLE = template.slice(
  template.indexOf('| Value | What your parent does with it |'),
  template.indexOf('**Write `continue` when all three of these hold:**'),
);
const VALUE_TABLE_ROWS = Array.from(NEXT_VALUE_TABLE.matchAll(/^\| `([a-z]+)` \| /gmu)).map(
  (match) => match[1] ?? '',
);
const WRAPPED_MENU_CONTINUATIONS = template
  .split('\n')
  .filter((line) => OPERATOR_ROUTED_VALUES.some((value) => line.startsWith(`| ${value}`)));

// The plan file: the PLANNER writes it, this session grades against it.
const PLAN_FENCE_OPENS = PLANNER.indexOf('```', PLANNER.indexOf('## The plan file'));
const PLAN_FENCE = PLANNER.slice(
  PLAN_FENCE_OPENS + 3,
  PLANNER.indexOf('```', PLAN_FENCE_OPENS + 3),
);
const PLAN_FIELDS = Array.from(PLAN_FENCE.matchAll(/^([A-Z]+):/gmu)).map((match) => match[1] ?? '');
const PLAN_PATH =
  /^## The plan file — `([^`]+)`$/mu.exec(PLANNER)?.[1] ?? 'THE PLANNER NAMES NO PLAN PATH';
const GRADED_FIELD =
  /\*\*`([A-Z]+)` is what the reviewer grades the chunk against\*\*/u.exec(PLANNER)?.[1] ??
  'THE PLANNER NAMES NO GRADED FIELD';
const STEP_TWO = template.slice(
  template.indexOf('2. **Read the PLAN FILE**'),
  template.indexOf('3. **OPEN EVERY FILE'),
);
const FIELDS_STEP_TWO_GRADES = Array.from(
  new Set(Array.from(STEP_TWO.matchAll(/`([A-Z]+)`/gu)).map((match) => match[1] ?? '')),
);

// The subject every worker on the round commits under, and the id this session's checklist call
// needs — both of which reach it from somewhere else entirely.
const CHECKLIST_ID =
  /get-blight-checklist\(\{ questId: '([A-Z_]+)'/u.exec(template)?.[1] ??
  'THIS TEMPLATE NAMES NO QUEST ID';

describe('reviewerMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(reviewerMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          discipline: '$DISCIPLINE',
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => carries $DISCIPLINE once and $ARGUMENTS once, with $ARGUMENTS last', () => {
    expect({
      disciplineCount: template.split('$DISCIPLINE').length - 1,
      argumentsCount: template.split('$ARGUMENTS').length - 1,
      disciplineOnItsOwnLine: /^\$DISCIPLINE$/mu.test(template),
      disciplineComesFirst: template.indexOf('$DISCIPLINE') < template.indexOf('$ARGUMENTS'),
      argumentsIsTheTail: template.endsWith('$ARGUMENTS'),
      questIdHeading: /^## The quest id — everything else is in your parent's brief$/mu.test(
        template,
      ),
    }).toStrictEqual({
      disciplineCount: 1,
      argumentsCount: 1,
      disciplineOnItsOwnLine: true,
      disciplineComesFirst: true,
      argumentsIsTheTail: true,
      questIdHeading: true,
    });
  });

  it('VALID: template => stays under the MCP tool-result verbatim-delivery ceiling', () => {
    expect(template.length).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  // `$ARGUMENTS` RESOLVES TO ONE LINE for a minion, not to a briefing.
  // `agentPromptGetBroker`'s minion-fetch branch substitutes `Quest ID: <uuid>` and nothing else.
  // It substitutes nothing richer because anything richer needs a `workItemId`. A minion that
  // passed a `workItemId` would be held open by `subagentStopNeedsBlockGuard` until it signalled on
  // its PARENT's operation item. So the worker returns arrive in the parent's spawn message, and
  // nowhere else. The section used to be headed "## Briefing", which told a reviewer its briefing
  // was one id.
  it('VALID: the last section => says the worker returns are elsewhere and this line is the authoritative id', () => {
    expect({
      honestHeading: /^## The quest id — everything else is in your parent's brief$/mu.test(
        template,
      ),
      noBriefingHeading: /^## Briefing$/mu.test(template),
      briefIsTheSpawnMessage: has(
        "**Your BRIEF is your parent's spawn message, not this section.**",
      ),
      namesWhatArrivesThere: has(
        "- the header;\n- the plan file's path;\n- the `WARD:` block from your parent's own run;\n- every worker return;\n- any `REFUSAL:` / `SCOPE: quest` line.",
      ),
      oneLineOnly: has('It carries exactly one line.'),
      thisOneWins: has('the quest id, THIS one is right'),
      noReturnsIsSaidInVerdict: has('say so in `VERDICT`'),
      canStillReadTheRound: has("You can still read the plan\nfile and the round's commits."),
    }).toStrictEqual({
      honestHeading: true,
      noBriefingHeading: false,
      briefIsTheSpawnMessage: true,
      namesWhatArrivesThere: true,
      oneLineOnly: true,
      thisOneWins: true,
      noReturnsIsSaidInVerdict: true,
      canStillReadTheRound: true,
    });
  });

  // A REFUSED `signal-back` sends the parent back with ONE more reviewer. That brief carries the
  // refusal message verbatim, beside `SCOPE: quest` and `SKIP WARD`. The message is `signal-back`'s
  // own list of the outstanding units. No tool hands it back. A template that never mentioned it
  // left the one session that could act on the list unable to find it. The same brief carries no
  // worker returns BY CONSTRUCTION. So the template names it as the exception to the "no worker
  // returns" fallback, instead of letting the session grade itself degraded.
  it('VALID: the last section => reads REFUSAL first and treats its units as the re-review scope', () => {
    expect({
      inTheBriefInventory: has('any `REFUSAL:` / `SCOPE: quest` line.'),
      readItFirst: has('**Read a `REFUSAL:` line before anything else in the brief.**'),
      verbatimFromSignalBack: has(
        'It is the message `signal-back` threw\nat your parent, verbatim.',
      ),
      namesTheOutstandingUnits: has(
        'It names every unit still carrying no disposition or no sign-off.',
      ),
      thoseUnitsAreTheScope: has('**Those\nnamed units ARE the scope of this re-review.**'),
      settleEachOne: has('Settle each one. Write its record.'),
      noToolHandsItBack: has('No tool hands that\nlist back to you.'),
      losingItRepeatsTheRefusal: has('your parent earns the identical refusal a second time'),
      refusalBriefIsNotDegraded: has(
        '**A brief\ncarrying `REFUSAL:` is the one exception.** That re-review is not a degraded round.',
      ),
      noReturnsByConstruction: has('it carries no worker returns by construction'),
      gradedAgainstTheRefusalsUnits: has(
        "against the refusal's units, the plan file and the commits",
      ),
    }).toStrictEqual({
      inTheBriefInventory: true,
      readItFirst: true,
      verbatimFromSignalBack: true,
      namesTheOutstandingUnits: true,
      thoseUnitsAreTheScope: true,
      settleEachOne: true,
      noToolHandsItBack: true,
      losingItRepeatsTheRefusal: true,
      refusalBriefIsNotDegraded: true,
      noReturnsByConstruction: true,
      gradedAgainstTheRefusalsUnits: true,
    });
  });

  // The reviewer is a LEAF: it summons no sub-agent of its own. It therefore takes
  // `delegationLeafBan`, not the `delegationSpike` the planner carries, and carrying both would
  // leave it following whichever it read first. The actual side of this assertion is built from the
  // statics, so a piece added there arrives here as an unexpected key rather than going unnoticed.
  it('VALID: template => composes the leaf-minion operating rules, and no piece meant for another reader', () => {
    expect(
      Object.fromEntries(
        Object.entries(agentOperatingRulesStatics).map(([key, piece]) => [key, has(piece)]),
      ),
    ).toStrictEqual({
      heading: true,
      turnEndRole: false,
      turnEndMinion: true,
      background: true,
      wardScoped: false,
      wardNone: true,
      delegationSynchronous: false,
      delegationSpike: false,
      delegationLeafBan: true,
      wallRole: false,
      wallMinion: true,
      treeCleanRole: false,
      treeCleanOperator: false,
    });
  });

  // The five standing concerns live in their own statics, because they do not vary with the
  // discipline. They sit next to `$DISCIPLINE`, instead of being copied into five packs that would
  // drift apart.
  it('VALID: template => embeds the standing review concerns directly beneath the discipline slot', () => {
    expect({
      embedded: has(standardsReviewConcernsStatics.markdown),
      afterTheDisciplineSlot:
        template.indexOf(standardsReviewConcernsStatics.markdown) > template.indexOf('$DISCIPLINE'),
    }).toStrictEqual({ embedded: true, afterTheDisciplineSlot: true });
  });

  // Its `NEXT:` line IS the round's outcome. Every worker on the round wrote one too. The parent
  // reads none of theirs at its last step. That is what lets the parent read one line instead of
  // merging three channels.
  describe('its NEXT line decides the round and supersedes every worker line', () => {
    it('VALID: template => opens by saying the last line decides, and that it supersedes the workers', () => {
      expect({
        onlySessionThatVerifies: has(
          '**You are the ONLY session that verifies anything on this round.**',
        ),
        unnamedDefectsStay: has('anything you\nleave unnamed stays in the branch'),
        lastLineDecides: has('**Your last line decides the round.**'),
        continueEndsIt: has('- `continue` ends its session.'),
        reworkLoopsIt: has(
          "- `rework` sends the whole loop round again, with your text as the next planner's scope.",
        ),
        supersedes: has('Yours SUPERSEDES all of them.'),
        youHaveTheFilesOpen: has('You are the session with the files open'),
      }).toStrictEqual({
        onlySessionThatVerifies: true,
        unnamedDefectsStay: true,
        lastLineDecides: true,
        continueEndsIt: true,
        reworkLoopsIt: true,
        supersedes: true,
        youHaveTheFilesOpen: true,
      });
    });

    it('VALID: template => defines all three NEXT values and the two ways to get the line wrong', () => {
      expect({
        continueMeaning: has('| `continue` | Ends its own session. |'),
        continueConditions: has(
          "**Write `continue` when all three of these hold:**\n\n- every chunk's `INTENT` is true;\n- every unit carries a disposition;\n- the ward is green.",
        ),
        continueCoversAnEmptyRound: has(
          'A round that produced nothing at all still earns `continue`',
        ),
        reworkLoops: has(
          "| `rework` | Runs the whole loop again, with your text as the next planner's entire scope. |",
        ),
        inChunkTerms: has("in the plan's own chunk terms"),
        paddingSpendsARound: has('**Padding it spends a round the quest cannot afford.**'),
        budgetOfThreeRoundsInThisSession: has(
          'against a budget of three rounds inside this\n  session',
        ),
        hidingLeavesTheDefect: has('**Hiding a real remainder leaves the defect in the branch.**'),
        nothingRunsAfterYou: has('Nothing runs after you.'),
        wallHaltsTheQuest: has('| `wall` | Halts the entire quest. |'),
        wallIsEnvironmentOnly: has(
          '**Write `wall` for an environment wall only.** An environment wall is anything no session of any\nrole could pass.',
        ),
        architecturalIsNotAWall: has(
          'These three are `rework`, never `wall`:\n\n- an architectural item;\n- a product decision;\n- a test you could not make fail.',
        ),
        notObligedByAWorker: has('A worker that returned `rework` does not oblige you to.'),
        noManufacturedFinding: has('**Do not invent a finding to\njustify the round.**'),
      }).toStrictEqual({
        continueMeaning: true,
        continueConditions: true,
        continueCoversAnEmptyRound: true,
        reworkLoops: true,
        inChunkTerms: true,
        paddingSpendsARound: true,
        budgetOfThreeRoundsInThisSession: true,
        hidingLeavesTheDefect: true,
        nothingRunsAfterYou: true,
        wallHaltsTheQuest: true,
        wallIsEnvironmentOnly: true,
        architecturalIsNotAWall: true,
        notObligedByAWorker: true,
        noManufacturedFinding: true,
      });
    });

    // The cost of a padded `rework` is written so it is TRUE on every discipline. Three rounds
    // inside one session bounds all five. The pt attempts after that do not bound all five. Three
    // things make that so:
    //
    // - `questTypeRegistryStatics` creates the codeweaver seed with `locked: false`;
    // - the signal-back handler gates the chain on `linkedOperation.locked`;
    // - `disciplineImplementationStatics`, interpolated into this same served prompt, states that
    //   its chain is UNBOUNDED.
    //
    // A hard-coded "three pt attempts" told half the reviewers something their own discipline pack
    // contradicts.
    it('VALID: the padding cost => bounds the rounds everywhere and hedges the pt attempts', () => {
      expect({
        roundsBoundIsPerSession: has('against a budget of three rounds inside this\n  session'),
        partialRestartsTheScope: has(
          'A spent budget is a `partial`, which starts the whole scope again in a fresh session.',
        ),
        ptBoundIsConditional: has("Where this role's pt chain is bounded"),
        spentChainBlocks: has('A spent chain blocks the quest instead of continuing.'),
        noHardCodedThreeAttempts: has('three pt attempts'),
      }).toStrictEqual({
        roundsBoundIsPerSession: true,
        partialRestartsTheScope: true,
        ptBoundIsConditional: true,
        spentChainBlocks: true,
        noHardCodedThreeAttempts: false,
      });
    });

    it('VALID: the return block => carries every field, with NEXT last', () => {
      const returnBlock = template.slice(
        template.indexOf('VERDICT: <one line'),
        template.indexOf('Every line carries evidence.'),
      );

      expect({
        verdict: returnBlock.includes('VERDICT:'),
        chunks: returnBlock.includes('CHUNKS:'),
        fixesMade: returnBlock.includes('FIXES MADE:'),
        signoffs: returnBlock.includes('SIGNOFFS:'),
        ward: returnBlock.includes('WARD:'),
        next: returnBlock.includes('NEXT: continue | rework —'),
        wholeMenuOnOneLine: returnBlock.includes(
          'NEXT: continue | rework — <what is not done, in chunk terms> | wall — <what a human must change>\n',
        ),
        noAdjectives: has('Never write\n"verified" or "looks correct" in a `CHUNKS` entry.'),
        fixNeedsAWitnessedRed: has(
          'A `FIXES MADE` line with no witnessed red is a change, not a fix.',
        ),
      }).toStrictEqual({
        verdict: true,
        chunks: true,
        fixesMade: true,
        signoffs: true,
        ward: true,
        next: true,
        wholeMenuOnOneLine: true,
        noAdjectives: true,
        fixNeedsAWitnessedRed: true,
      });
    });

    // THE OPERATOR MATCHES THE FIRST WORD OF THE LAST LINE. The fence used to wrap the `wall`
    // option onto a continuation line. A reviewer mirroring it emitted a last line beginning `|`,
    // which matches no row in the operator's table. The operator then fell through to its "no
    // `NEXT:` line at all → treat it as `rework`" row. It dispatched another full round into the
    // environment wall, which is exactly what the `wall` row exists to prevent.
    it('VALID: template => writes NEXT on exactly one line and forbids a continuation line', () => {
      const nextLines = template.split('\n').filter((line) => line.startsWith('NEXT:'));

      expect({
        exactlyOneNextLine: nextLines.length,
        noLineStartsWithTheWallArm: /^\s*\| wall/mu.test(template),
        oneLineAndLast: has(
          '**Write `NEXT:` on ONE line.** **Make it the LAST line of your return.**',
        ),
        parentMatchesTheFirstWord: has(
          'Your parent matches the\nfirst word of your last line against `continue`, `rework` and `wall`',
        ),
        continuationStartsWithAPipe: has(
          'A `wall` option wrapped onto\na second line starts with `|`, which matches none of the three.',
        ),
        fallsThroughToRework: has(
          'reads the whole\nreturn as carrying no `NEXT:` at all. It treats that as `rework`.',
        ),
        andDispatchesIntoTheWall: has(
          'It dispatches a full round into\nthe environment wall you just reported.',
        ),
        writeNothingBeneathIt: has('Write nothing beneath it.'),
        reworkStaysInsideThatLine: has(
          "Your `rework` text is the next planner's entire scope. Write it in the plan's chunk terms.",
        ),
      }).toStrictEqual({
        exactlyOneNextLine: 1,
        noLineStartsWithTheWallArm: false,
        oneLineAndLast: true,
        parentMatchesTheFirstWord: true,
        continuationStartsWithAPipe: true,
        fallsThroughToRework: true,
        andDispatchesIntoTheWall: true,
        writeNothingBeneathIt: true,
        reworkStaysInsideThatLine: true,
      });
    });
  });

  // STEP 7 COMMITS BEFORE STEP 8 ENUMERATES. `get-blight-checklist` reads COMMITTED history. The
  // completion gate the parent is held to measures a range that INCLUDES this session's commits.
  // The predecessor said BOTH "commit everything before you enumerate" AND "write each disposition
  // as you finish each file". Both cannot hold. A session that enumerates last writes every
  // disposition in one batch at the end, which is exactly what the anti-batch rule forbids. So the
  // commits split in two: the fixes first, then the verdict. The verdict commit touches no
  // implementation file, so it creates no new unit.
  describe('the method order', () => {
    it('VALID: template => numbers its steps 1 through 11, contiguously', () => {
      expect(Array.from(METHOD.matchAll(/^\d+\. \*\*/gmu)).map((match) => match[0])).toStrictEqual([
        '1. **',
        '2. **',
        '3. **',
        '4. **',
        '5. **',
        '6. **',
        '7. **',
        '8. **',
        '9. **',
        '10. **',
        '11. **',
      ]);
    });

    it('VALID: the method => commits fixes BEFORE it enumerates, and commits the verdict after', () => {
      expect({
        fixCommitBeforeEnumerate:
          METHOD.indexOf('**COMMIT your fixes**') <
          METHOD.indexOf('**ENUMERATE the review units.**'),
        enumerateBeforeDispositions:
          METHOD.indexOf('**ENUMERATE the review units.**') <
          METHOD.indexOf('**Write a disposition for every unit'),
        dispositionsBeforeVerdictCommit:
          METHOD.indexOf('**Write a disposition for every unit') <
          METHOD.indexOf('**COMMIT your verdict.**'),
        wardBeforeFixing:
          METHOD.indexOf("**Run the round's ward") < METHOD.indexOf('**FIX what you can'),
      }).toStrictEqual({
        fixCommitBeforeEnumerate: true,
        enumerateBeforeDispositions: true,
        dispositionsBeforeVerdictCommit: true,
        wardBeforeFixing: true,
      });
    });

    it('VALID: step 7 => commits the WHOLE round, and says why that has to precede the enumeration', () => {
      expect({
        theWholeRound: has('7. **COMMIT THE WHOLE ROUND**, before anything in step 8 runs.'),
        noWorkerCommitted: has('**No worker committed anything.**'),
        theWaveIsWhy: has(
          "A\n   wave of them runs at once, and concurrent commits in one worktree collide on git's index lock —\n   measured at three surviving out of twelve.",
        ),
        theirsAndYours: has(
          'So every file this round produced is sitting in the\n   tree right now, theirs and your fixes together.',
        ),
        addAll: has('Run `git add -A`, then commit with the subject'),
        subject: has('`round <n>: <what the round made true>`'),
        onePerChunkInTheBody: has('one line per chunk in the body saying what landed'),
        allowEmpty: has('Pass `--allow-empty` if the round genuinely changed nothing.'),
        onlyYouOpenedThem: has('**You are the only session that can write that commit honestly**'),
        unexplainedPathsGoUp: has(
          'A path you cannot account for still goes in — but name it\n   in your return as well',
        ),
        notAPreference: has('**Do NOT enumerate before this commit lands.**'),
        readsCommittedHistory: has('Step 8 reads COMMITTED history.'),
        gateIncludesThisCommit: has(
          "Your parent's\n   completion gate measures a range that includes this commit.",
        ),
        theCost: has('It reaches that gate carrying no disposition.'),
      }).toStrictEqual({
        theWholeRound: true,
        noWorkerCommitted: true,
        theWaveIsWhy: true,
        theirsAndYours: true,
        addAll: true,
        subject: true,
        onePerChunkInTheBody: true,
        allowEmpty: true,
        onlyYouOpenedThem: true,
        unexplainedPathsGoUp: true,
        notAPreference: true,
        readsCommittedHistory: true,
        gateIncludesThisCommit: true,
        theCost: true,
      });
    });

    it('VALID: step 10 => commits the verdict with the return block in the body, creating no new unit', () => {
      expect({
        allowEmpty: has('`git commit --allow-empty` with the subject'),
        subject: has('`review <n>: <continue|rework>`'),
        bodyIsTheReturnBlock: has('your whole return block below in the body, verbatim'),
        createsNoUnit: has(
          'This\n    commit touches no implementation file, so it creates no review unit',
        ),
        theRoundsRecord: has("**This commit is the round's record.**"),
        parentWritesNone: has('Your parent writes none.'),
        nextPlannerReconstructs: has("next round's planner reconstructs what happened from git"),
        cleanRoundStillCommits: has('A round you fixed nothing in still\n    commits.'),
      }).toStrictEqual({
        allowEmpty: true,
        subject: true,
        bodyIsTheReturnBlock: true,
        createsNoUnit: true,
        theRoundsRecord: true,
        parentWritesNone: true,
        nextPlannerReconstructs: true,
        cleanRoundStillCommits: true,
      });
    });
  });

  // The reviewer owns the round's ward. It needs no file list for that run. `--staged` is every
  // check type over every source file that origin does not have yet. That IS the round, because the
  // parent pushes once at the end of each one. `scope: 'unpushed'` measures the identical boundary.
  // The two tools therefore cannot disagree about what the round was.
  describe('the round ward', () => {
    it('VALID: step 5 => READS the parent --staged result and runs none of its own', () => {
      expect({
        readIt: has("5. **READ the round's ward result out of your brief.**"),
        theParentRanIt: has(
          'Your parent ran `npm run ward -- --staged`\n   after the last wave and pasted the output in verbatim.',
        ),
        everyCheckType: has(
          'That is every check type over every source\n   file origin does not have yet, which IS this round.',
        ),
        youRunNone: has('**You run none yourself**'),
        theOnlyTypecheck: has(
          "that one run of\n   your parent's is the only thing that has TYPECHECKED anything",
        ),
        soThatIsWhereContractBreaksShow: has(
          'so a broken contract or a stale\n   call site shows up there and nowhere else',
        ),
        aMissingBlockIsSaidOutLoud: has(
          '**A brief carrying no ward block is one your parent could not run.**',
        ),
        andYouStillGrade: has('grade what you can from the files themselves'),
        andRunsNoCommandOfItsOwn: has("**Run the round's ward: `npm run ward -- --staged`.**"),
      }).toStrictEqual({
        readIt: true,
        theParentRanIt: true,
        everyCheckType: true,
        youRunNone: true,
        theOnlyTypecheck: true,
        soThatIsWhereContractBreaksShow: true,
        aMissingBlockIsSaidOutLoud: true,
        andYouStillGrade: true,
        andRunsNoCommandOfItsOwn: false,
      });
    });

    // The reviewer cannot check its own fixes, because it runs no ward. The parent's second
    // `--staged` is that check, and it is keyed on this session's own `FIXES MADE` block.
    it('VALID: step 6 => hands its fixes to the parent to re-check rather than re-running a ward', () => {
      expect({
        cannotRecheck: has('**You cannot re-run the ward to check your own fixes.**'),
        listThemInFixesMade: has(
          'List every one of them in the\n   `FIXES MADE` block of your return instead.',
        ),
        theParentRerunsIt: has(
          'Your parent re-runs `npm run ward -- --staged` after\n   you, precisely because you made fixes',
        ),
        stillRedIsNextRoundsScope: has("a still-red result becomes the next round's scope"),
        unfixableIsRework: has(
          'A red\n   you could not fix at all is your `NEXT: rework`, carrying the failing output verbatim.',
        ),
      }).toStrictEqual({
        cannotRecheck: true,
        listThemInFixesMade: true,
        theParentRerunsIt: true,
        stillRedIsNextRoundsScope: true,
        unfixableIsRework: true,
      });
    });

    // The parent dispatches the post-push re-review after it has pushed, so the `unpushed` window
    // is empty. That exception is keyed on a literal the parent writes into the brief, so it is not
    // a judgement this session makes.
    it('VALID: template => carries the post-push scope exception, keyed on a literal', () => {
      expect({
        scopeQuest: has(
          "**Use `scope: 'quest'` instead when your brief says\n   `SCOPE: quest`.**",
        ),
        scopeQuestReason: has('where `unpushed` comes back empty'),
        sameBoundary: has("`unpushed` is the same boundary your parent's `--staged` run used"),
        cannotDisagree: has('so the two\n   cannot disagree about what this round was'),
      }).toStrictEqual({
        scopeQuest: true,
        scopeQuestReason: true,
        sameBoundary: true,
        cannotDisagree: true,
      });
    });
  });

  // This mandate caught real defects in four separate sessions of one quest. Every one of those
  // sessions returned a green ward and a confident summary.
  it('VALID: step 3 => mandates opening every file and names the four defects it caught', () => {
    expect({
      mandate: has('**OPEN EVERY FILE THE ROUND PRODUCED.**'),
      notTheSummary: has("Do NOT trust a worker's summary alone"),
      notTheCommitMessage: has(
        'Do not review\n   a commit message in place of the file it describes',
      ),
      stubSwallowedTheParse: has('so the outer parse never executed'),
      cadenceMeasuredNoSpacing: has('a cadence test that counted frames and measured no spacing'),
      assertionThatCouldNotFail: has(
        "a `getAttribute('data-testid')` assertion that could not fail",
      ),
      proxyMockedApplicationCode: has('a proxy that mocked application code'),
      allGreenAndConfident: has('**Every one returned a green ward and a confident summary.**'),
    }).toStrictEqual({
      mandate: true,
      notTheSummary: true,
      notTheCommitMessage: true,
      stubSwallowedTheParse: true,
      cadenceMeasuredNoSpacing: true,
      assertionThatCouldNotFail: true,
      proxyMockedApplicationCode: true,
      allGreenAndConfident: true,
    });
  });

  // All five packs route their design decisions into `SUMMARY:`. Until this landed, no reviewer
  // read it. On `bug-repro` the planner records there that the reported symptom was wrong, and what
  // it actually drove. The pack says in as many words that "the reviewer then checks the test
  // against the right one". No reviewer can do that from the chunk fields alone.
  it('VALID: step 2 => verifies against the plan SUMMARY as well as every chunk field', () => {
    expect({
      summaryAndChunks: has(
        'You verify the round against its `SUMMARY`\n   and its chunks: each `INTENT`, each `FILES` list, each `UNITS` list.',
      ),
      whatTheSummaryCarries: has(
        'The `SUMMARY` carries what this round makes true, the shape of the approach, and any design\n   decision the planner settled.',
      ),
      itCarriesCorrections: has(
        'It also carries any CORRECTION the planner made to the scope it was\n   handed',
      ),
      gradedAgainstTheCorrection: has(
        '**A correction recorded there is what this round is graded against, not the\n   original report.**',
      ),
      supersededReadingIsRework: has(
        'A chunk built against the scope that correction replaced is `NEXT: rework`',
      ),
      claimNotSubstitute: has(
        "**A worker's return is a\n   CLAIM about that plan, never a substitute for it.**",
      ),
    }).toStrictEqual({
      summaryAndChunks: true,
      whatTheSummaryCarries: true,
      itCarriesCorrections: true,
      gradedAgainstTheCorrection: true,
      supersededReadingIsRework: true,
      claimNotSubstitute: true,
    });
  });

  it('VALID: step 9 => writes dispositions one at a time and sign-offs batched', () => {
    expect({
      dispositionsOneAtATime: has(
        'Dispositions\n   go ONE AT A TIME, as you finish each concern for each file',
      ),
      whyNotBatched: has(
        'A session that dies at file four\n   otherwise loses every disposition it earned',
      ),
      signoffsBatched: has('SIGN-OFFS are the opposite: BATCH them into ONE\n   write per round.'),
      noAtField: has('**Do NOT write an `at` field.**'),
      noReliableClock: has('An LLM has no\n   reliable clock.'),
    }).toStrictEqual({
      dispositionsOneAtATime: true,
      whyNotBatched: true,
      signoffsBatched: true,
      noAtField: true,
      noReliableClock: true,
    });
  });

  it('VALID: step 6 => fixes red-first, ripple-checks, and hands architectural work up rather than taking it', () => {
    expect({
      redFirst: has('**FIX what you can, RED-FIRST.**'),
      rippleCheck: has('**Ripple-check every other place that value renders or that logic runs.**'),
      workerSeesOneChunk: has('A worker checked one chunk. You check the whole round.'),
      neverBendATest: has('Never weaken, skip or delete a test to reach green'),
      falseGreenCorrectedFirst: has(
        'When a check passes over behaviour you know is broken, correct the check\n   FIRST until it fails, then fix the behaviour.',
      ),
      architecturalIsRework: has('Those go in `NEXT: rework` with a\n   named owner.'),
      oneLineFixIsNotRework: has(
        '**A defect you could have closed in a line is not rework. It is a fix you skipped.**',
      ),
    }).toStrictEqual({
      redFirst: true,
      rippleCheck: true,
      workerSeesOneChunk: true,
      neverBendATest: true,
      falseGreenCorrectedFirst: true,
      architecturalIsRework: true,
      oneLineFixIsNotRework: true,
    });
  });

  it('VALID: template => bans the build, destructive git, the Agent tool and any other ward', () => {
    expect({
      build: has('- **`npm run build`** — your parent already built'),
      destructiveGit: has('- **Destructive `git`**'),
      theRoundIsUncommittedWhenYouArrive: has(
        "The whole round is UNCOMMITTED when you arrive, so any of those verbs discards work no\n  commit is holding — every worker's, not just your own.",
      ),
      commitsAreRequired: has('**Committing the round and your\n  verdict is NOT on this list.**'),
      agentTool: has('- **The `Agent` tool** — you are a LEAF.'),
      theRoundsWardIsTheParents: has("- **The round's ward.**"),
    }).toStrictEqual({
      build: true,
      destructiveGit: true,
      theRoundIsUncommittedWhenYouArrive: true,
      commitsAreRequired: true,
      agentTool: true,
      theRoundsWardIsTheParents: true,
    });
  });

  // The entry used to read "Any ward but step 5's", which forbade the per-file run THREE
  // disciplines require as their proof:
  //
  // - `bug-repro` reverts each fix and re-runs that one test;
  // - `manual-qa` breaks a production line and runs the one test file to see whether it fails;
  // - `browser-e2e` reads `npm run ward -- detail <runId>` on an implausibly fast green.
  //
  // Step 6's own red-first instruction contradicted that entry too. What the ban forbids is a
  // second WHOLE-ROUND ward. It also forbids a different scope for the round's own pass.
  it('VALID: the ward ban => sends the round-scoped run to the parent and permits a single-file one', () => {
    expect({
      theParentRunsItTwice: has(
        'Your parent runs it, once, before it dispatches you, and once more after\n  you.',
      ),
      noStagedOfYourOwn: has(
        "Do not run `--staged` yourself and do not run the round's pass under some other scope.",
      ),
      narrowRunIsNotBanned: has('**A run over ONE file or ONE test is not on this list.**'),
      witnessingARed: has('- you witness a red before you fix it;'),
      provingAMutation: has('- you revert a line to see whether a test fails;'),
      readingAPriorRunsDetail: has('- you read a prior run with `npm run ward -- detail <runId>`.'),
      disciplineMayRequireIt: has('Your discipline above may require one as proof.'),
      noBlanketBan: has("Any ward but step 5's"),
    }).toStrictEqual({
      theParentRunsItTwice: true,
      noStagedOfYourOwn: true,
      narrowRunIsNotBanned: true,
      witnessingARed: true,
      provingAMutation: true,
      readingAPriorRunsDetail: true,
      disciplineMayRequireIt: true,
      noBlanketBan: false,
    });
  });

  // Step 1 is BLOCKING and names four tool calls. A reviewer that judges other agents' work
  // against its training defaults grades against rules this repo does not hold.
  it('VALID: step 1 => lists all four standards calls and says to batch them', () => {
    expect({
      blocking: has('**Load the project standards YOURSELF (BLOCKING).**'),
      fourCalls: has(
        '- `get-architecture`;\n   - `get-syntax-rules`;\n   - `get-testing-patterns`;\n   - `get-folder-detail`, once for every folder type in scope.',
      ),
      notTrainingDefaults: has(
        "Read this repo's real conventions rather\n   than your training defaults",
      ),
      batched: has('Batch them into ONE `ToolSearch` call with `discover`.'),
    }).toStrictEqual({
      blocking: true,
      fourCalls: true,
      notTrainingDefaults: true,
      batched: true,
    });
  });

  // ============================================================================================
  // CROSS-FILE AGREEMENTS. Each test spans this file and one other statics file, and derives its
  // needle from that other file's live value. An override literal, a plan field and a `NEXT:`
  // value are all plain prose on both sides: until these landed, a reword of either side stayed
  // green while the two files quietly stopped agreeing.
  // ============================================================================================
  describe('agreements with the operator above it and the two minions beside it', () => {
    // SPANS operator-prompt-statics.ts (it WRITES the post-refusal brief) ↔ this file (it is the
    // only reader). Two overrides ride in that brief and each changes what this session does:
    // `REFUSAL:` carries the outstanding units no tool hands back, and `SCOPE: quest` widens the
    // enumeration that would otherwise come back empty. Both are matched by SPELLING. Reword one on
    // either side and this session silently runs the default path, earning its parent the identical
    // refusal. There is no `SKIP WARD` on either side any more: this session runs no ward at all.
    it('VALID: {operator post-refusal brief, reviewer} => handles both overrides the operator writes, spelled identically', () => {
      expect({
        operatorWritesTheRefusalLine: REFUSAL_BRIEF_LINES.filter((line) =>
          line.startsWith(REFUSAL_LITERAL),
        ).length,
        operatorWritesTheScopeLineExactly: REFUSAL_BRIEF_LINES.includes(SCOPE_LITERAL),
        theScopeLinesValueIsTheArgumentThisTemplatePasses: SCOPE_LITERAL.endsWith(SCOPE_ARGUMENT),
        theBriefInventoryHereListsBoth: has(
          `any \`${REFUSAL_LITERAL}\` / \`${SCOPE_LITERAL}\` line.`,
        ),
        theOperatorSaysThatScopeLineIsNotOptional: OPERATOR.includes(
          `**\`${SCOPE_LITERAL}\` is not optional here.**`,
        ),
        andBothSidesGiveTheSameReason: OPERATOR.includes(
          "The reviewer's usual not-yet-pushed window is EMPTY,\nbecause you pushed at step 10.",
        ),
        whichIsWhatThisTemplateCallsIt: has('where `unpushed` comes back empty'),
        theOperatorNoLongerWritesASkipWardLine: OPERATOR.includes('SKIP WARD'),
        andThisTemplateNoLongerReadsOne: has('SKIP WARD'),
      }).toStrictEqual({
        operatorWritesTheRefusalLine: 1,
        operatorWritesTheScopeLineExactly: true,
        theScopeLinesValueIsTheArgumentThisTemplatePasses: true,
        theBriefInventoryHereListsBoth: true,
        theOperatorSaysThatScopeLineIsNotOptional: true,
        andBothSidesGiveTheSameReason: true,
        whichIsWhatThisTemplateCallsIt: true,
        theOperatorNoLongerWritesASkipWardLine: false,
        andThisTemplateNoLongerReadsOne: false,
      });
    });

    // SPANS operator-prompt-statics.ts ↔ the menu here. The operator matches the FIRST WORD of the
    // LAST line, so this menu has to declare exactly what that table routes AND stay on one line.
    // A wrapped continuation begins `|`, which matches no row, and the operator then takes its
    // no-`NEXT:`-line default — derived below rather than named, because the whole failure is that
    // the default silently replaces the value this session meant.
    it('VALID: {reviewer NEXT menu, operator NEXT table} => declares exactly the routed values, on ONE line no continuation can break', () => {
      expect({
        valuesThisTemplateDeclaresThatTheOperatorCannotRoute: NEXT_VALUES.filter(
          (value) => !OPERATOR_ROUTED_VALUES.includes(value),
        ),
        valuesTheOperatorRoutesThatThisTemplateNeverOffers: OPERATOR_ROUTED_VALUES.filter(
          (value) => !NEXT_VALUES.includes(value),
        ),
        menuLines: NEXT_MENU_LINES.length,
        everyValueSitsOnThatOneLine: NEXT_MENU_LINES.filter((line) =>
          OPERATOR_ROUTED_VALUES.every((value) => line.includes(value)),
        ).length,
        linesThatWouldReadAsAWrappedMenuArm: WRAPPED_MENU_CONTINUATIONS,
        thisTemplatesOwnValueTableRows: VALUE_TABLE_ROWS.length,
        thisTemplatesOwnValueTableRoutesTheSameValues: VALUE_TABLE_ROWS.filter(
          (value) => !OPERATOR_ROUTED_VALUES.includes(value),
        ),
        theOperatorsDefaultIsARowItAlsoRoutesNormally:
          OPERATOR_ROUTED_VALUES.includes(OPERATOR_FALLBACK_VALUE),
        andThisTemplateNamesThatDefaultAsTheCost: has(
          `It treats that as \`${OPERATOR_FALLBACK_VALUE}\`.`,
        ),
      }).toStrictEqual({
        valuesThisTemplateDeclaresThatTheOperatorCannotRoute: [],
        valuesTheOperatorRoutesThatThisTemplateNeverOffers: [],
        menuLines: 1,
        everyValueSitsOnThatOneLine: 1,
        linesThatWouldReadAsAWrappedMenuArm: [],
        thisTemplatesOwnValueTableRows: 3,
        thisTemplatesOwnValueTableRoutesTheSameValues: [],
        theOperatorsDefaultIsARowItAlsoRoutesNormally: true,
        andThisTemplateNamesThatDefaultAsTheCost: true,
      });
    });

    // SPANS planner-minion-statics.ts (it WRITES the plan fence) ↔ this file (it grades the round
    // against that fence). Every field named in step 2 has to be a field the plan really carries,
    // and step 4's set difference has to subtract the field the planner declares this session
    // grades by. Rename one in the plan and this session verifies against a heading that is not
    // in the file it just opened.
    it('VALID: {planner plan file, reviewer method} => grades against fields the plan actually carries', () => {
      expect({
        thePlannerWritesThisManyFields: PLAN_FIELDS.length,
        fieldsStepTwoNamesThatNoPlanCarries: FIELDS_STEP_TWO_GRADES.filter(
          (field) => !PLAN_FIELDS.includes(field),
        ),
        stepTwoNamesThisMany: FIELDS_STEP_TWO_GRADES.length,
        thePlannerDeclaresWhichFieldThisSessionGradesBy: PLAN_FIELDS.includes(GRADED_FIELD),
        andStepFourSubtractsThatExactField: has(
          `subtracting each chunk's \`${GRADED_FIELD}\` list`,
        ),
        theOperatorSendsThePlanPathRatherThanThePlan: OPERATOR_ROUND_BRIEF.includes(
          `PLAN: ${PLAN_PATH}`,
        ),
        soThisTemplateTakesThePathFromTheBriefAndHardcodesNone: template.includes(PLAN_PATH),
        andReadsTheFileAtWhateverPathArrives: has(
          '**Read the PLAN FILE** at the path your brief names.',
        ),
      }).toStrictEqual({
        thePlannerWritesThisManyFields: 8,
        fieldsStepTwoNamesThatNoPlanCarries: [],
        stepTwoNamesThisMany: 4,
        thePlannerDeclaresWhichFieldThisSessionGradesBy: true,
        andStepFourSubtractsThatExactField: true,
        theOperatorSendsThePlanPathRatherThanThePlan: true,
        soThisTemplateTakesThePathFromTheBriefAndHardcodesNone: false,
        andReadsTheFileAtWhateverPathArrives: true,
      });
    });

    // SPANS operator-prompt-statics.ts step 7 ↔ the opening of this file. Three things reach this
    // session from outside and nothing else carries any of them: the worker returns (which exist
    // NOWHERE else once the operator's turn ends), the parent's own `--staged` ward output, and the
    // quest id its checklist call needs. Each is produced by a file this one cannot see.
    it('VALID: {operator step 7 brief, reviewer} => expects exactly what that step sends', () => {
      expect({
        theOperatorSendsTheReturnsVerbatimAndInOrder: OPERATOR_ROUND_BRIEF.includes(
          '<every worker return from step 5, VERBATIM and in dispatch order>',
        ),
        andThisTemplateExpectsThemThatWay: has(
          'It also carries every\n`worker-minion` return from this round, verbatim, in dispatch order.',
        ),
        theOperatorSaysTheyExistNowhereElse: OPERATOR.includes(
          'Those returns exist NOWHERE else — not on the quest, not in git',
        ),
        theOperatorSendsItsOwnWardOutput: OPERATOR_ROUND_BRIEF.includes(
          "WARD:   <step 6's output, verbatim>",
        ),
        andThisTemplateReadsItRatherThanRunningOne: has(
          "5. **READ the round's ward result out of your brief.**",
        ),
        theBriefHeaderCarriesTheIdTheChecklistCallNeeds: OPERATOR_BRIEF_HEADER.includes(
          `Quest ID: ${CHECKLIST_ID}`,
        ),
      }).toStrictEqual({
        theOperatorSendsTheReturnsVerbatimAndInOrder: true,
        andThisTemplateExpectsThemThatWay: true,
        theOperatorSaysTheyExistNowhereElse: true,
        theOperatorSendsItsOwnWardOutput: true,
        andThisTemplateReadsItRatherThanRunningOne: true,
        theBriefHeaderCarriesTheIdTheChecklistCallNeeds: true,
      });
    });
  });
});
