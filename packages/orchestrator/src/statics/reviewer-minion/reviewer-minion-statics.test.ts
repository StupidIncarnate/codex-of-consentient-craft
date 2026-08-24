import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';
import { disciplineBugReproStatics } from '../discipline-bug-repro/discipline-bug-repro-statics';
import { disciplineImplementationStatics } from '../discipline-implementation/discipline-implementation-statics';
import { operatorPromptStatics } from '../operator-prompt/operator-prompt-statics';
import { plannerMinionStatics } from '../planner-minion/planner-minion-statics';
import { standardsReviewConcernsStatics } from '../standards-review-concerns/standards-review-concerns-statics';
import { reviewerMinionStatics } from './reviewer-minion-statics';

const { template } = reviewerMinionStatics.prompt;

const has = (needle: string): boolean => template.includes(needle);

// Bounded at `## The sweep brief`, not at `## What is not yours`: the sweep section carries a
// numbered list of its own, and a slice running past it counts those as method steps.
const METHOD = template.slice(
  template.indexOf('## Method — in this order'),
  template.indexOf('## The sweep brief'),
);

// ================================================================================================
// CROSS-FILE DERIVATIONS. Every needle built below comes out of the OTHER module's live value. A
// hardcoded copy of the other side's prose drifts exactly the way the prose drifts, and the test
// holding the stale copy goes quiet at the moment it should have failed.
// ================================================================================================
const OPERATOR = operatorPromptStatics.prompt.template;
const PLANNER = plannerMinionStatics.prompt.template;

// The operator's brief fence — the WHOLE grammar of every brief it writes. Its `SECTION:` row names
// the two dispatches this template handles differently from a plain round.
const BRIEF_FENCE_OPENS = OPERATOR.indexOf(
  '```',
  OPERATOR.indexOf(
    '**A brief takes the lines below that\napply to it, in the order they appear here.**',
  ),
);
const OPERATOR_BRIEF_FENCE = OPERATOR.slice(
  BRIEF_FENCE_OPENS + 3,
  OPERATOR.indexOf('```', BRIEF_FENCE_OPENS + 3),
);
const BRIEF_KEYS = Array.from(OPERATOR_BRIEF_FENCE.matchAll(/^([A-Z]+):/gmu)).map(
  (match) => match[1] ?? '',
);
const SECTION_VALUES = (
  /^SECTION: (?<values>[A-Za-z |-]+?) +←/mu.exec(OPERATOR_BRIEF_FENCE)?.groups?.values ?? ''
)
  .split('|')
  .map((value) => value.trim());

// The section the operator APPENDS after a refused signal, and the `SECTION:` value it dispatches
// the re-review under. Both are read off the operator, then looked for here.
const REFUSAL_SECTION =
  /APPEND a `(?<section>## [A-Za-z-]+)` section to the round document/u.exec(OPERATOR)?.groups
    ?.section ?? 'THE OPERATOR APPENDS NO REFUSAL SECTION';
const REFUSAL_DISPATCH =
  /dispatch ONE more `reviewer-minion` on `(?<line>SECTION: [A-Za-z-]+)`/u.exec(OPERATOR)?.groups
    ?.line ?? 'THE OPERATOR DISPATCHES NO RE-REVIEW';
const SCOPE_ARGUMENT =
  /\*\*Use `scope: '(?<scope>[a-z]+)'` instead/u.exec(template)?.groups?.scope ??
  'THIS TEMPLATE PASSES NO SCOPE';

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

// The plan section: the PLANNER appends it, this session grades against it.
const PLAN_FENCE_OPENS = PLANNER.indexOf('```', PLANNER.indexOf('## What you append'));
const PLAN_FENCE = PLANNER.slice(
  PLAN_FENCE_OPENS + 3,
  PLANNER.indexOf('```', PLAN_FENCE_OPENS + 3),
);
const PLAN_FIELDS = Array.from(PLAN_FENCE.matchAll(/^([A-Z]+):/gmu)).map((match) => match[1] ?? '');
const PLAN_PATH =
  /^## What you append — to the `PLAN:` path, at `(?<path>[^`]+)`$/mu.exec(PLANNER)?.groups?.path ??
  'THE PLANNER NAMES NO PLAN PATH';
const GRADED_FIELD =
  /\*\*`([A-Z]+)` is what the reviewer grades the chunk against\*\*/u.exec(PLANNER)?.[1] ??
  'THE PLANNER NAMES NO GRADED FIELD';
const STEP_TWO = template.slice(
  template.indexOf('2. **Read the ROUND DOCUMENT**'),
  template.indexOf('3. **OPEN EVERY FILE'),
);
const FIELDS_STEP_TWO_GRADES = Array.from(
  new Set(Array.from(STEP_TWO.matchAll(/`([A-Z]+)`/gu)).map((match) => match[1] ?? '')),
);

// THE ROUND LOG, and the markers that reach this session through it. The PLANNER writes the
// region's header. The two packs that ask a worker to DECLARE something own the marker vocabulary,
// as a table row each. Both sides are parsed off those live values: a pack that adds a marker this
// template never names would otherwise ship a line the round commit silently drops.
const ROUND_LOG_HEADING =
  /^(?<heading>## Round log)$/mu.exec(PLANNER)?.groups?.heading ??
  'THE PLANNER WRITES NO ROUND-LOG HEADING';
const MARKER_ROW = /^\| .+ \| `(?<marker>[A-Z]+:)` \|$/gmu;
const MARKERS = [
  ...disciplineImplementationStatics.workerMarkdown.matchAll(MARKER_ROW),
  ...disciplineBugReproStatics.workerMarkdown.matchAll(MARKER_ROW),
].map((match) => match.groups?.marker ?? '');

// The id this session's checklist call needs, and the section it reads that id out of.
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
      questIdHeading: /^## The quest id — everything else is in the round document$/mu.test(
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

  // THE BRIEF IS ONE PATH AND EVERYTHING ELSE IS ON DISK. The predecessor was handed every worker
  // return pasted into its brief — text the operator could not check a word of, made by the one
  // session forbidden to open a file. The document now holds all of it: the operator's context, the
  // planner's plan, every worker's report.
  it('VALID: the opening => names all five document sections and who writes each', () => {
    const table = template.slice(
      template.indexOf('| Section | Written by | What it gives you |'),
      template.indexOf('**Nothing else on this quest carries any of it.**'),
    );

    expect({
      theBriefIsOnePath: has(
        '**Your brief carries ONE thing: the `PLAN:` path of the round document.**',
      ),
      writtenByThreeKindsOfSession: has(
        'That single file holds the entire round, written by three kinds of session in turn:',
      ),
      context: table.includes('| `## Context` | your parent |'),
      rework: table.includes('| `## Rework` | your parent |'),
      plan: table.includes('| `## Plan` | the `planner-minion` |'),
      roundLog: table.includes('| `## Round log` | each `worker-minion` |'),
      sweepAndReReview: table.includes('| `## Sweep` / `## Re-review` | your parent |'),
      nothingElseCarriesIt: has('**Nothing else on this quest carries any of it.**'),
      theRoundIsUncommitted: has('**No worker committed anything**'),
    }).toStrictEqual({
      theBriefIsOnePath: true,
      writtenByThreeKindsOfSession: true,
      context: true,
      rework: true,
      plan: true,
      roundLog: true,
      sweepAndReReview: true,
      nothingElseCarriesIt: true,
      theRoundIsUncommitted: true,
    });
  });

  // `$ARGUMENTS` RESOLVES TO ONE LINE for a minion, not to a briefing.
  // `agentPromptGetBroker`'s minion-fetch branch substitutes `Quest ID: <uuid>` and nothing else.
  // It substitutes nothing richer because anything richer needs a `workItemId`. A minion that
  // passed a `workItemId` would be held open by `subagentStopNeedsBlockGuard` until it signalled on
  // its PARENT's operation item. So everything else reaches this session off disk. The section used
  // to be headed "## Briefing", which told a reviewer its briefing was one id.
  it('VALID: the last section => says the whole round is on disk and this line is the authoritative id', () => {
    expect({
      honestHeading: /^## The quest id — everything else is in the round document$/mu.test(
        template,
      ),
      noBriefingHeading: /^## Briefing$/mu.test(template),
      briefIsTheSpawnMessage: has(
        "**Your BRIEF is your parent's spawn message, not this section.**",
      ),
      itIsShort: has(
        'It is SHORT — a `PLAN:` path, and\non two kinds of dispatch a `SECTION:` line naming `Sweep` or `Re-review`.',
      ),
      nothingElseArrives: has('**Nothing else arrives,\nand nothing else should.**'),
      // No `WARD:` block in the inventory: this session runs the ward itself, at step 5. A block
      // listed here that the parent never sends is how a session concludes its brief arrived broken
      // and grades the round degraded.
      everythingElseIsOffDisk: has(
        "The plan, every worker's report, the three ids and any refusal all reach\nyou out of the document itself, at step 2.",
      ),
      aPathOnlyBriefIsWorking: has('A brief that carries only a path is the brief working.'),
      oneLineOnly: has('It carries exactly one line.'),
      thisOneWins: has(
        'Where that line and the document\ndisagree about the quest id, THIS one is right.',
      ),
    }).toStrictEqual({
      honestHeading: true,
      noBriefingHeading: false,
      briefIsTheSpawnMessage: true,
      itIsShort: true,
      nothingElseArrives: true,
      everythingElseIsOffDisk: true,
      aPathOnlyBriefIsWorking: true,
      oneLineOnly: true,
      thisOneWins: true,
    });
  });

  // A REFUSED `signal-back` sends the parent back with ONE more reviewer. The refusal message is
  // `signal-back`'s own list of the outstanding units, and no tool hands it back — so the parent
  // APPENDS it to the round document and dispatches on `SECTION: Re-review`. A template that never
  // mentioned that section left the one session that could act on the list unable to find it.
  it('VALID: the last section => reads the re-review section first and treats its units as the scope', () => {
    expect({
      readItFirst: has(
        `**On a \`${REFUSAL_DISPATCH}\` brief, read the document's \`${REFUSAL_SECTION}\` section before anything\nelse.**`,
      ),
      verbatimFromSignalBack: has(
        'It is the message `signal-back` threw at your parent, verbatim.',
      ),
      namesTheOutstandingUnits: has(
        'It names every unit still\ncarrying no disposition or no sign-off.',
      ),
      thoseUnitsAreTheScope: has('**Those named units ARE the scope of this re-review.**'),
      settleEachOne: has('Settle\neach one. Write its record.'),
      questScopeAtStepEight: has(
        `Enumerate under \`scope: '${SCOPE_ARGUMENT}'\` at step 8, because that round is\nalready pushed and \`unpushed\` comes back empty.`,
      ),
      noToolHandsItBack: has('No tool hands that list back to you'),
      theDocumentIsTheOnlyCopy: has(
        'listed it once, and the document is now the only place it exists',
      ),
      reReviewIsNotDegraded: has('**A re-review is not a degraded round.**'),
      gradedAgainstTheRefusalsUnits: has(
        "Grade it against the refusal's units, the `## Plan` and the\ncommits.",
      ),
      itsRoundLogIsNotItsToGrade: has(
        'Its `## Round log` belongs to a round you are not re-grading.',
      ),
    }).toStrictEqual({
      readItFirst: true,
      verbatimFromSignalBack: true,
      namesTheOutstandingUnits: true,
      thoseUnitsAreTheScope: true,
      settleEachOne: true,
      questScopeAtStepEight: true,
      noToolHandsItBack: true,
      theDocumentIsTheOnlyCopy: true,
      reReviewIsNotDegraded: true,
      gradedAgainstTheRefusalsUnits: true,
      itsRoundLogIsNotItsToGrade: true,
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
      wardScoped: true,
      wardNone: false,
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
        continueMeaning: has(
          '| `continue` | Ends its own session. **It is the ONLY line that ends it.** |',
        ),
        continueConditions: has(
          "**Write `continue` when all three of these hold:**\n\n- every chunk's `INTENT` is true;\n- every unit carries a disposition;\n- the ward is green.",
        ),
        continueCoversAnEmptyRound: has(
          'A round that produced nothing at all still earns `continue`',
        ),
        reworkLoops: has(
          "| `rework` | Runs the whole loop again, with your text as the next planner's entire scope. There is no cap on how many times. |",
        ),
        inChunkTerms: has("in the plan's own chunk terms"),
        paddingSpendsARound: has('**Padding it spends a whole round on nothing.**'),
        theParentHasNoRoundCap: has('**Your parent has no round cap**'),
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
        theParentHasNoRoundCap: true,
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
    it('VALID: the padding cost => names what a padded round really costs, and caps nothing', () => {
      expect({
        theParentHasNoRoundCap: has('**Your parent has no round cap**'),
        soItJustRunsTheRound: has(
          'so it does not\n  refuse the round — it just runs it, and the next reviewer inherits whatever you padded.',
        ),
        andTheCostIsWallClockAndContext: has(
          'Every\n  round you add is wall-clock the quest pays for and a context the next session has to reconstruct\n  from git.',
        ),
        noRoundBudgetClaim: has('budget of three rounds'),
        noHardCodedThreeAttempts: has('three pt attempts'),
      }).toStrictEqual({
        theParentHasNoRoundCap: true,
        soItJustRunsTheRound: true,
        andTheCostIsWallClockAndContext: true,
        noRoundBudgetClaim: false,
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
        // The `rework` text is not just handed back — the parent writes it into the NEXT round's
        // document, where the next planner reads it as its whole scope.
        reworkGoesIntoTheNextDocument: has(
          "Your `rework` text is the next planner's entire scope — your parent writes it into the next round\ndocument's `## Rework` section verbatim.",
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
        reworkGoesIntoTheNextDocument: true,
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
      }).toStrictEqual({
        exactlyOneNextLine: 1,
        noLineStartsWithTheWallArm: false,
        oneLineAndLast: true,
        parentMatchesTheFirstWord: true,
        continuationStartsWithAPipe: true,
        fallsThroughToRework: true,
        andDispatchesIntoTheWall: true,
        writeNothingBeneathIt: true,
      });
    });
  });

  // STEP 7 COMMITS BEFORE STEP 8 ENUMERATES. `get-blight-checklist` reads COMMITTED history. The
  // completion gate the parent is held to measures a range that INCLUDES this session's commits.
  // The predecessor said BOTH "commit everything before you enumerate" AND "write each disposition
  // as you finish each file". Both cannot hold. A session that enumerates last writes every
  // disposition in one batch at the end, which is exactly what the anti-batch rule forbids. So the
  // commits split in two: the round first, then the verdict. The verdict commit touches no
  // implementation file, so it creates no new unit.
  describe('the method order', () => {
    // The PUSH is step 11, after both commits, and the return is step 12. Publishing before the
    // verdict commit would put a round on origin with no verdict attached to it.
    it('VALID: template => numbers its steps 1 through 12, contiguously, and pushes at 11', () => {
      expect({
        steps: Array.from(METHOD.matchAll(/^\d+\. \*\*/gmu)).map((match) => match[0]),
        pushAfterBothCommits:
          METHOD.indexOf('**COMMIT your verdict.**') < METHOD.indexOf('**`git push`.** Bare'),
        andReturnLast:
          METHOD.indexOf('**`git push`.** Bare') < METHOD.indexOf('**Return the block below.**'),
      }).toStrictEqual({
        steps: [
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
          '12. **',
        ],
        pushAfterBothCommits: true,
        andReturnLast: true,
      });
    });

    it('VALID: the method => commits the round BEFORE it enumerates, and commits the verdict after', () => {
      expect({
        roundCommitBeforeEnumerate:
          METHOD.indexOf('**COMMIT THE WHOLE ROUND**') <
          METHOD.indexOf('**ENUMERATE the review units.**'),
        enumerateBeforeDispositions:
          METHOD.indexOf('**ENUMERATE the review units.**') <
          METHOD.indexOf('**Write a disposition for every unit'),
        dispositionsBeforeVerdictCommit:
          METHOD.indexOf('**Write a disposition for every unit') <
          METHOD.indexOf('**COMMIT your verdict.**'),
        readTheFilesBeforeBuilding:
          METHOD.indexOf('**OPEN EVERY FILE THE ROUND PRODUCED.**') <
          METHOD.indexOf('**NOW BUILD, THEN WARD'),
        buildBeforeFixing:
          METHOD.indexOf('**NOW BUILD, THEN WARD') < METHOD.indexOf('**FIX what you can'),
      }).toStrictEqual({
        roundCommitBeforeEnumerate: true,
        enumerateBeforeDispositions: true,
        dispositionsBeforeVerdictCommit: true,
        readTheFilesBeforeBuilding: true,
        buildBeforeFixing: true,
      });
    });

    // THE MARKERS' ONE ROUTE OUT OF THE ROUND. A worker's return carries two lines, and no worker
    // commits, so an `ADJUSTED:` / `ADDED:` / `REPAIR:` / `CORRECTED:` line survives the round only
    // by this pair: step 2 READS the region its workers appended to, step 7 TRANSCRIBES it into the
    // round's one commit. Drop either half and a round that moved a target the user approved lands
    // with nothing anywhere saying so. Both needles for the region come off the PLANNER's live
    // value, since that minion writes the header.
    it('VALID: {step 2, step 7} => reads the round log its workers appended to, then commits what it found', () => {
      expect({
        stepTwoReadsTheRegionThePlannerWrote: STEP_TWO.includes(
          `**Then read the \`${ROUND_LOG_HEADING}\` at the BOTTOM of the document.**`,
        ),
        andSaysThatReportReachesItNowhereElse: STEP_TWO.includes(
          '**That is the entire worker\n   report and it reaches you nowhere else**',
        ),
        andSaysWhyTheParentNeverHeldIt: STEP_TWO.includes(
          'your parent never held it, because your parent may not\n   open a source file',
        ),
        // Two `###` headings live in one document. A reviewer that read them as the same heading
        // would grade a worker's report against itself.
        andKeepsTheTwoHeadingsApart: STEP_TWO.includes(
          "**A `### report — chunk 3` heading is a REPORT and a `### chunk 3` heading\n   is the PLAN's**; do not grade one against itself.",
        ),
        andHandsTheMarkersToStepSeven: STEP_TWO.includes(
          'Step 7 is where\n   you carry those lines onward.',
        ),
        stepSevenCopiesEveryMarkerVerbatim: has(
          `**Copy every marker line from step 2's \`${ROUND_LOG_HEADING}\` into that body, verbatim.**`,
        ),
        thePacksDeclareThisManyMarkers: MARKERS.length,
        andThisTemplateNamesEveryOne: MARKERS.filter((marker) => !has(`\`${marker}\``)),
        andSaysThisCommitIsWhereAHumanReadsIt: has(
          '**This commit is where a human reads that the round moved a target**',
        ),
        aNoneBlockAddsNothing: has('A block reading `none` puts no line in the body.'),
        aMissingReportIsAFinding: STEP_TWO.includes(
          '**A chunk in that index with no report in the round log is a chunk that reported\n   nothing.**',
        ),
      }).toStrictEqual({
        stepTwoReadsTheRegionThePlannerWrote: true,
        andSaysThatReportReachesItNowhereElse: true,
        andSaysWhyTheParentNeverHeldIt: true,
        andKeepsTheTwoHeadingsApart: true,
        andHandsTheMarkersToStepSeven: true,
        stepSevenCopiesEveryMarkerVerbatim: true,
        thePacksDeclareThisManyMarkers: 4,
        andThisTemplateNamesEveryOne: [],
        andSaysThisCommitIsWhereAHumanReadsIt: true,
        aNoneBlockAddsNothing: true,
        aMissingReportIsAFinding: true,
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
          'So every file this round produced is sitting in the\n   tree right now, theirs and your fixes together',
        ),
        andTheDocumentItself: has('and the round document carries every report they\n   appended'),
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
        andTheDocumentItself: true,
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
  // check type over every source file that origin does not have yet. That IS the round, because
  // this session pushes once at the end of it. `scope: 'unpushed'` measures the identical boundary.
  // The two tools therefore cannot disagree about what the round was.
  describe('the round build and ward', () => {
    // THIS SESSION RUNS BOTH, AND IT IS THE ONLY ONE ON THE QUEST THAT DOES. The ORDER is what makes
    // it the right one: step 3 has already opened every file, so an error the build names is a
    // step-6 fix in this same turn rather than the next round's scope. The step bans running either
    // EARLY, in the other direction — a compiler's error list read first becomes the thing the
    // session looks for, and the defect the compiler cannot name is the one it then misses. That
    // class of defect is the entire reason this session opens files at all.
    it('VALID: step 5 => runs the build then the --staged ward, and only after reading every file', () => {
      expect({
        theStep: has('5. **NOW BUILD, THEN WARD — and not one step earlier.**'),
        afterReadingEveryFile: has('You have just read every file.'),
        bothCommandsInOrder: has('npm run build\n   npm run ward -- --staged'),
        eachAsItsOwnCommand: has('each as its OWN command with nothing chained after it'),
        foregroundWithTimeout: has('Foreground, `timeout: 600000`.'),
        wardRejectsCompanions: has('ward rejects both\n   alongside `--staged`'),
        everyCheckType: has(
          'That scope is every check type over every source file origin does not have\n   yet, which IS this round',
        ),
        theOnlySessionThatRunsEither: has(
          '**You are the ONLY session on this quest that runs either command.**',
        ),
        becauseAWaveWouldRaceIt: has(
          "a WAVE of them runs at once, `tsc` writes one shared `dist/` per package, and\n   ward's typecheck is `tsc -b`, which BUILDS",
        ),
        theOnlyTypecheck: has('**This is the\n   first and only TYPECHECK the round gets**'),
        afterIsThePoint: has('**Running them AFTER you read the files is the point.**'),
        aStragglerIsAFixNotARound: has(
          'A build straggler is a fix you make at\n   step 6, in this turn, with the file already open',
        ),
        andWhyRunningThemEarlyIsWorse: has(
          'you would then read every file\n   looking for what the compiler already named',
        ),
        aSweepBriefSkipsIt: has(
          '**A `SECTION: Sweep` brief runs a different job entirely.** See **The sweep brief** below. Skip\n   this step on it.',
        ),
        andItsPathsAreInTheDocument: has(
          "wrote them into the document's `## Sweep`\nsection, one per line.",
        ),
      }).toStrictEqual({
        theStep: true,
        afterReadingEveryFile: true,
        bothCommandsInOrder: true,
        eachAsItsOwnCommand: true,
        foregroundWithTimeout: true,
        wardRejectsCompanions: true,
        everyCheckType: true,
        theOnlySessionThatRunsEither: true,
        becauseAWaveWouldRaceIt: true,
        theOnlyTypecheck: true,
        afterIsThePoint: true,
        aStragglerIsAFixNotARound: true,
        andWhyRunningThemEarlyIsWorse: true,
        aSweepBriefSkipsIt: true,
        andItsPathsAreInTheDocument: true,
      });
    });

    // NOTHING RUNS AFTER THIS SESSION, so a fix it makes at step 6 is graded by nothing unless it
    // re-runs the pair itself. The cap is TWO passes: a compile error still standing after the second
    // is one the next planner should be cutting a chunk for, not one worth a third attempt against a
    // three-round budget.
    it('VALID: step 6 => re-runs the pair to check its own fixes, capped at twice', () => {
      expect({
        recheckYourOwnFixes: has(
          '**CHECK YOUR OWN FIXES: run `npm run build` and `npm run ward -- --staged` once more.**',
        ),
        onlyIfYouChangedSomething: has('Only if\n   you changed something at this step'),
        becauseNobodyRunsAfterYou: has(
          'Nobody runs either\n   command after you, so this second pass is the only thing that grades what you just wrote.',
        ),
        cappedAtTwice: has('**Run that pair TWICE at most.**'),
        andStop: has('Fix, re-run, and stop.'),
        stillRedIsRework: has(
          'A red still standing after the second pass\n   is your `NEXT: rework`, carrying the failing output VERBATIM',
        ),
        notAThirdAttempt: has('not a third attempt'),
        listThemInFixesMade: has('List every fix you made in the `FIXES MADE` block either way.'),
        andTheOldHandOffToTheParentIsGone: has(
          '**You cannot re-run the ward to check your own fixes.**',
        ),
      }).toStrictEqual({
        recheckYourOwnFixes: true,
        onlyIfYouChangedSomething: true,
        becauseNobodyRunsAfterYou: true,
        cappedAtTwice: true,
        andStop: true,
        stillRedIsRework: true,
        notAThirdAttempt: true,
        listThemInFixesMade: true,
        andTheOldHandOffToTheParentIsGone: false,
      });
    });

    // The parent dispatches the post-push re-review after it has pushed, so the `unpushed` window
    // is empty. That exception is keyed on the `SECTION:` value the parent writes into the brief,
    // so it is not a judgement this session makes.
    it('VALID: template => carries the post-push scope exception, keyed on the brief section', () => {
      expect({
        scopeQuest: has(
          `**Use \`scope: '${SCOPE_ARGUMENT}'\` instead on a\n   \`${REFUSAL_DISPATCH}\` brief.**`,
        ),
        scopeQuestReason: has('That round is already pushed, so `unpushed` comes back empty.'),
        sameBoundary: has('`unpushed` is the same boundary your OWN `--staged` run used at step 5'),
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
  it('VALID: step 2 => reads the ids and verifies against the plan SUMMARY as well as every chunk field', () => {
    expect({
      theThreeIds: has('**`## Context` carries the three ids**'),
      onItsFirstThreeLines: has(
        'on its first three lines: `Quest ID:`,\n   `Work Item ID:` and `Operation Item ID:`. Read them from there.',
      ),
      andWhyRetypingOneCosts: has(
        'UUID-validated — a wrong one is a REJECTED write, not a degraded one.',
      ),
      summaryAndChunks: has(
        "**`## Plan` is what you verify the round against**: its `SUMMARY`, and each chunk's\n   `INTENT`, `FILES` list and `UNITS` list.",
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
        "**A worker's report is a CLAIM about that plan, never\n   a substitute for it.**",
      ),
    }).toStrictEqual({
      theThreeIds: true,
      onItsFirstThreeLines: true,
      andWhyRetypingOneCosts: true,
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

  // THE BUILD, THE `--staged` WARD AND THE PUSH ARE ALL THIS SESSION'S — steps 5, 6 and 11 — so the
  // list says by name that none of them is on it. An entry banning one would contradict the method
  // above it, and a prompt that contradicts itself is resolved by whichever line the agent reads
  // first. What the list DOES ban is the WHOLE-REPO bare run, the dispatcher's own ledger item,
  // and any rewrite of the document three other sessions wrote.
  it('VALID: template => bans destructive git, the Agent tool, the whole-repo ward and rewriting the document', () => {
    expect({
      destructiveGit: has('- **Destructive `git`**'),
      andPushIsNotOnThatList: has(
        '- **Destructive `git`** — no `stash`, no `reset`, no `checkout --`, no `clean`, no `rebase`.',
      ),
      theRoundIsUncommittedWhenYouArrive: has(
        "The whole round is UNCOMMITTED when you arrive, so any of those verbs discards work no commit is\n  holding — every worker's, not just your own.",
      ),
      commitsAreRequired: has(
        '**Your two commits and your push are NOT\n  on this list.** Those are steps 7, 10 and 11. All three are required.',
      ),
      agentTool: has('- **The `Agent` tool** — you are a LEAF.'),
      wholeRepoWardOnly: has('- **The whole-repo `npm run ward`, bare.**'),
      itIsTheDispatchersItem: has(
        'The dispatcher runs that regression pass itself, as its\n  own ledger item, after your parent signals.',
      ),
      neitherOfItsOwnTwoIsBanned: has(
        '**Neither\n  `npm run build` nor `npm run ward -- --staged` is on this list**',
      ),
      butRunningThemEarlyIs: has('- **Running either one BEFORE step 5.**'),
      andWhy: has(
        'A compiler error list read early\n  becomes the thing you look for, and the defect it cannot name is the one you then miss.',
      ),
      rewritingTheDocument: has('- **Rewriting any section of the round document.**'),
      itReadsAndCommitsIt: has('You READ all of it and you COMMIT it. You\n  add nothing to it'),
      noStaleBuildBan: has('- **`npm run build`** — your parent already built'),
    }).toStrictEqual({
      destructiveGit: true,
      andPushIsNotOnThatList: true,
      theRoundIsUncommittedWhenYouArrive: true,
      commitsAreRequired: true,
      agentTool: true,
      wholeRepoWardOnly: true,
      itIsTheDispatchersItem: true,
      neitherOfItsOwnTwoIsBanned: true,
      butRunningThemEarlyIs: true,
      andWhy: true,
      rewritingTheDocument: true,
      itReadsAndCommitsIt: true,
      noStaleBuildBan: false,
    });
  });

  // The entry used to read "Any ward but step 5's", which forbade the per-file run THREE
  // disciplines require as their proof:
  //
  // - `bug-repro` reverts each fix and re-runs that one test;
  // - `manual-qa` breaks a production line and runs the one test file to see whether it fails;
  // - `browser-e2e` reads `npm run ward -- detail <runId>` on an implausibly fast green.
  //
  // Step 6's own red-first instruction contradicted that entry too. A NARROW run stays permitted at
  // any point, and three discipline packs assert against this carve-out from their own side.
  it('VALID: the ward ban => still permits a single-file run, at any point', () => {
    expect({
      narrowRunIsFineAtAnyPoint: has('A ward over ONE file or ONE test is fine at any point.'),
      witnessingARed: has('- you witness a red before you fix it;'),
      provingAMutation: has('- you revert a line to see whether a test fails;'),
      readingAPriorRunsDetail: has('- you read a prior run with `npm run ward -- detail <runId>`.'),
      disciplineMayRequireIt: has('Your discipline above may require one as proof.'),
      noBlanketBan: has("Any ward but step 5's"),
      noHandOffToTheParent: has('Your parent runs it, once, before it dispatches you'),
    }).toStrictEqual({
      narrowRunIsFineAtAnyPoint: true,
      witnessingARed: true,
      provingAMutation: true,
      readingAPriorRunsDetail: true,
      disciplineMayRequireIt: true,
      noBlanketBan: false,
      noHandOffToTheParent: false,
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
  // needle from that other file's live value. A section heading, a plan field and a `NEXT:` value
  // are all plain prose on both sides: until these landed, a reword of either side stayed green
  // while the two files quietly stopped agreeing.
  // ============================================================================================
  describe('agreements with the operator above it and the two minions beside it', () => {
    // SPANS operator-prompt-statics.ts (it APPENDS the re-review section and dispatches on it) ↔
    // this file (the only reader of either). The refusal message is `signal-back`'s own list of the
    // outstanding units and no tool hands it back, so a rename of that section on one side leaves
    // this session enumerating the default window and earning its parent the identical refusal.
    it('VALID: {operator refusal path, reviewer} => reads the section the operator appends, under the value it dispatches', () => {
      expect({
        theSectionTheOperatorAppends: REFUSAL_SECTION,
        theValueItDispatchesUnder: REFUSAL_DISPATCH,
        thatValueIsOneTheBriefFenceDeclares: SECTION_VALUES.some((value) =>
          REFUSAL_DISPATCH.endsWith(value),
        ),
        thisTemplateReadsThatSectionFirst: has(
          `read the document's \`${REFUSAL_SECTION}\` section before anything\nelse.**`,
        ),
        andWidensTheScopeOnThatSameValue: has(
          `**Use \`scope: '${SCOPE_ARGUMENT}'\` instead on a\n   \`${REFUSAL_DISPATCH}\` brief.**`,
        ),
        theOperatorSaysWhyItMustBeVerbatim: OPERATOR.includes(
          '**Word for word, because that message is the only copy that will ever exist.**',
        ),
        andBothSidesSayNoToolRepeatsIt: has('No tool hands that list back to you'),
        theOperatorNoLongerWritesASkipWardLine: OPERATOR.includes('SKIP WARD'),
        andThisTemplateNoLongerReadsOne: has('SKIP WARD'),
      }).toStrictEqual({
        theSectionTheOperatorAppends: '## Re-review',
        theValueItDispatchesUnder: 'SECTION: Re-review',
        thatValueIsOneTheBriefFenceDeclares: true,
        thisTemplateReadsThatSectionFirst: true,
        andWidensTheScopeOnThatSameValue: true,
        theOperatorSaysWhyItMustBeVerbatim: true,
        andBothSidesSayNoToolRepeatsIt: true,
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

    // SPANS planner-minion-statics.ts (it APPENDS the plan) ↔ this file (it grades the round
    // against that plan). Every field named in step 2 has to be a field the plan really carries,
    // and step 4's set difference has to subtract the field the planner declares this session
    // grades by. Rename one in the plan and this session verifies against a heading that is not
    // in the document it just opened.
    it('VALID: {planner plan format, reviewer method} => grades against fields the plan actually carries', () => {
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
        theOperatorSendsThePlanPathRatherThanThePlan: OPERATOR_BRIEF_FENCE.includes(
          `PLAN: ${PLAN_PATH}`,
        ),
        soThisTemplateHardcodesNoPath: template.includes(PLAN_PATH),
        andReadsTheDocumentAtWhateverPathArrives: has(
          '2. **Read the ROUND DOCUMENT** at the path your brief names, whole, top to bottom.',
        ),
      }).toStrictEqual({
        thePlannerWritesThisManyFields: 7,
        fieldsStepTwoNamesThatNoPlanCarries: [],
        stepTwoNamesThisMany: 4,
        thePlannerDeclaresWhichFieldThisSessionGradesBy: true,
        andStepFourSubtractsThatExactField: true,
        theOperatorSendsThePlanPathRatherThanThePlan: true,
        soThisTemplateHardcodesNoPath: false,
        andReadsTheDocumentAtWhateverPathArrives: true,
      });
    });

    // SPANS operator-prompt-statics.ts's brief fence ↔ the opening of this file. The brief carries
    // a path and at most one more line, so everything this session grades against comes off disk.
    //
    // BOTH SIDES ARE ASSERTED EMPTY OF A `WARD:` BLOCK. This session runs its own build and ward at
    // step 5; a brief promising a block nobody writes sends it looking, and it then grades a brief it
    // believes incomplete as a degraded round.
    it('VALID: {operator brief fence, reviewer} => expects exactly what that fence sends, and no ward block', () => {
      expect({
        theFenceCarriesTheseKeys: BRIEF_KEYS,
        theOperatorSendsNoWorkerReturns: OPERATOR.includes('every worker return'),
        andSaysItForwardsNeither: OPERATOR.includes('**You forward nothing**'),
        andThisTemplateReadsThemOffDiskInstead: has(
          `**Then read the \`${ROUND_LOG_HEADING}\` at the BOTTOM of the document.**`,
        ),
        theOperatorSendsNoWardOutput: OPERATOR_BRIEF_FENCE.includes('WARD:'),
        andThisTemplateRunsOneRatherThanReadingIt: has(
          '5. **NOW BUILD, THEN WARD — and not one step earlier.**',
        ),
        andTheOperatorSaysThatSessionOwnsBoth: OPERATOR.includes(
          'your REVIEWER builds, once, after it reads the round',
        ),
        // The quest id is the ONE placeholder this template names. It arrives on the fetch line of
        // the brief fence and again in the document's `## Context`.
        theFenceCarriesTheIdTheChecklistCallNeeds: OPERATOR_BRIEF_FENCE.includes(
          `questId: '${CHECKLIST_ID}'`,
        ),
      }).toStrictEqual({
        theFenceCarriesTheseKeys: ['PLAN', 'WAVE', 'CHUNK', 'SECTION'],
        theOperatorSendsNoWorkerReturns: false,
        andSaysItForwardsNeither: true,
        andThisTemplateReadsThemOffDiskInstead: true,
        theOperatorSendsNoWardOutput: false,
        andThisTemplateRunsOneRatherThanReadingIt: true,
        andTheOperatorSaysThatSessionOwnsBoth: true,
        theFenceCarriesTheIdTheChecklistCallNeeds: true,
      });
    });
  });
});
