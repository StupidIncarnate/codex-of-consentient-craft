import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { roundProtocolStatics } from '../round-protocol/round-protocol-statics';

import { siegemasterPromptStatics } from './siegemaster-prompt-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides before it
// matches, so re-flowing a paragraph reds nothing that is still true. The size assertion reads real
// bytes instead, because bytes are what the MCP layer weighs.
const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = siegemasterPromptStatics.prompt.template;

const SCRIPT = TEMPLATE.slice(TEMPLATE.indexOf('\n## The script'));

const FORBIDDEN_START = TEMPLATE.indexOf('FORBIDDEN — no exceptions');

const FORBIDDEN = TEMPLATE.slice(FORBIDDEN_START, TEMPLATE.indexOf('\n```', FORBIDDEN_START));

// The ALLOWED half is a fenced list whose columns are hand-aligned, so each entry is compared with
// its whitespace runs collapsed — re-aligning the `←` column must not red a list that still says
// the same six things.
const ALLOWED_ENTRIES = TEMPLATE.slice(
  TEMPLATE.indexOf('ALLOWED — this is the whole list'),
  FORBIDDEN_START,
)
  .split('\n')
  .map((line) => line.replace(WHITESPACE_RUN, ' ').trim())
  .filter((line) => line.length > 0)
  .slice(1);

describe('siegemasterPromptStatics', () => {
  // THE SERVER SUBSTITUTES THE OPERATION CONTEXT AT `$ARGUMENTS`, and on this role that context is
  // load-bearing twice over: it carries the flow AND the `Dev Server Command` and `Dev Server URL`
  // this session starts at step 2. A slot that is not last buries both under text already read.
  it('VALID: served template => carries exactly one $ARGUMENTS slot, and it is last', () => {
    expect({
      count: TEMPLATE.split('$ARGUMENTS').length - 1,
      atTheEnd: TEMPLATE.trimEnd().endsWith('$ARGUMENTS'),
      underItsOwnHeading: hasIn({ needle: '## Operation Context\n\n$ARGUMENTS', text: TEMPLATE }),
    }).toStrictEqual({ count: 1, atTheEnd: true, underItsOwnHeading: true });
  });

  // OVER `maxVerbatimChars` THE MCP LAYER SPILLS THE RESULT TO A FILE and hands the agent an error
  // stub, so the session starts holding a path instead of its script. This is the LONGEST of the five
  // operator prompts, so it has the least headroom. BYTES, not characters: it is full of em-dashes
  // and `←` arrows, which cost three bytes each.
  it('VALID: served template => fits the MCP verbatim ceiling in bytes', () => {
    expect(Buffer.byteLength(TEMPLATE, 'utf8')).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  // THE SCRIPT IS THE WHOLE OF WHAT THIS SESSION DOES, and its order is the round loop. Two of these
  // headings carry the dev server's lifetime IN THE HEADING — it comes up at step 2 before the
  // planner probes anything, and it comes down at step 7 only when this session signals. Pinning the
  // heading LINES is what keeps that lifetime attached to the steps that own it.
  it('VALID: served template => names its seven steps in the order the round runs them', () => {
    expect(Array.from(SCRIPT.matchAll(/^### \d+\. .*$/gmu), (match) => match[0])).toStrictEqual([
      '### 1. Write the round document',
      '### 2. Start the dev server, then dispatch ONE `siegemaster-planner-minion`',
      '### 3. Read the document back',
      '### 4. Run the phases',
      '### 5. Dispatch ONE FINAL `siegemaster-reviewer-minion`',
      '### 6. `git status`',
      '### 7. Signal, or start the next round — shut the dev server down ONLY when you signal',
    ]);
  });

  // A NUMBERED STEP IS A CLAIM ABOUT ORDER. Two ways to break it without breaking the heading list:
  // a back-reference pointing past the last step, and a sub-numbered item, which hides an ordering
  // claim one level down where the two routing tables cannot send anyone. The dev-server section's
  // own numbered list sits ABOVE `## The script` and is deliberately outside this measurement.
  it('VALID: served template => references no step past the last, and numbers no sub-step', () => {
    const stepNumbers = Array.from(SCRIPT.matchAll(/^### (\d+)\. /gmu), (match) =>
      Number(match[1]),
    );
    const references = Array.from(TEMPLATE.matchAll(/[Ss]tep (\d+)/gu), (match) =>
      Number(match[1]),
    );

    expect({
      referencesPastTheLastStep: references.filter((n) => n > stepNumbers.length),
      subNumberedItems: Array.from(SCRIPT.matchAll(/^ +\d+\. /gmu), (match) => match[0].trim()),
    }).toStrictEqual({ referencesPastTheLastStep: [], subNumberedItems: [] });
  });

  // THE FENCED ALLOWED LIST IS THE SAME SIX ENTRIES ITS FOUR SIBLINGS CARRY, and on this role that is
  // deliberately NOT the whole surface — the dev server and `reset-flow-signoffs` are added by the
  // two sections below it. Pinning the fence exactly is what keeps those two additions visible as
  // additions: slip either INTO this list and the "naming them is what adds them" mechanism, and the
  // wall that guards it, quietly stop describing anything.
  it('VALID: served template => keeps the fenced ALLOWED list to exactly those six entries', () => {
    expect(ALLOWED_ENTRIES).toStrictEqual([
      'Write on .quest-plans/<operationItemId>-round-<n>.md ← step 1 ONLY, to create it',
      'cat >> .quest-plans/<operationItemId>-round-<n>.md ← every later write to it, always with >>',
      'Read on .quest-plans/<operationItemId>-round-<n>.md ← step 3, that ONE path and no other',
      'git status ← step 6, the sweep, and nowhere else',
      'Agent(siegemaster-planner-minion | siegemaster-worker-minion | siegemaster-reviewer-minion)',
      'signal-back ← step 7, once, and it ends your turn',
    ]);
  });

  // THIS IS THE ONE OPERATOR THAT RUNS TOOLS ITS ALLOWED LIST DOES NOT NAME, so both halves of that
  // mechanism are pinned. Its four siblings say "You never add anything to that ALLOWED list"; this
  // one must NOT, or the two sections below the fence become instructions to break the prompt. The
  // WALL is the other half: if the FORBIDDEN list ever denied one of the two, two lines of one prompt
  // would disagree and no session of this role could settle which wins — so it signals `blocked`
  // before it dispatches anything, with a tree that is clean because it has run nothing.
  it('VALID: served template => adds two tools by naming them, and walls a list that contradicts itself', () => {
    expect({
      namingThemAddsThem: hasIn({
        needle:
          '**TWO more tools are yours, and neither is on the ALLOWED list. The two sections below name them, and naming them is what adds them — run them anyway.**',
        text: TEMPLATE,
      }),
      namesWhichTwo: hasIn({
        needle:
          'They are the dev server command your Operation Context carries, and `reset-flow-signoffs`.',
        text: TEMPLATE,
      }),
      contradictionIsAWall: hasIn({
        needle: '**A tool those sections name that the FORBIDDEN list DENIES is a wall.**',
        text: TEMPLATE,
      }),
      wallDispatchesNothing: hasIn({
        needle:
          'Dispatch nothing. Signal `blocked` as the only action of your turn, with a `blockedReason` naming that tool and both lines.',
        text: TEMPLATE,
      }),
      siblingsClosedListSentence: hasIn({
        needle: '**You never add anything to that ALLOWED list.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      namingThemAddsThem: true,
      namesWhichTwo: true,
      contradictionIsAWall: true,
      wallDispatchesNothing: true,
      siblingsClosedListSentence: false,
    });
  });

  // THIS OPERATOR RUNS NO BUILD AND NO WARD — its REVIEWER does, and `git status` is the only git verb
  // it holds. `push` is NOT its either: the reviewer commits the round AND publishes it. The
  // driving-anything row is this discipline's own, and it carries its own EXCEPT line: an audited
  // session walked 39 of 60 units by hand against a prompt that told it not to, so the ban has to sit
  // in the table rather than only in prose.
  it('VALID: served template => forbids the build, the ward, driving anything and every git verb but status', () => {
    expect({
      noSource: hasIn({
        needle: 'Read / Edit / Write on any path but the round document ← you never see source.',
        text: FORBIDDEN,
      }),
      noDrivingAnything: hasIn({
        needle:
          'driving anything yourself — a browser, curl, the CLI, a queue ← your WORKERS walk. You never do.',
        text: FORBIDDEN,
      }),
      theTwoExceptions: hasIn({
        needle: 'EXCEPT your Dev Server Command, the kill that ends it, and reset-flow-signoffs.',
        text: FORBIDDEN,
      }),
      noBuild: hasIn({
        needle: 'npm run build ← your REVIEWERS build, after reading what they review',
        text: FORBIDDEN,
      }),
      noWard: hasIn({
        needle:
          'npm run ward, in EVERY form ← --staged, scoped, --only, a file list: none is yours',
        text: FORBIDDEN,
      }),
      noGitHistory: hasIn({
        needle: "git log / git diff / git show ← git is your PLANNER's to read, status included",
        text: FORBIDDEN,
      }),
      noCommitAndNoPush: hasIn({
        needle:
          'git add / git commit / git push ← your REVIEWER commits the round and publishes it',
        text: FORBIDDEN,
      }),
      // The checklist measures siegemaster's OWN track, and is still refused: the round's denominator
      // is the PLANNER's read of it, never this session's.
      noQaChecklist: hasIn({
        needle:
          "get-qa-checklist ← your PLANNER fetches it; the round's denominator is its read, never yours",
        text: FORBIDDEN,
      }),
      walksNothing: hasIn({
        needle: '**You never open a source file, you never write one, and you WALK NOTHING.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      noSource: true,
      noDrivingAnything: true,
      theTwoExceptions: true,
      noBuild: true,
      noWard: true,
      noGitHistory: true,
      noCommitAndNoPush: true,
      noQaChecklist: true,
      walksNothing: true,
    });
  });

  // `tsc` WRITES ONE SHARED `dist/` PER PACKAGE and ward's typecheck is `tsc -b`, which builds — so a
  // second builder hands every sibling session type errors that are not real. That is why only the
  // reviewer runs either, and why [WARD] has to override the two ward snippets every session in this
  // repo is handed at start. [BACKGROUND] is amended here rather than overridden: the dev server is
  // the ONE command this session is right to leave running detached, and a holder that narrowed it to
  // finish in the foreground would kill the server its own planner is about to probe.
  it('VALID: served template => hands the build and the ward to a reviewer while exempting the dev server from [BACKGROUND]', () => {
    expect({
      runsNeither: hasIn({
        needle: '**[WARD] You run no build, no ward, no test and no check of any kind.**',
        text: TEMPLATE,
      }),
      namesTheReviewersPair: hasIn({
        needle: '`npm run build`, then `npm run ward -- --staged`',
        text: TEMPLATE,
      }),
      overridesTheSnippets: hasIn({
        needle:
          'This rule OVERRIDES both the `<dungeonmaster-ward>` and the `<dungeonmaster-ward-discipline>` snippets you were handed at session start',
        text: TEMPLATE,
      }),
      backgroundExemptsTheServer: hasIn({
        needle:
          'with ONE exception: the dev server you start at step 2 and keep alive for the whole session. You never wait on that one and never poll it, so leaving it running in the background is correct and narrowing it is not.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      runsNeither: true,
      namesTheReviewersPair: true,
      overridesTheSnippets: true,
      backgroundExemptsTheServer: true,
    });
  });

  // ONE SERVER, ONE OWNER, ONE LIFETIME. A bounce wipes the state under whichever worker is mid-walk,
  // so the permission to start or stop it is this session's alone; and it must survive a `rework`,
  // because that sends this same session back to step 1 with a planner and workers that need the
  // server still up. A holder that shut it down on every round would restart the walk from a cold
  // system each time. The two wall cases are pinned too: a server that will not start on THIS QUEST'S
  // code is a defect for the round to find, and only a foreign port or a missing runtime is a wall.
  it('VALID: served template => gives one session the dev server for the whole session', () => {
    expect({
      startsBeforeThePlanner: hasIn({
        needle: '**Start the server before you dispatch your planner**, and start exactly one.',
        text: TEMPLATE,
      }),
      ownsItAcrossRounds: hasIn({
        needle: '**Own it for the whole session** — every round of it, not only this one.',
        text: TEMPLATE,
      }),
      noWorkerMayBounceIt: hasIn({
        needle:
          '**No worker may start, restart or stop it, and that permission is yours alone.** There is exactly ONE server and a bounce wipes the state under whichever worker is mid-walk.',
        text: TEMPLATE,
      }),
      killsOnlyWhatItStarted: hasIn({
        needle:
          "Kill only what you started: match port AND cwd, or use the repo's scoped kill script. Never `pkill` a bare name or a bare port.",
        text: TEMPLATE,
      }),
      survivesARework: hasIn({
        needle:
          "**Shut it down only when you are signalling.** A reviewer's `rework` sends you back to step 1 in this same session, and the next round's planner and workers need that same server still up.",
        text: TEMPLATE,
      }),
      aDeadServerIsADefectNotAWall: hasIn({
        needle:
          "**A server that will not start on THIS QUEST'S code is a defect for the round to fix, not a wall**",
        text: TEMPLATE,
      }),
      theTwoRealWalls: hasIn({
        needle:
          '**A port held outside your cwd IS a wall, and so is a missing runtime**; both go to [WALL].',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      startsBeforeThePlanner: true,
      ownsItAcrossRounds: true,
      noWorkerMayBounceIt: true,
      killsOnlyWhatItStarted: true,
      survivesARework: true,
      aDeadServerIsADefectNotAWall: true,
      theTwoRealWalls: true,
    });
  });

  // THE RESET IS THIS ROLE'S FIFTH DECISION, and it is the one that was never made: prior sessions ran
  // it ZERO times in 334 audited turns and signed 52 units against pre-fix code. Sign-offs a reviewer
  // already wrote describe a system that has since CHANGED, so the trigger is a worker reporting a
  // FIX and the moment is before the next wave. "Resets are FREE" is what removes the reason a
  // session invents to skip it — it costs no attempt and admits no failure.
  it('VALID: served template => runs the free reset on every worker FIX, before the next wave', () => {
    expect({
      itIsADecisionOnTheTable: hasIn({
        needle:
          '| whether to reset before the next wave | whether the worker that just returned reports a FIX | step 4 |',
        text: TEMPLATE,
      }),
      theCallShape: hasIn({
        needle:
          "reset-flow-signoffs({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', flowId: 'FLOW_ID', reason: '<the fix, and which worker made it>' })",
        text: TEMPLATE,
      }),
      flowIdIsTheItemsFlow: hasIn({
        needle: '**`flowId` is the one flow your operation item names.**',
        text: TEMPLATE,
      }),
      theTrigger: hasIn({
        needle:
          '**Run this whenever a worker reports a FIX, before you dispatch the next wave.** Sign-offs a reviewer already wrote describe a system that has since CHANGED.',
        text: TEMPLATE,
      }),
      resetsAreFree: hasIn({
        needle:
          '**Resets are FREE.** They cost no attempt from your retry budget and they admit no failure.',
        text: TEMPLATE,
      }),
      theMeasuredCostOfSkippingIt: hasIn({
        needle:
          'Prior sessions ran it ZERO times in 334 audited turns, and those rounds signed 52 units against pre-fix code.',
        text: TEMPLATE,
      }),
      step4RunsIt: hasIn({
        needle:
          "**When a worker's return reports a FIX, run `reset-flow-signoffs` before the next wave goes out.**",
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      itIsADecisionOnTheTable: true,
      theCallShape: true,
      flowIdIsTheItemsFlow: true,
      theTrigger: true,
      resetsAreFree: true,
      theMeasuredCostOfSkippingIt: true,
      step4RunsIt: true,
    });
  });

  // ONE DEV SERVER MEANS ONE WALK IN FLIGHT, and the reset only means anything under that condition.
  // Two chunks grouped into one message walk at once against that one server: the first resets the
  // seed data out from under the second mid-walk, and NEITHER worker can tell that happened, so the
  // false green is permanent because nothing re-walks that slice. Pinned from BOTH sides — the
  // one-chunk rule and its cost must be here, and the siblings' parallel-wave sentence must NOT creep
  // back in from a copy-edit across the five prompts.
  it('VALID: served template => makes every wave one chunk and says what a merged wave costs', () => {
    expect({
      itsOwnSection: hasIn({ needle: '## One walk at a time', text: TEMPLATE }),
      everyChunkItsOwnWave: hasIn({
        needle:
          '**so your planner puts every chunk in its OWN wave** — `1: 1`, `2: 2`, `3: 3` — however independent two slices look.',
        text: TEMPLATE,
      }),
      neitherWorkerCanTell: hasIn({
        needle:
          '**neither worker can tell that happened.** Nothing re-walks that slice, so the false green is permanent.',
        text: TEMPLATE,
      }),
      oneChunkPerWaveAtStepFour: hasIn({
        needle:
          '**A wave here holds ONE chunk, so a wave is ONE `Agent` call in a message of its own.**',
        text: TEMPLATE,
      }),
      neverTwoMinionsAtOnce: hasIn({
        needle: '**Never put two minions in one assistant message.**',
        text: TEMPLATE,
      }),
      neverGroupsThemItself: hasIn({
        needle: 'the plan itself — you never group chunks yourself',
        text: TEMPLATE,
      }),
      siblingsParallelWaveRule: hasIn({
        needle:
          "**Every chunk on one wave's line goes out in a SINGLE assistant message, one `Agent` call each**",
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      itsOwnSection: true,
      everyChunkItsOwnWave: true,
      neitherWorkerCanTell: true,
      oneChunkPerWaveAtStepFour: true,
      neverTwoMinionsAtOnce: true,
      neverGroupsThemItself: true,
      siblingsParallelWaveRule: false,
    });
  });

  // ONLY THE REVIEWER'S `NEXT:` LINE DECIDES THE ROUND. A worker's `rework` is a claim about its own
  // slice and moves the script forward; the reviewer is the session that settles it, because it
  // RE-DRIVES every fix a worker made before it grades one. A worker here stops at its first defect,
  // repairs it, and may not grade its own repair — the phase gate is the fresh session that does.
  it('VALID: served template => routes every NEXT: value and lets only the reviewer decide the round', () => {
    expect({
      continueGoesOn: hasIn({ needle: '| `continue` | go to the next step |', text: TEMPLATE }),
      reworkGoesOn: hasIn({ needle: '| `rework` | go to the next step |', text: TEMPLATE }),
      wallStopsDispatching: hasIn({
        needle:
          '| `wall` | **STOP dispatching.** Let the wave in flight finish, then go to step 6 and carry on in order. Step 7 signals `blocked`, naming that text and every chunk you had not dispatched yet. |',
        text: TEMPLATE,
      }),
      missingLineIsRework: hasIn({
        needle: '| no `NEXT:` line at all | treat it as `rework`, and say so in your signal |',
        text: TEMPLATE,
      }),
      reviewerContinueIsDone: hasIn({ needle: '| `continue` | `done` |', text: TEMPLATE }),
      reviewerReworkIsAnotherRound: hasIn({
        needle:
          "| `rework` | **Do not signal.** Start round + 1 at step 1, writing that text into the new document's `## Rework` |",
        text: TEMPLATE,
      }),
      noRoundCap: hasIn({
        needle: '**There is NO round cap. Keep going until your reviewer returns `continue`.**',
        text: TEMPLATE,
      }),
      phaseGateReDrivesEveryFix: hasIn({
        needle:
          'That reviewer opens every file the phase produced, RE-DRIVES every fix a worker made in it, builds, fixes what it can, and commits the phase.',
        text: TEMPLATE,
      }),
      workerMayNotGradeItsOwnRepair: hasIn({
        needle:
          'A worker here stops at its first defect, repairs it, and may not grade its own repair — the gate is the fresh session that re-drives that repair before the next slice walks the same code.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      continueGoesOn: true,
      reworkGoesOn: true,
      wallStopsDispatching: true,
      missingLineIsRework: true,
      reviewerContinueIsDone: true,
      reviewerReworkIsAnotherRound: true,
      noRoundCap: true,
      phaseGateReDrivesEveryFix: true,
      workerMayNotGradeItsOwnRepair: true,
    });
  });

  // `partial` COSTS A WHOLE FRESH SESSION *AND* ONE OF THIS LOCKED ROLE'S THREE ATTEMPTS, plus a fresh
  // dev server and a fresh walk of ground this session already covered. Both roads to it are a SECOND
  // failure of the same kind — a reviewer's `rework` is never one, which is the sentence a session
  // reaches for when a round goes badly.
  it('VALID: served template => reaches partial from exactly two second failures', () => {
    expect({
      notFromRework: hasIn({
        needle:
          "**`partial` is not on this table, and a reviewer's `rework` never makes it the right signal.**",
        text: TEMPLATE,
      }),
      secondRefusal: hasIn({ needle: '**A second refusal is `partial`.**', text: TEMPLATE }),
      secondEmptyPlan: hasIn({
        needle:
          '**Still no `## Plan` on the second read: go to step 6, then signal `partial`, naming that two planners left the document with no plan in it.**',
        text: TEMPLATE,
      }),
      theFileSettlesIt: hasIn({
        needle: "**The FILE settles this, never the planner's `NEXT:` line**",
        text: TEMPLATE,
      }),
      // The retry planner does NOT get a second server. Step 3 says so, because "start the dev
      // server" is bound to step 2 and a retry that re-ran step 2 would start one.
      retryStartsNoSecondServer: hasIn({
        needle: 'The dev server is already up; you do not start a second one.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      notFromRework: true,
      secondRefusal: true,
      secondEmptyPlan: true,
      theFileSettlesIt: true,
      retryStartsNoSecondServer: true,
    });
  });

  // FIVE PROTOCOL BLOCKS ARE INTERPOLATED AND TWO ARE WITHHELD. Siegemaster reads the two indexes off
  // the document and never a plan block or a chunk field, so `planBlocks` and `chunkFields` are
  // pinned ABSENT — pasting either back would add ~5,700 characters to the longest of the five
  // operator prompts. Each block is pinned by IDENTITY, so re-wording one in `roundProtocolStatics`
  // stays pinned.
  it('VALID: served template => interpolates the five protocol blocks it reads and withholds the two it does not', () => {
    expect({
      document: hasIn({ needle: roundProtocolStatics.document, text: TEMPLATE }),
      indexes: hasIn({ needle: roundProtocolStatics.indexes, text: TEMPLATE }),
      commitSubjects: hasIn({ needle: roundProtocolStatics.commitSubjects, text: TEMPLATE }),
      nextLine: hasIn({ needle: roundProtocolStatics.nextLine, text: TEMPLATE }),
      briefKeys: hasIn({ needle: roundProtocolStatics.briefKeys, text: TEMPLATE }),
      planBlocks: hasIn({ needle: roundProtocolStatics.planBlocks, text: TEMPLATE }),
      chunkFields: hasIn({ needle: roundProtocolStatics.chunkFields, text: TEMPLATE }),
    }).toStrictEqual({
      document: true,
      indexes: true,
      commitSubjects: true,
      nextLine: true,
      briefKeys: true,
      planBlocks: false,
      chunkFields: false,
    });
  });

  // EACH BLOCK SITS BESIDE THE SECTION THAT USES IT, and `indexes` has a placement specific to this
  // role. Its "a chunk sharing a long-running server or a reset command goes in a later wave" bullet
  // is an EDGE CASE on every other discipline and the WHOLE RULE here, so `## One walk at a time` is
  // written above it — the shared block then lands as confirmation rather than as news.
  it('VALID: served template => places those five blocks in order, with the one-walk rule above the indexes', () => {
    expect(TEMPLATE.indexOf(roundProtocolStatics.document)).toBeLessThan(
      TEMPLATE.indexOf('## One walk at a time'),
    );
    expect(TEMPLATE.indexOf('## One walk at a time')).toBeLessThan(
      TEMPLATE.indexOf(roundProtocolStatics.indexes),
    );
    expect(TEMPLATE.indexOf(roundProtocolStatics.indexes)).toBeLessThan(
      TEMPLATE.indexOf(roundProtocolStatics.commitSubjects),
    );
    expect(TEMPLATE.indexOf(roundProtocolStatics.commitSubjects)).toBeLessThan(
      TEMPLATE.indexOf(roundProtocolStatics.nextLine),
    );
    expect(TEMPLATE.indexOf(roundProtocolStatics.nextLine)).toBeLessThan(
      TEMPLATE.indexOf(roundProtocolStatics.briefKeys),
    );
  });

  // SIEGEMASTER IS ONE OF THE THREE ROLES THE SIGN-OFF COMPLETION GATE BINDS, so `signal-back`
  // rebuilds TWO records before it saves anything and refuses on the ABSENCE of a `siegemasterSignoff`
  // for any verification unit in scope. Its implementation sibling deletes that row because product
  // code signs no track; a single-record version here would leave the commonest refusal on this role
  // unexplained — and this session has neither opened a file nor driven a surface, so it cannot fill
  // either record in itself.
  it('VALID: served template => describes both records the completion gate rebuilds for this track', () => {
    expect({
      twoRecordTable: hasIn({
        needle: '| What it rebuilds | Who was supposed to fill it in |',
        text: TEMPLATE,
      }),
      concernRow: hasIn({
        needle:
          '| every file your work changed, crossed with each standing review concern | your REVIEWER, every round |',
        text: TEMPLATE,
      }),
      signoffRow: hasIn({
        needle:
          '| every verification unit in your scope, each needing a `siegemasterSignoff` | your REVIEWER, every round |',
        text: TEMPLATE,
      }),
      reviewerWritesBoth: hasIn({
        needle:
          '**Your reviewer writes both records. Nothing else does, and you cannot.** You have not opened a file or driven a surface all session',
        text: TEMPLATE,
      }),
      finalReviewerSigns: hasIn({
        needle:
          '**That reviewer is the only session that writes a `siegemasterSignoff` per unit in your scope**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      twoRecordTable: true,
      concernRow: true,
      signoffRow: true,
      reviewerWritesBoth: true,
      finalReviewerSigns: true,
    });
  });

  // THE `RESOURCE`/`RESET` CONTRACT TABLE IS GONE HERE TOO, even though this is the one role where
  // both fields are real. They are written out as PROCEDURE in siegemaster's own words, each under its
  // own heading, because a two-field table is a shape a session has to translate before it can act —
  // and the two field names are pinned ABSENT so the table cannot be restored as boilerplate around
  // text that already works.
  it('VALID: served template => writes its resource and its reset as procedure, not as a contract table', () => {
    expect({
      devServerHeading: hasIn({ needle: '## The dev server is yours', text: TEMPLATE }),
      resetHeading: hasIn({ needle: '## The reset command is yours', text: TEMPLATE }),
      resourceField: hasIn({ needle: 'RESOURCE', text: TEMPLATE }),
      resetField: hasIn({ needle: 'RESET', text: TEMPLATE }),
    }).toStrictEqual({
      devServerHeading: true,
      resetHeading: true,
      resourceField: false,
      resetField: false,
    });
  });

  // FIVE DECISIONS, NOT FOUR. The reset is a decision this role has and its four siblings do not, and
  // the count in the sentence above the table is what tells a reader the table is complete. A "four"
  // left over from a copy-edit would read as an instruction to ignore whichever row came last.
  it('VALID: served template => counts five decisions, and calls none of them a judgement', () => {
    expect({
      countsFive: hasIn({
        needle:
          '**Every decision you make all round is a LOOKUP, never a judgement.** The five below read a value you already have',
        text: TEMPLATE,
      }),
      noneIsAJudgement: hasIn({
        needle:
          '**None of the five is a judgement about code, and none is a judgement about the running system.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ countsFive: true, noneIsAJudgement: true });
  });
});
