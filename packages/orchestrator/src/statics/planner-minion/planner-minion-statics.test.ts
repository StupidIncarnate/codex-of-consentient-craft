import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';
import { operatorPromptStatics } from '../operator-prompt/operator-prompt-statics';
import { reviewerMinionStatics } from '../reviewer-minion/reviewer-minion-statics';
import { workerMinionStatics } from '../worker-minion/worker-minion-statics';
import { plannerMinionStatics } from './planner-minion-statics';

const { template } = plannerMinionStatics.prompt;

const has = (needle: string): boolean => template.includes(needle);

// ================================================================================================
// CROSS-FILE DERIVATIONS. Every needle built below comes out of the OTHER module's live value. A
// hardcoded copy of the other side's prose drifts exactly the way the prose drifts, and a test that
// holds a stale copy goes quiet at the moment it should have failed.
// ================================================================================================
const OPERATOR = operatorPromptStatics.prompt.template;
const WORKER = workerMinionStatics.prompt.template;
const REVIEWER = reviewerMinionStatics.prompt.template;

const FLAT_TEMPLATE = template.replace(/\s+/gu, ' ');

// The operator's step-3 brief — the ONLY producer of the block labels Method step 1 reads back.
const PLANNER_BRIEF_OPENS = OPERATOR.indexOf(
  '```',
  OPERATOR.indexOf('**3. Dispatch ONE `planner-minion`.**'),
);
const OPERATOR_PLANNER_BRIEF = OPERATOR.slice(
  PLANNER_BRIEF_OPENS + 3,
  OPERATOR.indexOf('```', PLANNER_BRIEF_OPENS + 3),
);
const OPERATOR_BRIEF_BLOCKS = Array.from(OPERATOR_PLANNER_BRIEF.matchAll(/^[A-Z][A-Z ]*:/gmu)).map(
  (match) => match[0],
);
const OPERATOR_FIRST_BLOCK = OPERATOR_BRIEF_BLOCKS[0] ?? 'THE OPERATOR BRIEF CARRIES NO BLOCK';

// The post-refusal REVIEWER brief — the one place in this pipeline where `SCOPE:` is a real label.
const REFUSAL_BRIEF_OPENS = OPERATOR.indexOf(
  '```',
  OPERATOR.indexOf('Dispatch ONE more `reviewer-minion`:'),
);
const OPERATOR_REFUSAL_BRIEF = OPERATOR.slice(
  REFUSAL_BRIEF_OPENS + 3,
  OPERATOR.indexOf('```', REFUSAL_BRIEF_OPENS + 3),
);

// The header the operator mandates at the top of EVERY minion brief.
const HEADER_OPENS = OPERATOR.indexOf(
  '```',
  OPERATOR.indexOf('**Open every brief with this header.**'),
);
const OPERATOR_BRIEF_HEADER = OPERATOR.slice(
  HEADER_OPENS + 3,
  OPERATOR.indexOf('```', HEADER_OPENS + 3),
);
const OPERATOR_HEADER_FIELDS = Array.from(
  OPERATOR_BRIEF_HEADER.matchAll(/(?:^|· )([A-Za-z][A-Za-z ]*):/gmu),
).map((match) => match[1] ?? '');
const HEADER_PLAN_PATH =
  /plan file: (\S+)/u.exec(OPERATOR_BRIEF_HEADER)?.[1] ?? 'THE HEADER NAMES NO PLAN FILE';

// The operator's routing table: the only reader of any minion's `NEXT:` line.
const OPERATOR_ROUTED_VALUES = Array.from(
  OPERATOR.slice(
    OPERATOR.indexOf('| The line says | You do |'),
    OPERATOR.indexOf('**`continue` and `rework` do the same thing'),
  ).matchAll(/^\| `([a-z]+)` \|/gmu),
).map((match) => match[1] ?? '');

// Method step 1 and the blocks it lists.
const METHOD_STEP_ONE = template.slice(
  template.indexOf('1. **Read your brief first.**'),
  template.indexOf('2. **Load the project standards YOURSELF'),
);
const BLOCKS_THIS_STEP_READS = Array.from(METHOD_STEP_ONE.matchAll(/^ +- `([A-Z]+:)`/gmu)).map(
  (match) => match[1] ?? '',
);

// Each template's own `NEXT:` vocabulary — one value per line here, the whole menu on ONE line in
// the worker and the reviewer.
const [NEXT_VALUES = [], WORKER_NEXT = [], REVIEWER_NEXT = []] = [template, WORKER, REVIEWER].map(
  (source) =>
    source
      .split('\n')
      .filter((line) => line.startsWith('NEXT:'))
      .flatMap((line) => line.slice('NEXT:'.length).split('|'))
      .map((arm) => arm.trim().split(' ')[0] ?? '')
      .filter((word) => word !== ''),
);
const VALUES_ROUTED_BUT_NOT_THIS_SESSIONS = OPERATOR_ROUTED_VALUES.filter(
  (value) => !NEXT_VALUES.includes(value),
);

// The commit subjects Method step 5 sends this session into the log for. Both are written by the
// two minions that run BELOW this one in the same round.
const WORKER_CHUNK_SUBJECT =
  /Then commit with the subject `([^`]+)`/u.exec(WORKER)?.[1] ?? 'THE WORKER NAMES NO SUBJECT';
const REVIEWER_SUBJECTS = Array.from(REVIEWER.matchAll(/subject\s+`([^`]+)`/gu)).map(
  (match) => match[1] ?? '',
);
const REVIEW_SUBJECT_CLAIM =
  /commits its round under `([^`]+)`/u.exec(template)?.[1] ?? 'THIS TEMPLATE CLAIMS NO SUBJECT';
const REVIEW_SUBJECT_PREFIX = REVIEW_SUBJECT_CLAIM.slice(0, REVIEW_SUBJECT_CLAIM.indexOf(':') + 2);

describe('plannerMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(plannerMinionStatics).toStrictEqual({
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

  // `$ARGUMENTS` resolves to one line for a minion. That line is not a briefing.
  // `agentPromptGetBroker`'s minion-fetch branch substitutes `Quest ID: <uuid>` and nothing else.
  // That is deliberate. The only richer substitution needs a `workItemId`, and
  // `subagentStopNeedsBlockGuard` would hold a minion that passed one open until it signalled on its
  // PARENT's operation item. So the real brief arrives in the parent's spawn message. This section
  // used to be headed "## Briefing", which told a minion its briefing was one id.
  it('VALID: the last section => says the parent brief is elsewhere and this line is the authoritative id', () => {
    expect({
      honestHeading: /^## The quest id — everything else is in your parent's brief$/mu.test(
        template,
      ),
      noBriefingHeading: /^## Briefing$/mu.test(template),
      briefIsTheSpawnMessage: has(
        "**Your BRIEF is your parent's spawn message, not this section.**",
      ),
      namesWhatArrivesThere: has('`BUILD:`, `TREE:` and `REWORK:` all arrive there'),
      oneLineOnly: has('It carries\nexactly one line.'),
      thisOneWins: has(
        "Where that line and your parent's header disagree about the quest id, the line\nbelow wins.",
      ),
      noBriefIsWall: has(
        "say so. Then return\n`NEXT: wall — my parent's spawn message carried no brief; a human must repair the dispatch`.",
      ),
      noBriefIsNotRework: has('**A missing brief is a wall, not `rework`.**'),
      aFreshSessionCannotFixIt: has(
        'Neither this session nor a fresh one can invent the\nscope your parent never sent.',
      ),
      doNotReconstruct: has('Do not try to reconstruct a brief from here.'),
    }).toStrictEqual({
      honestHeading: true,
      noBriefingHeading: false,
      briefIsTheSpawnMessage: true,
      namesWhatArrivesThere: true,
      oneLineOnly: true,
      thisOneWins: true,
      noBriefIsWall: true,
      noBriefIsNotRework: true,
      aFreshSessionCannotFixIt: true,
      doNotReconstruct: true,
    });
  });

  // The planner takes `delegationSpike`, because it is the ONE minion allowed to spawn a sub-agent,
  // and only for a bounded spike. `delegationLeafBan` would forbid the spike its own method
  // requires, and carrying both would leave it following whichever it read first. The actual side
  // of this assertion is built from the statics, so a piece added there arrives here as an
  // unexpected key rather than going unnoticed.
  it('VALID: template => composes the delegating-minion operating rules, and no piece meant for another reader', () => {
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
      delegationSpike: true,
      delegationLeafBan: false,
      wallRole: false,
      wallMinion: true,
      treeCleanRole: false,
      treeCleanOperator: false,
    });
  });

  // THE BUILD BAN AND THE NO-WARD LINE. The worker and reviewer templates each ban the build. This
  // one banned nothing. It is also the minion likeliest to try: its parent hands it a red `BUILD:`
  // block, then sends it to open the failing file. `docs/quest-role-paths.md` states the invariant:
  // "Planner, workers and reviewer are all forbidden `npm run build`." The no-ward bullet answers
  // operating rule 3. Rule 3 tells its reader that its OWN prompt names the scoped form it may run.
  // That forward reference resolved to nothing here. This template names no ward run of its own, and
  // it only WRITES `WARD:` lines for workers.
  describe('what it never runs', () => {
    it('VALID: template => bans npm run build with the shared-dist reason and names the alternative', () => {
      expect({
        heading: /^## What you never run$/mu.test(template),
        ban: has('- **`npm run build`.** Your parent already built'),
        parentHandedTheOutput: has("It handed you that build's output as the\n  `BUILD:` block."),
        onlySessionAllowed: has(
          'It is the only session on this quest allowed to run that command.',
        ),
        sharedDist: has('`tsc` writes one\n  shared `dist/` per package'),
        phantomErrors: has(
          'A second\n  builder hands every sibling session phantom type errors on correct code',
        ),
        insteadAChunkOrANote: has(
          'A build you want is a CHUNK for a worker, or a line in your return to\n  your parent.',
        ),
        redBuildIsNotAReason: has('**A red `BUILD:` is not a reason to build again.**'),
      }).toStrictEqual({
        heading: true,
        ban: true,
        parentHandedTheOutput: true,
        onlySessionAllowed: true,
        sharedDist: true,
        phantomErrors: true,
        insteadAChunkOrANote: true,
        redBuildIsNotAReason: true,
      });
    });

    it('VALID: template => runs no ward of its own and says the WARD line belongs to the worker', () => {
      expect({
        wardRuleForwardReference: agentOperatingRulesStatics.wardScoped.includes(
          'Do not choose between them. Your own prompt tells you which one is yours',
        ),
        noWard: has('- **Ward, and every test and check of any kind.**'),
        thisPromptNamesNone: has('This prompt names none, because none is yours.'),
        wardLineIsTheWorkers: has(
          "The `WARD:`\n  line you write into a chunk is a command that chunk's WORKER runs, never one you run yourself.",
        ),
        roundsWardIsTheReviewers: has(
          "Your round's ward belongs to the `reviewer-minion` your parent summons after the workers.",
        ),
      }).toStrictEqual({
        wardRuleForwardReference: true,
        noWard: true,
        thisPromptNamesNone: true,
        wardLineIsTheWorkers: true,
        roundsWardIsTheReviewers: true,
      });
    });
  });

  // THE REGRESSION GUARD FOR THE PIVOT. `modify-quest({ planningNotes: { operationPlans: [...] } })`
  // used to persist the plan. That path forced this session to invent a UUID for the plan and for
  // every chunk, against a UUID-VALIDATED contract. A bad id therefore REJECTED the whole write
  // instead of degrading it. That left the operator nothing to read back. It also left it no way to
  // find out why. The plan is a committed markdown file now. Numbering IS the order. A file path
  // names a file and nothing more. A bad write shows up in `git status`.
  describe('the plan is a committed file, not a quest write', () => {
    it('VALID: template => names the file path, its commit subject, and nothing about operationPlans', () => {
      expect({
        filePath: has('`.quest-plans/round-<n>.md`'),
        commitSubject: has('Commit it with the subject `plan round <n>: <count> chunks`.'),
        onlyGitWrite: has('That commit is the only thing you put in git.'),
        noOperationPlans: has('operationPlans'),
        noModifyQuestWrite: has('modify-quest({ questId'),
        noUuidMinting: has('a UUID you generate'),
        noDependsOnField: has('dependsOn'),
      }).toStrictEqual({
        filePath: true,
        commitSubject: true,
        onlyGitWrite: true,
        noOperationPlans: false,
        noModifyQuestWrite: false,
        noUuidMinting: false,
        noDependsOnField: false,
      });
    });

    it('VALID: the chunk format => carries every field the worker template reads back', () => {
      expect({
        heading: has('## chunk 1 — <one line a worker can hold in its head>'),
        summary: has('SUMMARY: <2-3 sentences'),
        intent: has(
          'INTENT: <what must be TRUE when this chunk is done — an outcome, not a task list>',
        ),
        files: has('FILES:\n  - ./packages/<pkg>/src/<path>.ts'),
        units: has('UNITS:\n  - <a unit id this chunk must satisfy>'),
        mirror: has(
          'MIRROR: ./packages/<pkg>/src/<an existing sibling whose shape this follows>.ts',
        ),
        ward: has('WARD: npm run ward -- --only lint,typecheck,unit -- '),
        notes: has('NOTES:\n  <everything its worker cannot derive'),
      }).toStrictEqual({
        heading: true,
        summary: true,
        intent: true,
        files: true,
        units: true,
        mirror: true,
        ward: true,
        notes: true,
      });
    });

    // The chunk NUMBER is the dependency order. The predecessor carried a `dependsOn` array of
    // chunk UUIDs beside a list that was already ordered. That said the same thing twice. It also
    // invited a reader to take "independent" as "safe to run at once".
    it('VALID: template => makes the chunk number the dependency order and says there is no second field', () => {
      expect({
        numberIsOrder: has('**Number from 1, contiguously. THE ORDER IS THE DEPENDENCY ORDER.**'),
        parentDispatchesInOrder: has('Your parent dispatches chunk 1,'),
        noSecondField: has('There is no separate dependency field'),
        laterIsNumberedLater: has('A chunk that must land after\n  another is numbered after it.'),
      }).toStrictEqual({
        numberIsOrder: true,
        parentDispatchesInOrder: true,
        noSecondField: true,
        laterIsNumberedLater: true,
      });
    });

    it('VALID: template => makes FILES ownership, bans a shared path, and requires the ./ prefix', () => {
      expect({
        ownership: has('**`FILES` is OWNERSHIP. Two chunks must never list the same path.**'),
        lastWriteWins: has(
          'The second worker to write a\n  shared file erases what the first wrote.',
        ),
        oneChunkIfShared: has('If two chunks genuinely need one file, they are one chunk.'),
        prefix: has('**`FILES` paths start with `./` or are absolute.**'),
        noDirectories: has('They are FILE paths, never directories'),
      }).toStrictEqual({
        ownership: true,
        lastWriteWins: true,
        oneChunkIfShared: true,
        prefix: true,
        noDirectories: true,
      });
    });

    // The planner writes the ward command, because the planner knows the folder types. Its
    // operator's own tool table FORBIDS `get-folder-detail`. An operator asked to narrow `--only`
    // was therefore guessing at a repo-specific map it could not read.
    it('VALID: template => makes WARD a literal the worker runs verbatim, narrowed by the discipline', () => {
      expect({
        literal: has('**`WARD` is a literal command its worker runs verbatim.**'),
        whyThisSession: has('You write it, because you know the\n  folder types.'),
        nobodyBelowNarrows: has('Nobody below you narrows anything.'),
        disciplineSaysWhich: has('Your discipline says which checks those are.'),
        sameFilesAsFiles: has('List the same explicit file paths as\n  `FILES`.'),
        neverADirectory: has(
          'Never pass a bare directory. A bare directory pulls in the whole package.',
        ),
      }).toStrictEqual({
        literal: true,
        whyThisSession: true,
        nobodyBelowNarrows: true,
        disciplineSaysWhich: true,
        sameFilesAsFiles: true,
        neverADirectory: true,
      });
    });

    it('VALID: template => requires UNITS and says what a chunk without one is graded against', () => {
      expect({
        gradedBySetDifference: has(
          '**`UNITS` is what the reviewer grades the chunk against**, by set difference.',
        ),
        emptyComesBackClean: has('none is graded against nothing. It comes back clean.'),
        sayWhyInNotes: has('`NOTES` why it exists'),
      }).toStrictEqual({
        gradedBySetDifference: true,
        emptyComesBackClean: true,
        sayWhyInNotes: true,
      });
    });

    it('VALID: template => tells the session to keep chunks small and names why a big one is invisible', () => {
      expect({
        errSmall: has('**Keep every chunk small.**'),
        oneWorkerHoldsIt: has('A chunk must be small enough for ONE worker to hold in full.'),
        skimIsInvisible: has(
          '**A worker\n  skims an over-large chunk. A green run hides what it skipped.**',
        ),
        twoTightBeatsOne: has('Two tight\n  chunks beat one oversized chunk.'),
      }).toStrictEqual({
        errSmall: true,
        oneWorkerHoldsIt: true,
        skimIsInvisible: true,
        twoTightBeatsOne: true,
      });
    });
  });

  // The `short:` routing shape had no reader. The operator's last gate decided on the reviewer's
  // remainder alone, so the ledger reported scope the planner had called uncovered as complete.
  // Scope the planner cannot plan cleanly is a CHUNK now. A worker reads it. A reviewer grades it.
  // The next round inherits it. That is the path everything else takes.
  it('VALID: template => turns unplannable scope into a chunk rather than a routing note', () => {
    expect({
      stillGetsAChunk: has('**Scope you cannot plan cleanly still gets a chunk.**'),
      intentNamesTheDecision: has(
        'Its `INTENT` names what must be settled. Its `NOTES` names the contradiction.',
      ),
      reachesTheNextRound: has(
        'Its worker\n  returns `rework` or `wall`. That answer reaches the next round.',
      ),
      leavingItOutDropsIt: has(
        '**Never leave it out of the\n  plan.** A plan that omits it drops that scope.',
      ),
      noChannelWithoutAReader: has(
        'Nothing downstream reads a channel your parent does\n  not route on',
      ),
    }).toStrictEqual({
      stillGetsAChunk: true,
      intentNamesTheDecision: true,
      reachesTheNextRound: true,
      leavingItOutDropsIt: true,
      noChannelWithoutAReader: true,
    });
  });

  describe('what it returns', () => {
    it('VALID: template => returns two lines, and never the plan body', () => {
      expect({
        planLine: has('PLAN: .quest-plans/round-<n>.md — <count> chunks'),
        continueLine: has('NEXT: continue'),
        wallLine: has('NEXT: wall — <what, and what a human must change>'),
        exactlyTwoValues: has('`NEXT:` has exactly two values.'),
        zeroChunksIsContinue: has(
          '`continue` covers every plan you were able to write, zero chunks\nincluded.',
        ),
        neverPasteThePlan: has('**Never paste the plan into your return.**'),
      }).toStrictEqual({
        planLine: true,
        continueLine: true,
        wallLine: true,
        exactlyTwoValues: true,
        zeroChunksIsContinue: true,
        neverPasteThePlan: true,
      });
    });

    // THE VOCABULARY SECTION MUST BEAT OPERATING RULE 5. That rule arrives inside
    // `delegatingMinionMarkdown`, a block that opens "Read every rule below before you do anything
    // else". It offers `NEXT: rework` to every minion. The operator cannot route a `rework` from a
    // PLANNER. It matches the first word, then goes to step 4 of its own loop, then `Read`s a plan
    // file that was never written. The section must name that third value and refuse it by name.
    // Otherwise rule 5 wins.
    it('VALID: template => excludes rule 5 rework by name and says why a planner has two values', () => {
      expect({
        wallRuleOffersIt: agentOperatingRulesStatics.wallMinion.includes(
          'Work that merely remains unfinished is `NEXT: rework` instead.',
        ),
        namesRuleFive: has(
          '**Operating rule 5 above names a third value, `NEXT: rework`. Never write it.**',
        ),
        twoNotThree: has('A worker and a reviewer each have three values. You have two.'),
        noPlanFileToRead: has(
          'A rework round would\nhave nothing to act on, because a planner that cannot plan writes no plan file.',
        ),
        parentMatchesFirstWord: has(
          'Your parent matches\nthe FIRST WORD of this line and nothing else.',
        ),
        stepFourReadsNothing: has(
          '`rework` sends it straight to step 4 of its own loop.\nThere it `Read`s a plan file you never wrote.',
        ),
        noFailureBranch: has('It has no failure branch there. It has no tool to\nfind out why.'),
        unplannableIsAChunk: has('Scope you could not plan cleanly is a CHUNK'),
      }).toStrictEqual({
        wallRuleOffersIt: true,
        namesRuleFive: true,
        twoNotThree: true,
        noPlanFileToRead: true,
        parentMatchesFirstWord: true,
        stepFourReadsNothing: true,
        noFailureBranch: true,
        unplannableIsAChunk: true,
      });
    });

    it('VALID: template => declares a zero-chunk plan legal and forbids inventing work', () => {
      expect({
        legal: has('**A plan with ZERO chunks is a legal plan.**'),
        alreadyTrue: has('the scope is already true on disk'),
        noChunkSections: has('no `## chunk` sections'),
        doNotInvent: has('**Do not invent\na chunk to look productive.**'),
      }).toStrictEqual({
        legal: true,
        alreadyTrue: true,
        noChunkSections: true,
        doNotInvent: true,
      });
    });

    // Its parent opens no source file. It holds no opinion about the plan. It either guesses at a
    // question handed up or drops it. `ask-user-question` is deliberately absent. A minion runs
    // inside its parent's turn, so nothing resumes it with an answer.
    it('VALID: template => forbids routing a design choice upward and never reaches for a question tool', () => {
      expect({
        wallIsEnvironmentOnly: has('**`wall` is for an environment wall and nothing else.**'),
        designIsNeverAWall: has(
          '**A design choice is NEVER a wall and never a question for your parent.**',
        ),
        parentGuessesOrDrops: has(
          'It either guesses at a question you hand up, or\ndrops it silently.',
        ),
        decideIt: has("Decide it yourself. Write your reasons into the plan's `SUMMARY`."),
        usersCallIsAChunk: has(
          "Where the call is genuinely the USER's rather than yours, that is still a\nCHUNK.",
        ),
        noAskUserQuestion: has('ask-user-question'),
      }).toStrictEqual({
        wallIsEnvironmentOnly: true,
        designIsNeverAWall: true,
        parentGuessesOrDrops: true,
        decideIt: true,
        usersCallIsAChunk: true,
        noAskUserQuestion: false,
      });
    });
  });

  describe('the method', () => {
    it('VALID: template => numbers its steps 1 through 9, contiguously', () => {
      const method = template.slice(
        template.indexOf('## Method'),
        template.indexOf('## The plan file'),
      );

      expect(Array.from(method.matchAll(/^\d\. \*\*/gmu)).map((match) => match[0])).toStrictEqual([
        '1. **',
        '2. **',
        '3. **',
        '4. **',
        '5. **',
        '6. **',
        '7. **',
        '8. **',
        '9. **',
      ]);
    });

    // The OPERATOR writes `CONTEXT:` at its own step 3, and this step is the first instruction the
    // planner executes. It used to read `SCOPE:`, the only place in the repo that said so, which
    // sent the session hunting for a block its parent never writes. `SCOPE:` is a live label
    // elsewhere, with a different meaning. The operator writes `SCOPE: quest` into the REVIEWER's
    // brief after a refused signal.
    it('VALID: step 1 => reads the four blocks the operator hands it, including last round as this round', () => {
      expect({
        context: has("`CONTEXT:` — your parent's ENTIRE Operation Context, pasted verbatim."),
        build: has("`BUILD:` — the output of this round's build."),
        tree: has('`TREE:` — the output of `git status`.'),
        reworkIsThisScope: has(
          "what last round's reviewer said is not done. That IS this\n     round's scope.",
        ),
        neverScope: has('**The first block is labelled `CONTEXT:`, never `SCOPE:`.**'),
        doNotHuntForScope: has(
          'Do not go looking for a `SCOPE:`\n   block. Your parent writes none.',
        ),
        scopeIsTheReviewers: has(
          "Your parent writes `SCOPE: quest` into a REVIEWER's brief after a refused\n   signal.",
        ),
      }).toStrictEqual({
        context: true,
        build: true,
        tree: true,
        reworkIsThisScope: true,
        neverScope: true,
        doNotHuntForScope: true,
        scopeIsTheReviewers: true,
      });
    });

    it('VALID: step 2 => loads the standards blocking, in one ToolSearch batch', () => {
      expect({
        blocking: has('**Load the project standards YOURSELF (BLOCKING).**'),
        parentCannotDigest: has(
          'Your parent did not load them. It cannot\n   summarise them for you either.',
        ),
        overrideTraining: has(
          'They override your training defaults. Those defaults are WRONG for this\n   codebase.',
        ),
        oneBatch: has(
          'in the SAME\n   first `ToolSearch` batch, so you do not pay a second round-trip later',
        ),
      }).toStrictEqual({
        blocking: true,
        parentCannotDigest: true,
        overrideTraining: true,
        oneBatch: true,
      });
    });

    it('VALID: steps 4 and 5 => read real code and are the only session that reads history', () => {
      expect({
        realCode: has('**Read the real code before you plan against it.**'),
        notAgainstTheSpecAlone: has('**Plan against\n   reality, never against the spec alone.**'),
        onlySessionThatReadsHistory: has(
          '**Read the HISTORY too.** No other session reconstructs it.',
        ),
        onlyOneThatReadsTheLog: has('You are the only one that reads the\n   log at all.'),
        reviewerMayConfirmOneFix: has(
          'A\n   `reviewer-minion` may open a `git diff` or a `git show` to confirm one named fix.',
        ),
        readTheBodies: has('**Read the BODIES.**'),
        chunkSubject: has('commits its chunk under\n   `chunk <n>: <title>`'),
        reviewSubject: has('commits its round under `review <n>: <verdict>`.'),
        earlierPlansAreInGit: has(
          "Earlier rounds' plan files are in git\n   too, at `.quest-plans/`.",
        ),
        ptNIsTheJob: has('makes this the job, not background reading'),
        writesNothingElse: has('**You WRITE nothing to git except the plan file.**'),
      }).toStrictEqual({
        realCode: true,
        notAgainstTheSpecAlone: true,
        onlySessionThatReadsHistory: true,
        onlyOneThatReadsTheLog: true,
        reviewerMayConfirmOneFix: true,
        readTheBodies: true,
        chunkSubject: true,
        reviewSubject: true,
        earlierPlansAreInGit: true,
        ptNIsTheJob: true,
        writesNothingElse: true,
      });
    });

    // A red build reaching this session is not a wall. The planner opens the failing file. What a
    // predecessor left behind is right there.
    it('VALID: step 6 => turns a red build or a dirty tree into chunk 1', () => {
      expect({
        isAChunk: has('**A red `BUILD:` or a dirty `TREE:` is a CHUNK, not a wall.**'),
        canOpenTheFile: has('You can open the failing file\n   yourself.'),
        chunkOne: has('Cut chunk 1 for it. Number the\n   rest of the round after it.'),
      }).toStrictEqual({ isAChunk: true, canOpenTheFile: true, chunkOne: true });
    });

    it('VALID: step 7 => bounds the spike to a new pattern under spike-tmp, which git ignores', () => {
      expect({
        onlyMinionAllowed: has('You are the ONLY minion permitted to spawn its own\n   sub-agents'),
        netNewOnly: has('a pattern nobody in this repo has\n   built yet'),
        spikeTmp: has('**Write every spike under `spike-tmp/`.**'),
        gitignored: has('You commit nothing there, because git ignores that\n   path.'),
        untrackedRefusesTheSignal: has("An untracked file REFUSES\n   your parent's every signal."),
        disciplineSaysKeptOrRemoved: has(
          'says which kind it wants:\n\n   - A spike KEPT, as a working pattern a worker extends.\n   - A diagnostic probe REMOVED before you return.',
        ),
        readItYourself: has(
          'If\n   you find yourself spawning a helper to read files for you, read them yourself',
        ),
      }).toStrictEqual({
        onlyMinionAllowed: true,
        netNewOnly: true,
        spikeTmp: true,
        gitignored: true,
        untrackedRefusesTheSignal: true,
        disciplineSaysKeptOrRemoved: true,
        readItYourself: true,
      });
    });
  });

  // ============================================================================================
  // CROSS-FILE AGREEMENTS. Each test spans this file and one other statics file, and derives its
  // needle from that other file's live value. Nothing type-checks a brief label, a `NEXT:` value
  // or a commit subject, so until these landed a reword on either side stayed green.
  // ============================================================================================
  describe('agreements with the operator above and the minions below', () => {
    // SPANS operator-prompt-statics.ts (step 3 WRITES this brief) ↔ Method step 1 (the only
    // session that READS it). This exact pair drifted once already: this step read `SCOPE:` while
    // the operator wrote `CONTEXT:`. `SCOPE:` is not a dead token either — the operator writes
    // `SCOPE: quest` into the REVIEWER's post-refusal brief, so the wrong needle names a real
    // label with a different meaning, and the session hunts for a block nobody sends.
    it('VALID: {operator step 3, method step 1} => reads exactly the blocks the operator writes, under the operator spelling', () => {
      expect({
        operatorWritesThisManyBlocks: OPERATOR_BRIEF_BLOCKS.length,
        andThisStepSaysSo: has('It carries four blocks:'),
        blocksTheOperatorWritesAndThisStepNeverReads: OPERATOR_BRIEF_BLOCKS.filter(
          (label) => !BLOCKS_THIS_STEP_READS.includes(label),
        ),
        blocksThisStepReadsAndTheOperatorNeverWrites: BLOCKS_THIS_STEP_READS.filter(
          (label) => !OPERATOR_BRIEF_BLOCKS.includes(label),
        ),
        namesTheOperatorsFirstBlockInTheNeverSentence: has(
          `**The first block is labelled \`${OPERATOR_FIRST_BLOCK}\`, never \`SCOPE:\`.**`,
        ),
        theOperatorsPlannerBriefCarriesNoScopeLabel: OPERATOR_PLANNER_BRIEF.includes('SCOPE'),
        itsReviewerBriefIsWhereThatLabelReallyLives:
          OPERATOR_REFUSAL_BRIEF.includes('SCOPE: quest'),
        andThisStepSendsTheReaderThere: has(
          "Your parent writes `SCOPE: quest` into a REVIEWER's brief after a refused\n   signal.",
        ),
      }).toStrictEqual({
        operatorWritesThisManyBlocks: 4,
        andThisStepSaysSo: true,
        blocksTheOperatorWritesAndThisStepNeverReads: [],
        blocksThisStepReadsAndTheOperatorNeverWrites: [],
        namesTheOperatorsFirstBlockInTheNeverSentence: true,
        theOperatorsPlannerBriefCarriesNoScopeLabel: false,
        itsReviewerBriefIsWhereThatLabelReallyLives: true,
        andThisStepSendsTheReaderThere: true,
      });
    });

    // SPANS operator-prompt-statics.ts (the header it mandates on every minion brief) ↔ this file.
    // That header is the ONLY place this session is told its round number and the path it must
    // write the plan to; its own fetch hands back a method and a Quest ID and nothing else. So the
    // path this template writes, the path it returns, and the path the operator reads back all
    // have to be the header's path — a rename on one side leaves the operator `Read`ing a file
    // nobody wrote, and its ALLOWED table permits no second path to try.
    it('VALID: {operator brief header, planner} => writes back only fields that header carries, at the path it names', () => {
      expect({
        headerCarriesTheRoundNumber: OPERATOR_HEADER_FIELDS.includes('round'),
        andThisTemplateTakesItFromThere: has('`<n>` is the round number from your brief header.'),
        headerCarriesTheQuestId: OPERATOR_HEADER_FIELDS.includes('Quest ID'),
        andThisTemplateArbitratesAgainstIt: has(
          "Where that line and your parent's header disagree about the quest id, the line\nbelow wins.",
        ),
        headerCarriesThePlanPath: OPERATOR_HEADER_FIELDS.includes('plan file'),
        thisTemplateWritesThatExactPath: has(`## The plan file — \`${HEADER_PLAN_PATH}\``),
        andReturnsThatExactPath: has(`PLAN: ${HEADER_PLAN_PATH} — <count> chunks`),
        andTheOperatorReadsThatExactPath: OPERATOR.includes(
          `\`Read\` the path its return names — \`${HEADER_PLAN_PATH}\``,
        ),
      }).toStrictEqual({
        headerCarriesTheRoundNumber: true,
        andThisTemplateTakesItFromThere: true,
        headerCarriesTheQuestId: true,
        andThisTemplateArbitratesAgainstIt: true,
        headerCarriesThePlanPath: true,
        thisTemplateWritesThatExactPath: true,
        andReturnsThatExactPath: true,
        andTheOperatorReadsThatExactPath: true,
      });
    });

    // SPANS operator-prompt-statics.ts (its NEXT table is the only reader of this line) ↔ this
    // file, plus the two sibling minions this template makes a claim about. Every value this
    // session can write must be a row the operator routes. The reverse does NOT hold, and that
    // asymmetry is the whole point: the operator routes a third value its OTHER two minions may
    // write, operating rule 5 offers that value to every minion, and a planner that took it sends
    // the operator to step 4 to `Read` a plan file that was never written. So the refusal below
    // names that value, and this test derives the name from the difference between the two sets.
    it('VALID: {planner NEXT values, operator NEXT table} => declares only routed values, and refuses the routed value it must never write', () => {
      expect({
        valuesThisTemplateDeclaresThatTheOperatorCannotRoute: NEXT_VALUES.filter(
          (value) => !OPERATOR_ROUTED_VALUES.includes(value),
        ),
        thisTemplateDeclares: NEXT_VALUES.length,
        andSaysSo: has('`NEXT:` has exactly two values.'),
        routedValuesThisSessionMustNeverWrite: VALUES_ROUTED_BUT_NOT_THIS_SESSIONS.length,
        eachOfThemRefusedByName: VALUES_ROUTED_BUT_NOT_THIS_SESSIONS.every((value) =>
          has(`names a third value, \`NEXT: ${value}\`. Never write it.**`),
        ),
        theWorkerAndTheReviewerReallyDoDeclareThree: [WORKER_NEXT.length, REVIEWER_NEXT.length],
        andThisTemplateSaysThatToo: has(
          'A worker and a reviewer each have three values. You have two.',
        ),
        theOperatorMatchesTheFirstWord: OPERATOR.includes('Match the FIRST WORD.'),
        andThisTemplateTellsTheReaderThat: has(
          'Your parent matches\nthe FIRST WORD of this line and nothing else.',
        ),
      }).toStrictEqual({
        valuesThisTemplateDeclaresThatTheOperatorCannotRoute: [],
        thisTemplateDeclares: 2,
        andSaysSo: true,
        routedValuesThisSessionMustNeverWrite: 1,
        eachOfThemRefusedByName: true,
        theWorkerAndTheReviewerReallyDoDeclareThree: [3, 3],
        andThisTemplateSaysThatToo: true,
        theOperatorMatchesTheFirstWord: true,
        andThisTemplateTellsTheReaderThat: true,
      });
    });

    // SPANS worker-minion-statics.ts and reviewer-minion-statics.ts ↔ Method step 5. This session
    // is the only one that reads history, and it reads it BY SUBJECT — the subjects those two
    // templates write as their own last act. Reword a subject in either of them and this step
    // sends the one session that could reconstruct a `pt N` predecessor's work looking for commits
    // under a name nothing writes.
    it('VALID: {worker and reviewer commit subjects, method step 5} => greps for the subjects those two templates actually write', () => {
      expect({
        thisStepNamesTheWorkerSubjectVerbatim: FLAT_TEMPLATE.includes(
          `commits its chunk under \`${WORKER_CHUNK_SUBJECT}\``,
        ),
        theReviewerWritesThisManySubjects: REVIEWER_SUBJECTS.length,
        thisStepReallyDoesClaimAReviewSubject: REVIEW_SUBJECT_PREFIX.length > 0,
        reviewerSubjectsOutsideThePrefixThisStepGrepsFor: REVIEWER_SUBJECTS.filter(
          (subject) => !subject.startsWith(REVIEW_SUBJECT_PREFIX),
        ),
        andTheReviewerReallyDoesPutItsReturnInTheBody: REVIEWER.includes(
          'your whole return block below in the body, verbatim',
        ),
        soThisStepTellsTheReaderToOpenThem: has('**Read the BODIES.**'),
      }).toStrictEqual({
        thisStepNamesTheWorkerSubjectVerbatim: true,
        theReviewerWritesThisManySubjects: 2,
        thisStepReallyDoesClaimAReviewSubject: true,
        reviewerSubjectsOutsideThePrefixThisStepGrepsFor: [],
        andTheReviewerReallyDoesPutItsReturnInTheBody: true,
        soThisStepTellsTheReaderToOpenThem: true,
      });
    });
  });
});
