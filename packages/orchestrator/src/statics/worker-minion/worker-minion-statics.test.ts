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

// The chunk format, off the PLANNER's own plan fence. That minion writes the fields into the round
// document; this one reads them back out of the same document.
const PLAN_FENCE_OPENS = PLANNER.indexOf('```', PLANNER.indexOf('## What you append'));
const PLAN_FENCE = PLANNER.slice(
  PLAN_FENCE_OPENS + 3,
  PLANNER.indexOf('```', PLAN_FENCE_OPENS + 3),
);
const PLAN_CHUNK_FIELDS = Array.from(
  PLAN_FENCE.slice(PLAN_FENCE.indexOf('### chunk 1')).matchAll(/^([A-Z]+):/gmu),
).map((match) => match[1] ?? '');
const CHUNK_FIELDS_THIS_TEMPLATE_NAMES = Array.from(
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

// The operator's brief fence — the WHOLE grammar of every brief it writes. Three keys, and two of
// them are the two shapes this minion is dispatched under.
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

// The operator's sweep step — the one step that dispatches THIS minion with no chunk at all.
// Bounded by the sentences either side of it rather than by its step number, so a renumber over
// there does not silently slice an empty string here.
const OPERATOR_SWEEP_STEP = OPERATOR.slice(
  OPERATOR.indexOf('`git status`.** Nothing should be listed'),
  OPERATOR.indexOf('## The NEXT table'),
);

// THE ROUND-LOG APPEND. The PLANNER writes the region's header; this template appends under it, and
// two discipline packs point at the step number below. All three needles are parsed rather than
// written down, so a rename or a renumber fails here instead of sending a marker to a heading no
// file carries.
const ROUND_LOG_HEADING =
  /^(?<heading>## Round log)$/mu.exec(PLANNER)?.groups?.heading ??
  'THE PLANNER WRITES NO ROUND-LOG HEADING';
const APPEND_STEP_NUMBER =
  /^(?<n>\d+)\. \*\*APPEND YOUR REPORT/mu.exec(template)?.groups?.n ?? 'THIS TEMPLATE HAS NO STEP';
const APPEND_STEP = template.slice(
  template.indexOf(`${APPEND_STEP_NUMBER}. **APPEND YOUR REPORT`),
  template.indexOf('**A brief carrying a `SECTION:` line'),
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

  // THE BRIEF IS TWO LINES AND THE ASSIGNMENT IS ON DISK. Its predecessor was handed its whole
  // chunk pasted into the spawn message — a copy made by the one session that may not open the file
  // that would show a dropped line, and one that hid the sibling chunks saying which paths are not
  // this worker's.
  it('VALID: the opening => names the three brief lines and the five things the document gives it', () => {
    const table = template.slice(
      template.indexOf('| Where | What it gives you |'),
      template.indexOf('Your own chunk carries five fields:'),
    );

    expect({
      threeLines: has(
        '**Besides the `get-agent-prompt` call that brought you here, your brief is three lines**, and\neverything you need is behind them:',
      ),
      theFence: has('PLAN:  .quest-plans/<operationItemId>-round-<n>.md\nWAVE:  <n>\nCHUNK: <n>'),
      readItWhole: has('**Read that document FIRST, whole.** Five things in it are yours:'),
      context: table.includes(
        "| `## Context` | your parent's ENTIRE Operation Context — ids, ledger, flows, packages, the user request |",
      ),
      itsOwnChunk: table.includes(
        '| `### chunk <n>` under `## Plan` | YOUR chunk, and the only one you execute |',
      ),
      theSiblings: table.includes(
        '| every OTHER `### chunk` | whose paths are not yours to touch |',
      ),
      theWavesIndex: table.includes(
        '| `WAVES:` under `## Plan` | which chunks run BESIDE you, right now, in this same worktree |',
      ),
      theRoundLog: table.includes(
        '| `## Round log` | the empty region at the bottom where your report goes, at step 7 |',
      ),
    }).toStrictEqual({
      threeLines: true,
      theFence: true,
      readItWhole: true,
      context: true,
      itsOwnChunk: true,
      theSiblings: true,
      theWavesIndex: true,
      theRoundLog: true,
    });
  });

  // The assignment reaches a minion through the round document, never through `$ARGUMENTS`.
  // `agentPromptGetBroker`'s minion-fetch branch substitutes `Quest ID: <uuid>` and nothing else.
  // That is deliberate. To substitute anything richer, the fetch would need a `workItemId`.
  // `subagentStopNeedsBlockGuard` would then hold the minion open until it signalled on its
  // PARENT's operation item. This section used to be headed "## Briefing", which told a worker its
  // briefing was one id.
  it('VALID: the last section => says the chunk is in the document and this line is the authoritative id', () => {
    expect({
      honestHeading: /^## The quest id — everything else is in the round document$/mu.test(
        template,
      ),
      noBriefingHeading: /^## Briefing$/mu.test(template),
      briefIsTheSpawnMessage: has("**Your BRIEF is your parent's spawn message**"),
      andItIsAPathPlusTwoNumbers: has(
        'and it is a `PLAN:` path plus a `WAVE:` and\n`CHUNK:` pair.',
      ),
      theAssignmentIsInTheDocument: has(
        'Your chunk, your context and the ids are in the document at\nthat path, not here and not in the brief.',
      ),
      oneLineOnly: has('It carries exactly one line.'),
      thisOneWins: has(
        'Where that\nline and the document disagree about the quest id, THIS one is right.',
      ),
      aMissingChunkIsRework: has(
        "If your parent's message names no path, or the document holds no `### chunk <n>` matching your\n`CHUNK:` line, say so in your return and return `NEXT: rework`.",
      ),
      doNotReconstruct: has('Do not\ntry to reconstruct an assignment from here.'),
    }).toStrictEqual({
      honestHeading: true,
      noBriefingHeading: false,
      briefIsTheSpawnMessage: true,
      andItIsAPathPlusTwoNumbers: true,
      theAssignmentIsInTheDocument: true,
      oneLineOnly: true,
      thisOneWins: true,
      aMissingChunkIsRework: true,
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
      escalateInsteadOfBuilding: has('If you think you need a build, say so in your report.'),
      // Names the REVIEWER, not "your parent". The operator runs neither command, so a worker told
      // "your parent already built" would be looking for output no session produced.
      theReviewerBuildsAtTheEnd: has(
        "**You NEVER run `npm run build`.** The round's `reviewer-minion` builds at the END, once, after\nevery worker has returned",
      ),
    }).toStrictEqual({
      ban: true,
      position: '# worker-minion\n\n'.length,
      headingLength: '# worker-minion\n\n'.length,
      namesTheCorruption: true,
      escalateInsteadOfBuilding: true,
      theReviewerBuildsAtTheEnd: true,
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
    // Two discipline packs point a worker at "method step N" for its round-log append, and the sweep
    // paragraph names that number too. All three read it off this list, so a step inserted anywhere
    // above it renumbers the append and sends those pointers at the ward step instead.
    it('VALID: template => numbers its steps 1 through 7, contiguously, ending on the append', () => {
      const method = template.slice(
        template.indexOf('## Method'),
        template.indexOf('**Some briefs carry `SECTION: Sweep`'),
      );

      expect({
        steps: Array.from(method.matchAll(/^\d\. \*\*/gmu)).map((match) => match[0]),
        andTheLastOneIsTheAppend: `${APPEND_STEP_NUMBER}. **`,
      }).toStrictEqual({
        steps: ['1. **', '2. **', '3. **', '4. **', '5. **', '6. **', '7. **'],
        andTheLastOneIsTheAppend: '7. **',
      });
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
    it('VALID: step 6 => builds its own ward command and treats DISCOVERY MISMATCH as not-a-failure', () => {
      expect({
        buildItYourself: has(
          '**BUILD your ward command, then run it.** Two things make it, and neither is a guess:',
        ),
        theCheckTypesComeFromTheDiscipline: has(
          "- **The check types** come from your discipline's **`### The ward`** section above.",
        ),
        theScopeIsTheFilesList: has(
          '- **The scope** is your `FILES` list, every path, spelled out.',
        ),
        theInvocation: has(
          'npm run ward -- --only <the checks your discipline names> -- <every path in your FILES>',
        ),
        fixUntilZero: has('Fix until it exits 0.'),
        mismatchIsNotAFailure: has('**That is\n   not a failure.**'),
        quoteIt: has('Quote it in your `WARD:` line.'),
        doNotEditTheCommand: has('Do not edit the command to make the message go away.'),
        notYoursToWiden: has(
          '**Widening your ward past your `FILES`** — the scope is your own paths and nothing else.',
        ),
      }).toStrictEqual({
        buildItYourself: true,
        theCheckTypesComeFromTheDiscipline: true,
        theScopeIsTheFilesList: true,
        theInvocation: true,
        fixUntilZero: true,
        mismatchIsNotAFailure: true,
        quoteIt: true,
        doNotEditTheCommand: true,
        notYoursToWiden: true,
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
          'A sibling chunk may own them, and two workers writing one path\n   undo each other.',
        ),
        nothingToSearchIsOneLine: has(
          'Where your `NOTES` names nothing and you changed nothing others use, say so in\n   one line and move on.',
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
        theBan: has(
          "- **`typecheck`, in any ward run** — your discipline's `### The ward` section never names it, and\n  you never add it.",
        ),
        becauseItBuilds: has(
          "Ward's typecheck runs `tsc -b`, which BUILDS, and the first line of this prompt\n  says why you never do that.",
        ),
        stepFiveCoversIt: has('Step 5 is how you cover what a typecheck would have caught.'),
        theReviewerTypechecks: has(
          "Your\n  round's reviewer typechecks the whole round at the end.",
        ),
        andSiblingChunksAreNotItsEither: has(
          '- **Any other chunk in the plan.** You read them to know which paths are not yours. You execute one.',
        ),
      }).toStrictEqual({
        theBan: true,
        becauseItBuilds: true,
        stepFiveCoversIt: true,
        theReviewerTypechecks: true,
        andSiblingChunksAreNotItsEither: true,
      });
    });

    // THE REPORT'S HOME. Everything this session has to say about its chunk goes into the round
    // document, under the region its planner left empty. The parent never holds a word of it: the
    // parent may not open a source file, so it could check nothing it carried.
    //
    // `>>` IS THE LOAD-BEARING PART, and the template says so in those characters. `Edit` and
    // `Write` both read the whole file and write it back, so of two siblings appending in one wave
    // the second one back erases the first. That is also why the region sits at the BOTTOM of the
    // document rather than under each chunk's own section, where it would read better and race.
    it('VALID: step 7 => appends the whole report with >>, to the region the planner leaves empty', () => {
      expect({
        appendsToThePlannersOwnRegion: APPEND_STEP.includes(
          `**APPEND YOUR REPORT to the round document's \`${ROUND_LOG_HEADING}\`, as your LAST act.**`,
        ),
        theDocumentIsTheOnlyPlaceItExists: APPEND_STEP.includes(
          '**This report\n   is your whole account of the chunk, and that document is the only place it exists.**',
        ),
        theParentNeverSeesIt: APPEND_STEP.includes(
          'Your parent never sees it — it may not open a source file',
        ),
        // Two `###` headings in one document, and they must never be spellable the same way: a
        // reviewer told to read "chunk 3" out of a file carrying two of them grades the report
        // against itself.
        theReportHeadingIsItsOwn: APPEND_STEP.includes('### report — chunk <n>'),
        andTheTemplateSaysWhyItIsNotTheChunkHeading: APPEND_STEP.includes(
          '**The heading is `### report — chunk <n>`, never `### chunk <n>`.**',
        ),
        andThePlannerReallyUsesTheOtherSpelling: PLAN_FENCE.includes('### chunk 1 — '),
        neverEditNeverWrite: APPEND_STEP.includes(
          '**Append with `>>`. Never `Edit` and never `Write` that file.**',
        ),
        andWhyThoseTwoRace: APPEND_STEP.includes(
          'Those two READ the whole file\n   and write it back.',
        ),
        theQuotedHeredoc: APPEND_STEP.includes(
          "cat >> <the PLAN: path from your brief> <<'REPORT'",
        ),
        theDisciplineOwnsWhichMarkers: APPEND_STEP.includes(
          "**`MARKERS:` is what your discipline's `### The work` asks you to DECLARE.**",
        ),
        aChunkWithNoBlockCannotBeGraded: APPEND_STEP.includes(
          '**A chunk with no block is a chunk nobody can grade.**',
        ),
        theReviewerCarriesTheMarkersOnward: APPEND_STEP.includes(
          "Your reviewer copies every marker into the round's\n   one commit message",
        ),
        andNothingAboveTheHeadingIsTouched: APPEND_STEP.includes(
          `Touch nothing above \`${ROUND_LOG_HEADING}\`.`,
        ),
        whichTheFilesBanCarvesOutByName: has(
          `**The round document is the one file outside your \`FILES\` you touch, in one way only: you APPEND to\nits \`${ROUND_LOG_HEADING}\`.** Step ${APPEND_STEP_NUMBER} says how.`,
        ),
        andNoWorkerCommitIsBackWithIt: has('git commit'),
      }).toStrictEqual({
        appendsToThePlannersOwnRegion: true,
        theDocumentIsTheOnlyPlaceItExists: true,
        theParentNeverSeesIt: true,
        theReportHeadingIsItsOwn: true,
        andTheTemplateSaysWhyItIsNotTheChunkHeading: true,
        andThePlannerReallyUsesTheOtherSpelling: true,
        neverEditNeverWrite: true,
        andWhyThoseTwoRace: true,
        theQuotedHeredoc: true,
        theDisciplineOwnsWhichMarkers: true,
        aChunkWithNoBlockCannotBeGraded: true,
        theReviewerCarriesTheMarkersOnward: true,
        andNothingAboveTheHeadingIsTouched: true,
        whichTheFilesBanCarvesOutByName: true,
        andNoWorkerCommitIsBackWithIt: false,
      });
    });

    // A `SECTION:` brief is NOT this minion's. Both kinds — the operator's step 6 sweep and a
    // re-review after a refused signal — go to the `reviewer-minion`. Deciding a path is scratch and
    // leaving it out of the commit are ONE judgement, and this session commits nothing; a worker sent
    // here would report on files it may not open, on a tree still dirty. The template answers that
    // brief explicitly rather than leaving a worker to improvise on one with no chunk behind it.
    it('VALID: template => refuses a SECTION brief outright rather than improvising on it', () => {
      expect({
        notYours: has(
          '**A brief carrying a `SECTION:` line instead of the `WAVE:` and `CHUNK:` pair is NOT yours.**',
        ),
        bothKindsGoToTheReviewer: has(
          'That is a sweep or a re-review, and both go to a `reviewer-minion`.',
        ),
        becauseSortingAndCommittingAreOneJudgement: has(
          'Deciding a path is scratch and\nleaving it out of the commit are one judgement, and you commit nothing.',
        ),
        andItReturnsRework: has(
          'If your brief carries a\n`SECTION:` line, say so in your return and return `NEXT: rework`. Do not sweep.',
        ),
      }).toStrictEqual({
        notYours: true,
        bothKindsGoToTheReviewer: true,
        becauseSortingAndCommittingAreOneJudgement: true,
        andItReturnsRework: true,
      });
    });
  });

  describe('what it returns', () => {
    it('VALID: template => returns two lines, and never the report', () => {
      const returnBlock = template.slice(
        template.indexOf('CHUNK: <the chunk number'),
        template.indexOf('**Never paste the report into your return.**'),
      );

      expect({
        chunk: returnBlock.includes(
          'CHUNK: <the chunk number from your brief> — logged to <the document path>',
        ),
        next: returnBlock.includes(
          'NEXT:  continue | rework — <what is not done> | wall — <what a human must change>',
        ),
        // Every one of these is a REPORT field now. It lives in the document, not in the return.
        result: returnBlock.includes('RESULT:'),
        files: returnBlock.includes('FILES:'),
        evidence: returnBlock.includes('EVIDENCE:'),
        usages: returnBlock.includes('USAGES:'),
        gotchas: returnBlock.includes('GOTCHAS:'),
        ward: returnBlock.includes('WARD:'),
        commit: returnBlock.includes('COMMIT:'),
        neverPasteIt: has('**Never paste the report into your return.**'),
        becauseTheParentCannotCheckIt: has(
          'Your parent may not open a source file, so it cannot\ncheck a word of it.',
        ),
        andTheReviewerIsAlreadyReadingIt: has(
          'It would carry that text to your reviewer, which is already reading it off disk.',
        ),
      }).toStrictEqual({
        chunk: true,
        next: true,
        result: false,
        files: false,
        evidence: false,
        usages: false,
        gotchas: false,
        ward: false,
        commit: false,
        neverPasteIt: true,
        becauseTheParentCannotCheckIt: true,
        andTheReviewerIsAlreadyReadingIt: true,
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
        reviewerDecides: has(
          'Your REVIEWER settles\n  it: it reads your report out of the round document and opens the files you actually wrote',
        ),
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
        sayItPlainly: has("say so plainly in your report's\n`RESULT:`"),
        leaveItInTheTree: has('Leave what you wrote in the tree.'),
        whatBrokeInGotchas: has('Put what you tried and where it broke in\n`GOTCHAS:`'),
        noFakeGreen: has('**Do not fake a green ward. Do not report a check you did not run.**'),
        theReviewerGradesTheReport: has(
          'Your reviewer\ngrades that report against the files themselves',
        ),
        plausibleReportCostsARound: has(
          'so a report that only sounds right costs the round\na pass it did not need',
        ),
      }).toStrictEqual({
        sayItPlainly: true,
        leaveItInTheTree: true,
        whatBrokeInGotchas: true,
        noFakeGreen: true,
        theReviewerGradesTheReport: true,
        plausibleReportCostsARound: true,
      });
    });
  });

  describe('what is not yours', () => {
    it('VALID: template => bans the build, all of git, typecheck, the Agent tool and the whole-repo ward', () => {
      expect({
        build: has(
          "- **`npm run build`** — see the first line. Your round's REVIEWER owns it, at the end.",
        ),
        allGit: has('- **Git, all of it**'),
        typecheck: has('- **`typecheck`, in any ward run**'),
        agentTool: has('- **The `Agent` tool** — you are a LEAF, so you summon no sub-agent.'),
        wholeRepoWard: has('- **The whole-repo `npm run ward`**'),
        wardScope: has('- **Widening your ward past your `FILES`**'),
        siblingChunks: has('- **Any other chunk in the plan.**'),
      }).toStrictEqual({
        build: true,
        allGit: true,
        typecheck: true,
        agentTool: true,
        wholeRepoWard: true,
        wardScope: true,
        siblingChunks: true,
      });
    });

    it('VALID: template => keeps the worker inside its own FILES list', () => {
      expect({
        stayInside: has('**Stay inside your chunk.**'),
        wiringIsInScope: has('That\nwiring is part of your assignment'),
        noReplanning: has('Do NOT re-plan the round'),
        lastWriteWins: has(
          'two workers writing one path undo each other, because the last write wins',
        ),
        sayInsteadOfReaching: has('say so in your report. Do NOT edit it yourself.'),
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
  // needle from that other file's live value. A chunk field, a section heading and a `NEXT:` value
  // are all plain prose on both sides: until these landed, a reword of either side stayed green.
  // ============================================================================================
  describe('agreements with the planner beside it and the operator above it', () => {
    // SPANS planner-minion-statics.ts (it WRITES the chunk into the document) ↔ this file (it READS
    // the chunk back out of the same document). Neither session's parent can read either side, so a
    // field renamed in the plan fence reaches this session under a name its own field inventory
    // does not list, and the field it does list arrives never.
    it('VALID: {planner chunk format, worker field inventory} => names every chunk field the planner writes, spelled identically', () => {
      expect({
        thePlannerWritesThisManyChunkFields: PLAN_CHUNK_FIELDS.length,
        andThisTemplateSaysHowMany: has('Your own chunk carries five fields:'),
        fieldsThePlannerWritesAndThisTemplateNeverNames: PLAN_CHUNK_FIELDS.filter(
          (field) => !CHUNK_FIELDS_THIS_TEMPLATE_NAMES.includes(field),
        ),
        fieldsThisTemplateNamesAndNoPlanCarries: CHUNK_FIELDS_THIS_TEMPLATE_NAMES.filter(
          (field) => !PLAN_CHUNK_FIELDS.includes(field),
        ),
        thePlannerMakesTheFilesFieldOwnership: PLANNER.includes(
          '**`FILES` is OWNERSHIP. Two chunks must never list the same path.**',
        ),
        andThisTemplateHoldsItsWorkerToThatSameField: has(
          'Do NOT touch a file outside your `FILES` list',
        ),
        bothSidesNameTheSameConsequence: has(
          'two workers writing one path undo each other, because the last write wins',
        ),
      }).toStrictEqual({
        thePlannerWritesThisManyChunkFields: 5,
        andThisTemplateSaysHowMany: true,
        fieldsThePlannerWritesAndThisTemplateNeverNames: [],
        fieldsThisTemplateNamesAndNoPlanCarries: [],
        thePlannerMakesTheFilesFieldOwnership: true,
        andThisTemplateHoldsItsWorkerToThatSameField: true,
        bothSidesNameTheSameConsequence: true,
      });
    });

    // SPANS operator-prompt-statics.ts's sweep step ↔ this template's refusal. That step is the one
    // place a `SECTION:` brief is written, and it goes to a REVIEWER: a worker commits nothing, which
    // is what makes a WAVE of them safe and equally what makes it the wrong session for a sweep. If
    // that step started sending the sweep here, this template's refusal would bounce a real dispatch.
    it('VALID: {operator sweep step, worker refusal} => the operator sends its sweep to a reviewer, not here', () => {
      expect({
        theSweepStepWritesThePathsIntoTheDocument: OPERATOR_SWEEP_STEP.includes(
          'APPEND a `## Sweep` section naming every path `git status` listed, one per line.',
        ),
        andDispatchesAReviewerOnThatSection: OPERATOR_SWEEP_STEP.includes(
          'Then dispatch\nONE `reviewer-minion` on `SECTION: Sweep`',
        ),
        andSaysWhyItIsNotAWorkers: OPERATOR_SWEEP_STEP.includes(
          '**A sweep goes to a REVIEWER, never to a worker.**',
        ),
        andCarriesNoChunkFieldAtAll: PLAN_CHUNK_FIELDS.filter((field) =>
          OPERATOR_SWEEP_STEP.includes(field),
        ),
        soThisTemplateRefusesASectionBrief: has(
          '**A brief carrying a `SECTION:` line instead of the `WAVE:` and `CHUNK:` pair is NOT yours.**',
        ),
        andNamesTheReviewerAsItsOwner: has(
          'That is a sweep or a re-review, and both go to a `reviewer-minion`.',
        ),
      }).toStrictEqual({
        theSweepStepWritesThePathsIntoTheDocument: true,
        andDispatchesAReviewerOnThatSection: true,
        andSaysWhyItIsNotAWorkers: true,
        andCarriesNoChunkFieldAtAll: [],
        soThisTemplateRefusesASectionBrief: true,
        andNamesTheReviewerAsItsOwner: true,
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
        andHandsItToTheReviewerInstead: has(
          'Your REVIEWER settles\n  it: it reads your report out of the round document and opens the files you actually wrote',
        ),
        // The parent forwards NOTHING now: the reviewer reads this session's report off disk.
        andTheOperatorForwardsNothingItself: OPERATOR.includes('**You forward nothing**'),
      }).toStrictEqual({
        valuesThisTemplateDeclaresThatTheOperatorCannotRoute: [],
        valuesTheOperatorRoutesThatThisTemplateNeverOffers: [],
        thisTemplateDeclares: 3,
        theOperatorHasARowForTheFirstArm: true,
        andRoutesTheSecondArmToTheIdenticalAction: true,
        theOperatorSaysThatIsDeliberate: true,
        soThisTemplateSaysTheParentDoesNotActOnIt: true,
        andHandsItToTheReviewerInstead: true,
        andTheOperatorForwardsNothingItself: true,
      });
    });

    // SPANS operator-prompt-statics.ts (its brief fence) ↔ the last section here. This session's own
    // fetch substitutes one line — the Quest ID — and its brief carries three keys at most, so
    // everything else it holds came out of the document. The last section is where the fetched line
    // and the document are reconciled when they disagree.
    it('VALID: {operator brief fence, worker} => reads the keys that fence sends it, refuses SECTION, and arbitrates the quest id', () => {
      expect({
        theFenceCarriesTheseKeys: BRIEF_KEYS,
        thisTemplateReadsTheChunkKey: has('CHUNK: <n>'),
        andTheSectionKeyIsRefused: has(
          '**A brief carrying a `SECTION:` line instead of the `WAVE:` and `CHUNK:` pair is NOT yours.**',
        ),
        thisTemplateArbitratesAgainstTheServerLine: has(
          'Where that\nline and the document disagree about the quest id, THIS one is right.',
        ),
        theOperatorSaysTheDocumentIsTheOnlyContext: OPERATOR.includes(
          '**The round document is the ONLY quest context a minion gets.**',
        ),
        andThisTemplateSaysTheSameFromTheOtherSide: has(
          'Your chunk, your context and the ids are in the document at\nthat path, not here and not in the brief.',
        ),
      }).toStrictEqual({
        theFenceCarriesTheseKeys: ['PLAN', 'WAVE', 'CHUNK', 'SECTION'],
        thisTemplateReadsTheChunkKey: true,
        andTheSectionKeyIsRefused: true,
        thisTemplateArbitratesAgainstTheServerLine: true,
        theOperatorSaysTheDocumentIsTheOnlyContext: true,
        andThisTemplateSaysTheSameFromTheOtherSide: true,
      });
    });
  });
});
