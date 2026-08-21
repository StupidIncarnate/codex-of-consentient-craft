import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';
import { operatorPromptStatics } from '../operator-prompt/operator-prompt-statics';
import { plannerMinionStatics } from '../planner-minion/planner-minion-statics';
import { workerMinionStatics } from './worker-minion-statics';

const { template } = workerMinionStatics.prompt;

const has = (needle: string): boolean => template.includes(needle);

// ================================================================================================
// CROSS-FILE DERIVATIONS. Every needle built below comes out of the OTHER module's live value,
// never out of a copy of it. A copied string drifts exactly the way the prose drifts, and the test
// holding it goes quiet at the moment it should have failed.
// ================================================================================================
const OPERATOR = operatorPromptStatics.prompt.template;
const PLANNER = plannerMinionStatics.prompt.template;

const FLAT_TEMPLATE = template.replace(/\s+/gu, ' ');

// The chunk format, off the PLANNER's own plan-file fence. That minion writes the fields; this one
// reads them back out of its brief.
const PLAN_FENCE_OPENS = PLANNER.indexOf('```', PLANNER.indexOf('## The plan file'));
const PLAN_FENCE = PLANNER.slice(
  PLAN_FENCE_OPENS + 3,
  PLANNER.indexOf('```', PLAN_FENCE_OPENS + 3),
);
const PLAN_CHUNK_FIELDS = Array.from(
  PLAN_FENCE.slice(PLAN_FENCE.indexOf('## chunk 1')).matchAll(/^([A-Z]+):/gmu),
).map((match) => match[1] ?? '');
const PLAN_CHUNK_ENUMERATION = `\`${PLAN_CHUNK_FIELDS.slice(0, -1).join('`, `')}\` and \`${
  PLAN_CHUNK_FIELDS[PLAN_CHUNK_FIELDS.length - 1] ?? ''
}\``;
const CHUNK_FIELDS_THIS_BRIEF_NAMES = Array.from(
  template.matchAll(/^- \*\*`([A-Z]+)`\*\* —/gmu),
).map((match) => match[1] ?? '');

// The operator's routing table: the only reader of the `NEXT:` line this template writes.
const OPERATOR_NEXT_TABLE = OPERATOR.slice(
  OPERATOR.indexOf('| The line says | You do |'),
  OPERATOR.indexOf('**`continue` and `rework` do the same thing'),
);
const OPERATOR_ROUTED_ROWS = Array.from(
  OPERATOR_NEXT_TABLE.matchAll(/^\| `([a-z]+)` \| (.+) \|$/gmu),
).map((match) => ({ action: match[2] ?? '', value: match[1] ?? '' }));
const OPERATOR_ROUTED_VALUES = OPERATOR_ROUTED_ROWS.map((row) => row.value);

// This template's own menu, and what the operator does with its first two arms.
const NEXT_VALUES = template
  .split('\n')
  .filter((line) => line.startsWith('NEXT:'))
  .flatMap((line) => line.slice('NEXT:'.length).split('|'))
  .map((arm) => arm.trim().split(' ')[0] ?? '')
  .filter((word) => word !== '');
const [FIRST_ARM = '', SECOND_ARM = ''] = NEXT_VALUES;
const FIRST_ARM_ACTION = OPERATOR_ROUTED_ROWS.filter((row) => row.value === FIRST_ARM)
  .map((row) => row.action)
  .join('');
const SECOND_ARM_ACTION = OPERATOR_ROUTED_ROWS.filter((row) => row.value === SECOND_ARM)
  .map((row) => row.action)
  .join('');

// The header the operator mandates at the top of EVERY minion brief, sweep briefs included.
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

// The operator's step 9 — the one step that dispatches THIS minion with no chunk at all.
const OPERATOR_SWEEP_STEP = OPERATOR.slice(
  OPERATOR.indexOf('**9. `git status`.**'),
  OPERATOR.indexOf('**10. `git push`.**'),
);
// The half of that step that dispatches THIS minion. The rest of it dispatches a reviewer to
// commit what survives, and that half legitimately says `SKIP WARD`.
const OPERATOR_SWEEP_WORKER_HALF = OPERATOR_SWEEP_STEP.slice(
  0,
  OPERATOR_SWEEP_STEP.indexOf('Then dispatch ONE'),
);

describe('workerMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(workerMinionStatics).toStrictEqual({
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
      questIdHeading: /^## The quest id$/mu.test(template),
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

  // The chunk reaches a minion through its parent's spawn message, never through `$ARGUMENTS`.
  // `agentPromptGetBroker`'s minion-fetch branch substitutes `Quest ID: <uuid>` and nothing else.
  // That is deliberate. To substitute anything richer, the fetch would need a `workItemId`.
  // `subagentStopNeedsBlockGuard` would then hold the minion open until it signalled on its
  // PARENT's operation item. This section used to be headed "## Briefing", which told a worker its
  // briefing was one id.
  it('VALID: the last section => says the chunk is elsewhere and this line is the authoritative id', () => {
    expect({
      honestHeading: /^## The quest id$/mu.test(template),
      noBriefingHeading: /^## Briefing$/mu.test(template),
      briefIsTheSpawnMessage: has(
        "**Your BRIEF is your parent's spawn message, not this section.**",
      ),
      namesTheChunkFields: has(
        '`INTENT`, `FILES`, `UNITS`, `MIRROR`, `WARD` and `NOTES` — all arrive there',
      ),
      oneLineOnly: has('carries exactly one line'),
      thisOneWins: has('the quest id, THIS one is right'),
      sweepIsNotAMissingChunk: has('is not a sweep brief'),
      doNotReconstruct: has('Do not try to reconstruct one from here.'),
    }).toStrictEqual({
      honestHeading: true,
      noBriefingHeading: false,
      briefIsTheSpawnMessage: true,
      namesTheChunkFields: true,
      oneLineOnly: true,
      thisOneWins: true,
      sweepIsNotAMissingChunk: true,
      doNotReconstruct: true,
    });
  });

  // The worker is a LEAF: it summons no sub-agent of its own. It therefore takes
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

  // `tsc` writes one shared `dist/` per package. A second builder mid-round gives every sibling
  // phantom type errors on correct code. The template therefore forbids the build in its FIRST
  // line, rather than in a bullet in a later section, because a worker breaks this rule easily. The
  // assertion pins that position directly.
  it('VALID: template => forbids npm run build in the first line of the body', () => {
    const banHeadline = '**You NEVER run `npm run build`.**';

    expect({
      ban: has(banHeadline),
      position: template.indexOf(banHeadline),
      headingLength: '# worker-minion\n\n'.length,
      namesTheCorruption: has('corrupt the shared `dist/`'),
      escalateInsteadOfBuilding: has('If you think you need a build, say\nso in your return.'),
    }).toStrictEqual({
      ban: true,
      position: '# worker-minion\n\n'.length,
      headingLength: '# worker-minion\n\n'.length,
      namesTheCorruption: true,
      escalateInsteadOfBuilding: true,
    });
  });

  // THE CONTRACT WITH THE DISCIPLINE PACKS. The predecessor hard-coded ONE discipline's method into
  // this template: write the failing test, write an empty implementation, watch it fail, then fill
  // it in until green. The other four packs then had to contradict it. A manual-QA worker writes no
  // implementation. A browser-e2e worker proves by mutation, because the behaviour already works. A
  // bug-repro worker gets its failing check from the real system on unchanged source. Method steps
  // 3 and 4 now name two pack headings and state neither method. Every pack's colocated test pins
  // that it carries both.
  describe('the method is discipline-neutral and defers to two named pack headings', () => {
    it('VALID: template => numbers its steps 1 through 6, contiguously', () => {
      const method = template.slice(
        template.indexOf('## Method'),
        template.indexOf('**Some briefs carry no chunk'),
      );

      expect(Array.from(method.matchAll(/^\d\. \*\*/gmu)).map((match) => match[0])).toStrictEqual([
        '1. **',
        '2. **',
        '3. **',
        '4. **',
        '5. **',
        '6. **',
      ]);
    });

    it('VALID: steps 3 and 4 => name the pack headings rather than stating a method of their own', () => {
      expect({
        workHeading: has('The **`### The work`** section of your discipline above'),
        wholeOfTheStep: has('defines this step\n   completely.'),
        inTheOrderYouDoIt: has('That section lists its steps in the order you do them.'),
        notASummary: has('It is not\n   a summary of a method you already know'),
        proofHeading: has('The **`### The proof`** section of your'),
        threeShapesNamed: has(
          'a check that fails on the behaviour, a\n   mutation, or a measured value',
        ),
        theSameQuestion: has(
          '**what would this check have said if the behaviour were\n   absent?**',
        ),
        noAnswerNoProof: has('If you have no answer, the check proves nothing'),
      }).toStrictEqual({
        workHeading: true,
        wholeOfTheStep: true,
        inTheOrderYouDoIt: true,
        notASummary: true,
        proofHeading: true,
        threeShapesNamed: true,
        theSameQuestion: true,
        noAnswerNoProof: true,
      });
    });

    // A worker that narrows `--only` itself is guessing at a repo-specific folder-type map. A
    // worker that widens it to a directory makes ward auto-background the run. That worker's own
    // turn then never finishes.
    it('VALID: step 6 => runs the brief WARD command verbatim and treats DISCOVERY MISMATCH as not-a-failure', () => {
      expect({
        verbatim: has("**Run your brief's `WARD` command, VERBATIM.**"),
        noNarrowing: has('Do not narrow it. Do not widen it. Do not substitute your own.'),
        plannerWroteIt: has(
          "Your planner\n   wrote it from this chunk's folder types, and it carries `lint` plus tests and never\n   `typecheck`.",
        ),
        fixUntilZero: has('Fix until it exits 0.'),
        mismatchIsNotAFailure: has('**That is\n   not a failure.**'),
        quoteIt: has('Quote it in your `WARD:` line.'),
        doNotEditTheCommand: has('Do not edit the command to make the message go away.'),
        notYoursToChoose: has(
          "**Choosing your own ward scope** — your brief's `WARD` line is a literal.",
        ),
      }).toStrictEqual({
        verbatim: true,
        noNarrowing: true,
        plannerWroteIt: true,
        fixUntilZero: true,
        mismatchIsNotAFailure: true,
        quoteIt: true,
        doNotEditTheCommand: true,
        notYoursToChoose: true,
      });
    });
  });

  // A WAVE of workers runs at once, and concurrent commits in one worktree collide on git's index
  // lock — twelve at once put three commits in and lost nine. So no worker commits at all. The
  // reviewer commits the whole round afterwards, and it is the one session that has opened every
  // file going into that commit.
  describe('git, and the usage sites that stand in for a typecheck', () => {
    it('VALID: step 5 => searches the usage sites of what the chunk changed and routes a break to rework', () => {
      expect({
        theStep: has('5. **Find every USAGE SITE of what you changed, and open it.**'),
        whyItExists: has('You run no typecheck, so this step is\n   what stands in for one.'),
        notesIsTheInput: has('Your `NOTES` names what this chunk changes that other files use'),
        theTool: has(
          'run\n   `discover` with the identifier as `grep` and read every hit that is not one of your own\n   `FILES`.',
        ),
        confirmTheyHold: has('Confirm each call site still holds against what you just wrote.'),
        breakIsRework: has(
          '**A broken usage site outside your `FILES` is `rework`, never a fix you make.**',
        ),
        whyNotFixIt: has(
          'A sibling chunk may own them, and two workers writing one path undo each\n   other.',
        ),
        nothingToSearchIsOneLine: has(
          'Where your `NOTES` names nothing and you changed nothing others use, say so in one line\n   and move on.',
        ),
      }).toStrictEqual({
        theStep: true,
        whyItExists: true,
        notesIsTheInput: true,
        theTool: true,
        confirmTheyHold: true,
        breakIsRework: true,
        whyNotFixIt: true,
        nothingToSearchIsOneLine: true,
      });
    });

    it('VALID: template => touches no git at all, and says the measured reason', () => {
      expect({
        everyVerb: has(
          '- **Git, all of it** — no `commit`, no `add`, no `stash`, no `reset`, no `checkout --`, no',
        ),
        theReviewerCommits: has(
          'You leave your work in the tree and your `reviewer-minion`\n  commits the whole round.',
        ),
        theWaveIsWhy: has('Several workers run AT ONCE in a wave, and concurrent commits in one'),
        theMeasurement: has('measured on twelve at once, three landed and nine died'),
        andNoCommitCommandSurvives: template.includes('git commit'),
        andNoCommitReturnFieldSurvives: /^COMMIT:/mu.test(template),
      }).toStrictEqual({
        everyVerb: true,
        theReviewerCommits: true,
        theWaveIsWhy: true,
        theMeasurement: true,
        andNoCommitCommandSurvives: false,
        andNoCommitReturnFieldSurvives: false,
      });
    });

    it('VALID: template => bans typecheck in any ward run, and names where it moved to', () => {
      expect({
        theBan: has('- **`typecheck`, in any ward run** — it is absent from your `WARD` line'),
        becauseItBuilds: has(
          "Ward's\n  typecheck runs `tsc -b`, which BUILDS, and the first line of this prompt says why you never do\n  that.",
        ),
        stepFiveCoversIt: has('Step 5 is how you cover what a typecheck would have caught.'),
        theParentTypechecks: has('Your parent typechecks the whole\n  round after the last wave.'),
      }).toStrictEqual({
        theBan: true,
        becauseItBuilds: true,
        stepFiveCoversIt: true,
        theParentTypechecks: true,
      });
    });

    // The operator's step 9 dispatches this same minion at a dirty tree with no chunk at all.
    // Without this paragraph, the worker reads that brief as a malformed one.
    it('VALID: template => handles the chunkless sweep brief its parent dispatches at a dirty tree', () => {
      expect({
        notAMistake: has('**Some briefs carry no chunk. That is not a mistake.**'),
        threeThingsChange: has('brief, three things change:'),
        chunkFieldReadsNone: has('- `CHUNK:` reads `none — sweep`.'),
        noWardLine: has('- There is no `WARD` line to run and no usage sites to check.'),
        deleteScratchLeaveWork: has(
          '**Delete what is scratch. Leave what is real work exactly where it is**',
        ),
        nameItForTheCommitter: has(
          'name\nit in your return so the session that commits knows what it is looking at',
        ),
        onlyAccount: has('Your return is the only account of what happened to those paths'),
      }).toStrictEqual({
        notAMistake: true,
        threeThingsChange: true,
        chunkFieldReadsNone: true,
        noWardLine: true,
        deleteScratchLeaveWork: true,
        nameItForTheCommitter: true,
        onlyAccount: true,
      });
    });
  });

  describe('what it returns', () => {
    it('VALID: template => carries every return field, with NEXT last', () => {
      const returnBlock = template.slice(
        template.indexOf('CHUNK:  <the chunk number'),
        template.indexOf('**`NEXT:` is the last line'),
      );

      expect({
        chunk: returnBlock.includes('CHUNK:'),
        result: returnBlock.includes('RESULT:'),
        commit: returnBlock.includes('COMMIT:'),
        files: returnBlock.includes('FILES:'),
        evidence: returnBlock.includes('EVIDENCE:'),
        usages: returnBlock.includes('USAGES:'),
        gotchas: returnBlock.includes('GOTCHAS:'),
        ward: returnBlock.includes('WARD:'),
        next: returnBlock.includes(
          'NEXT:   continue | rework — <what is not done> | wall — <what a human must change>',
        ),
        evidenceDefersToThePack: returnBlock.includes(
          'what your discipline\'s "### The proof" section asks you to show',
        ),
      }).toStrictEqual({
        chunk: true,
        result: true,
        commit: false,
        files: true,
        evidence: true,
        usages: true,
        gotchas: true,
        ward: true,
        next: true,
        evidenceDefersToThePack: true,
      });
    });

    // A worker's `rework` is a CLAIM about its own chunk. The parent deliberately does not act on
    // it. The parent hands it to the reviewer, which reads it against the files. The parent
    // therefore routes by lookup. The parent never judges whether a return was thin.
    it('VALID: template => defines all three NEXT values, and says the parent does not act on rework', () => {
      expect({
        lastLineAlways: has('**`NEXT:` is the last line, always.'),
        onlyLineActedOn: has('`NEXT:` is the only line your parent acts on.**'),
        continueMeaning: has("the chunk's `INTENT` is TRUE. You proved it."),
        greenWardIsNotEnough: has('A green ward alone is not that\n  proof. Step 4 is the proof.'),
        reworkMeaning: has('something about this chunk is not done'),
        parentDoesNotAct: has('**Your parent does not act on this.**'),
        reviewerDecides: has('Your parent hands it\n  to your reviewer.'),
        wallIsEnvironmentOnly: has('an environment wall no session of any role could pass'),
        wallHaltsTheQuest: has('**This halts the whole quest.**'),
        wrongForFutureWork: has(
          '`wall` is the wrong answer\n  for anything a future worker could still do',
        ),
      }).toStrictEqual({
        lastLineAlways: true,
        onlyLineActedOn: true,
        continueMeaning: true,
        greenWardIsNotEnough: true,
        reworkMeaning: true,
        parentDoesNotAct: true,
        reviewerDecides: true,
        wallIsEnvironmentOnly: true,
        wallHaltsTheQuest: true,
        wrongForFutureWork: true,
      });
    });

    it('VALID: template => refuses a faked green and demands an honest failure report', () => {
      expect({
        sayItPlainly: has('say so plainly in `RESULT`'),
        leaveItInTheTree: has('Leave what\nyou wrote in the tree.'),
        whatBrokeInGotchas: has('Put what you tried and where it broke in `GOTCHAS`'),
        noFakeGreen: has('**Do not fake a green\nward. Do not report a check you did not run.**'),
        plausibleReturnIsRefused: has(
          'A return that only sounds right sends the round the wrong way.',
        ),
      }).toStrictEqual({
        sayItPlainly: true,
        leaveItInTheTree: true,
        whatBrokeInGotchas: true,
        noFakeGreen: true,
        plausibleReturnIsRefused: true,
      });
    });
  });

  describe('what is not yours', () => {
    it('VALID: template => bans the build, all of git, typecheck, the Agent tool and the whole-repo ward', () => {
      expect({
        build: has('- **`npm run build`** — see the first line. Your parent owns it.'),
        allGit: has('- **Git, all of it**'),
        typecheck: has('- **`typecheck`, in any ward run**'),
        agentTool: has('- **The `Agent` tool** — you are a LEAF, so you summon no sub-agent.'),
        wholeRepoWard: has('- **The whole-repo `npm run ward`**'),
        wardScope: has('- **Choosing your own ward scope**'),
      }).toStrictEqual({
        build: true,
        allGit: true,
        typecheck: true,
        agentTool: true,
        wholeRepoWard: true,
        wardScope: true,
      });
    });

    it('VALID: template => keeps the worker inside its own FILES list', () => {
      expect({
        stayInside: has('**Stay inside your chunk.**'),
        wiringIsInScope: has('That\nwiring is part of your assignment'),
        noReplanning: has('Do NOT re-plan the round'),
        lastWriteWins: has(
          'Two workers writing one path undo each other, because the last write wins.',
        ),
        sayInsteadOfReaching: has('say so in your return. Do NOT edit it yourself.'),
      }).toStrictEqual({
        stayInside: true,
        wiringIsInScope: true,
        noReplanning: true,
        lastWriteWins: true,
        sayInsteadOfReaching: true,
      });
    });
  });

  // ============================================================================================
  // CROSS-FILE AGREEMENTS. Each test spans this file and one other statics file, and derives its
  // needle from that other file's live value. A chunk field, a sweep subject and a `NEXT:` value
  // are all plain prose on both sides: until these landed, a reword of either side stayed green.
  // ============================================================================================
  describe('agreements with the planner beside it and the operator above it', () => {
    // SPANS planner-minion-statics.ts (it WRITES the chunk) ↔ this file (it READS the chunk out of
    // its brief). The operator copies that section verbatim and cannot read either side, so a
    // field renamed in the plan fence reaches this session under a name its own brief inventory
    // does not list, and the field it does list arrives never.
    it('VALID: {planner chunk format, worker brief} => names every chunk field the planner writes, spelled identically', () => {
      expect({
        thePlannerWritesThisManyChunkFields: PLAN_CHUNK_FIELDS.length,
        fieldsThePlannerWritesAndThisBriefNeverNames: PLAN_CHUNK_FIELDS.filter(
          (field) => !CHUNK_FIELDS_THIS_BRIEF_NAMES.includes(field),
        ),
        fieldsThisBriefNamesAndNoPlanCarries: CHUNK_FIELDS_THIS_BRIEF_NAMES.filter(
          (field) => !PLAN_CHUNK_FIELDS.includes(field),
        ),
        theQuestIdSectionEnumeratesTheSameOnesInOrder: FLAT_TEMPLATE.includes(
          `its ${PLAN_CHUNK_ENUMERATION} — all arrive there`,
        ),
        thePlannerMakesTheFilesFieldOwnership: PLANNER.includes(
          '**`FILES` is OWNERSHIP. Two chunks must never list the same path.**',
        ),
        andThisTemplateHoldsItsWorkerToThatSameField: has(
          'Do NOT touch a file outside your `FILES` list.',
        ),
        bothSidesNameTheSameConsequence: has(
          'Two workers writing one path undo each other, because the last write wins.',
        ),
      }).toStrictEqual({
        thePlannerWritesThisManyChunkFields: 7,
        fieldsThePlannerWritesAndThisBriefNeverNames: [],
        fieldsThisBriefNamesAndNoPlanCarries: [],
        theQuestIdSectionEnumeratesTheSameOnesInOrder: true,
        thePlannerMakesTheFilesFieldOwnership: true,
        andThisTemplateHoldsItsWorkerToThatSameField: true,
        bothSidesNameTheSameConsequence: true,
      });
    });

    // SPANS operator-prompt-statics.ts step 9 ↔ the chunkless-sweep paragraph here. Step 9 is the
    // one place this minion is dispatched with no chunk: the operator cannot commit a dirty tree
    // itself and cannot open the paths either, so it hands them to a worker to sort, then to a
    // reviewer to commit what survived. Neither side can see the other. If step 9 stopped sending a
    // chunkless brief, this paragraph would cover a dispatch that no longer happens while the real
    // one read as malformed.
    it('VALID: {operator step 9, worker sweep brief} => the chunkless sweep the operator dispatches is the one this template describes', () => {
      expect({
        theSweepStepDispatchesThisMinionWithHeaderAndPathsOnly: OPERATOR_SWEEP_WORKER_HALF.includes(
          'Dispatch ONE `worker-minion` whose whole brief is the header\nplus those paths.',
        ),
        andCarriesNoChunkFieldAtAll: PLAN_CHUNK_FIELDS.filter((field) =>
          OPERATOR_SWEEP_WORKER_HALF.includes(field),
        ),
        soThisTemplateSaysAChunklessBriefIsNotAMistake: has(
          '**Some briefs carry no chunk. That is not a mistake.**',
        ),
        andThatThosePathsAreTheFilesList: has("- The brief's paths ARE your `FILES`."),
        theOperatorSendsTheCommitToAReviewerInstead: OPERATOR_SWEEP_STEP.includes(
          'Then dispatch ONE\n`reviewer-minion` to commit what survived',
        ),
        soThisTemplateNamesNoSubjectOfItsOwn: template.includes('- Your subject is'),
        andThisTemplateExpectsNoWardOnASweep: has(
          '- There is no `WARD` line to run and no usage sites to check.',
        ),
        whichIsWhyTheSweepStepSendsNoWardCommand: OPERATOR_SWEEP_WORKER_HALF.includes('WARD'),
      }).toStrictEqual({
        theSweepStepDispatchesThisMinionWithHeaderAndPathsOnly: true,
        andCarriesNoChunkFieldAtAll: [],
        soThisTemplateSaysAChunklessBriefIsNotAMistake: true,
        andThatThosePathsAreTheFilesList: true,
        theOperatorSendsTheCommitToAReviewerInstead: true,
        soThisTemplateNamesNoSubjectOfItsOwn: false,
        andThisTemplateExpectsNoWardOnASweep: true,
        whichIsWhyTheSweepStepSendsNoWardCommand: false,
      });
    });

    // SPANS operator-prompt-statics.ts ↔ this file's return menu. The operator matches the FIRST
    // WORD of this line against its table and does nothing else with the return, so a value here
    // that has no row there falls into the no-`NEXT:`-line default and is silently re-read as
    // `rework`. The second half is the semantic pair: this template tells its reader the parent
    // does not act on a `rework`, and the ONLY thing that makes that true is the operator routing
    // `rework` to the identical action as `continue`. Give `rework` its own action there and this
    // sentence becomes a lie a worker will act on.
    it('VALID: {worker NEXT menu, operator NEXT table} => declares exactly the routed values, and its first two arms route identically', () => {
      expect({
        valuesThisTemplateDeclaresThatTheOperatorCannotRoute: NEXT_VALUES.filter(
          (value) => !OPERATOR_ROUTED_VALUES.includes(value),
        ),
        valuesTheOperatorRoutesThatThisTemplateNeverOffers: OPERATOR_ROUTED_VALUES.filter(
          (value) => !NEXT_VALUES.includes(value),
        ),
        thisTemplateDeclares: NEXT_VALUES.length,
        theOperatorHasARowForTheFirstArm: FIRST_ARM_ACTION.length > 0,
        andRoutesTheSecondArmToTheIdenticalAction: FIRST_ARM_ACTION === SECOND_ARM_ACTION,
        theOperatorSaysThatIsDeliberate: OPERATOR.includes(
          '**`continue` and `rework` do the same thing, deliberately.**',
        ),
        soThisTemplateSaysTheParentDoesNotActOnIt: has('**Your parent does not act on this.**'),
        andHandsItToTheReviewerInstead: has('Your parent hands it\n  to your reviewer.'),
        andTheOperatorReallyDoesHandItOver: OPERATOR.includes(
          '<every worker return from step 5, VERBATIM and in dispatch order>',
        ),
      }).toStrictEqual({
        valuesThisTemplateDeclaresThatTheOperatorCannotRoute: [],
        valuesTheOperatorRoutesThatThisTemplateNeverOffers: [],
        thisTemplateDeclares: 3,
        theOperatorHasARowForTheFirstArm: true,
        andRoutesTheSecondArmToTheIdenticalAction: true,
        theOperatorSaysThatIsDeliberate: true,
        soThisTemplateSaysTheParentDoesNotActOnIt: true,
        andHandsItToTheReviewerInstead: true,
        andTheOperatorReallyDoesHandItOver: true,
      });
    });

    // SPANS operator-prompt-statics.ts (the header it mandates on every brief) ↔ the last section
    // here. This session's own fetch substitutes one line — the Quest ID — so everything else it
    // holds came from that header, and the last section is where the two are reconciled when they
    // disagree. A header that stopped carrying the quest id would leave this arbitration pointing
    // at a field nobody sends.
    it('VALID: {operator brief header, worker} => arbitrates against a header field the operator really sends', () => {
      expect({
        headerCarriesTheQuestId: OPERATOR_HEADER_FIELDS.includes('Quest ID'),
        thisTemplateArbitratesAgainstIt: has(
          "Where that line and your parent's header disagree\nabout the quest id, THIS one is right.",
        ),
        headerCarriesEveryIdTheRoundStamps: OPERATOR_HEADER_FIELDS.filter((field) =>
          field.endsWith('ID'),
        ).length,
        theOperatorSaysTheBriefIsTheOnlyContext: OPERATOR.includes(
          '**Your brief is the ONLY quest context a minion gets.**',
        ),
        andThisTemplateSaysTheSameFromTheOtherSide: has(
          "**Your BRIEF is your parent's spawn message, not this section.**",
        ),
      }).toStrictEqual({
        headerCarriesTheQuestId: true,
        thisTemplateArbitratesAgainstIt: true,
        headerCarriesEveryIdTheRoundStamps: 3,
        theOperatorSaysTheBriefIsTheOnlyContext: true,
        andThisTemplateSaysTheSameFromTheOtherSide: true,
      });
    });
  });
});
