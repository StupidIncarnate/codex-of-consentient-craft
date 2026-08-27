import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { roundProtocolStatics } from '../round-protocol/round-protocol-statics';

import { groundstomperPromptStatics } from './groundstomper-prompt-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides before it
// matches, so re-flowing a paragraph reds nothing that is still true. The size assertion reads real
// bytes instead, because bytes are what the MCP layer weighs.
const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = groundstomperPromptStatics.prompt.template;

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

describe('groundstomperPromptStatics', () => {
  // THE SERVER SUBSTITUTES THE OPERATION CONTEXT AT `$ARGUMENTS`, and the flow this session owns
  // arrives there. A second slot would split that context in two, and a slot that is not last buries
  // the flow under instructions the session has already read.
  it('VALID: served template => carries exactly one $ARGUMENTS slot, and it is last', () => {
    expect({
      count: TEMPLATE.split('$ARGUMENTS').length - 1,
      atTheEnd: TEMPLATE.trimEnd().endsWith('$ARGUMENTS'),
      underItsOwnHeading: hasIn({ needle: '## Operation Context\n\n$ARGUMENTS', text: TEMPLATE }),
    }).toStrictEqual({ count: 1, atTheEnd: true, underItsOwnHeading: true });
  });

  // OVER `maxVerbatimChars` THE MCP LAYER SPILLS THE RESULT TO A FILE and hands the agent an error
  // stub, so the session starts holding a path instead of its script. BYTES, not characters: this
  // template is full of em-dashes and `←` arrows, which cost three bytes each.
  it('VALID: served template => fits the MCP verbatim ceiling in bytes', () => {
    expect(Buffer.byteLength(TEMPLATE, 'utf8')).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  // THE SCRIPT IS THE WHOLE OF WHAT THIS SESSION DOES, and its order is the round loop. Pinning the
  // heading LINES rather than the count is what catches a step that changed which minion it
  // dispatches — a planner at step 5 or a reviewer at step 2 reads as a valid seven-step script.
  it('VALID: served template => names its seven steps in the order the round runs them', () => {
    expect(Array.from(SCRIPT.matchAll(/^### \d+\. .*$/gmu), (match) => match[0])).toStrictEqual([
      '### 1. Write the round document',
      '### 2. Dispatch ONE `groundstomper-planner-minion`',
      '### 3. Read the document back',
      '### 4. Run the phases',
      '### 5. Dispatch ONE FINAL `groundstomper-reviewer-minion`',
      '### 6. `git status`',
      '### 7. Signal, or start the next round',
    ]);
  });

  // A NUMBERED STEP IS A CLAIM ABOUT ORDER. Two ways to break it without breaking the heading list:
  // a back-reference pointing past the last step, and a sub-numbered item, which hides an ordering
  // claim one level down where the two routing tables cannot send anyone.
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

  // "You never add anything to that ALLOWED list" is only true if the list is EXHAUSTIVE, so it is
  // pinned whole rather than by membership. Six entries: the round document three ways, `git status`,
  // the three minions, and the one signal. Anything a future edit slips in here — a build, a ward, an
  // `npx playwright`, a `git commit` — reds this test rather than quietly widening the role.
  it('VALID: served template => keeps the ALLOWED list to exactly those six entries', () => {
    expect(ALLOWED_ENTRIES).toStrictEqual([
      'Write on .quest-plans/<operationItemId>-round-<n>.md ← step 1 ONLY, to create it',
      'cat >> .quest-plans/<operationItemId>-round-<n>.md ← every later write to it, always with >>',
      'Read on .quest-plans/<operationItemId>-round-<n>.md ← step 3, that ONE path and no other',
      'git status ← step 6, the sweep, and nowhere else',
      'Agent(groundstomper-planner-minion | groundstomper-worker-minion | groundstomper-reviewer-minion)',
      'signal-back ← step 7, once, and it ends your turn',
    ]);
  });

  // THIS OPERATOR RUNS NO BUILD, NO WARD AND NO PLAYWRIGHT — its REVIEWER builds and wards, a WORKER
  // runs, and `git status` is the only git verb it holds. `push` is NOT its either: the reviewer
  // commits the round AND publishes it. The `npx playwright` row is the one this discipline cannot do
  // without — a run started outside a chunk collides with the run inside one over the same report.
  it('VALID: served template => forbids the build, the ward, a run of its own and every git verb but status', () => {
    expect({
      noSpec: hasIn({
        needle: 'Read / Edit / Write on any path but the round document ← you never open a spec.',
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
      noRunOfItsOwn: hasIn({
        needle:
          'npx playwright, and every other way to start a run ← a run belongs to a worker, inside its chunk',
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
      noQaChecklist: hasIn({
        needle: 'get-qa-checklist ← your planner and your reviewer fetch it; you never do',
        text: FORBIDDEN,
      }),
    }).toStrictEqual({
      noSpec: true,
      noBuild: true,
      noWard: true,
      noRunOfItsOwn: true,
      noGitHistory: true,
      noCommitAndNoPush: true,
      noQaChecklist: true,
    });
  });

  // `tsc` WRITES ONE SHARED `dist/` PER PACKAGE and ward's typecheck is `tsc -b`, which builds — so a
  // second builder hands every sibling session type errors that are not real. That is why only the
  // reviewer runs either, and why [WARD] has to override the two ward snippets every session in this
  // repo is handed at start: neither of those is written for a session that runs neither command.
  it('VALID: served template => hands the build and the ward to a reviewer, overriding the session snippets', () => {
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
      saysWhyOnlyOne: hasIn({
        needle: "`tsc` writes one shared `dist/` per package, and ward's typecheck is `tsc -b`",
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      runsNeither: true,
      namesTheReviewersPair: true,
      overridesTheSnippets: true,
      saysWhyOnlyOne: true,
    });
  });

  // EVERY WAVE HERE HOLDS EXACTLY ONE CHUNK, and the `WAVES` index alone cannot enforce that — nothing
  // stops a session merging two of its lines into one message to save a turn. Playwright writes one
  // report path per package, so a second run against that package overwrites the first one's report
  // while it is still being written and both workers read a report describing neither run. Pinned from
  // BOTH sides: the one-chunk rule and its reason must be here, and the siblings' multi-chunk wave
  // sentence must NOT creep back in from a copy-edit across the five prompts.
  it('VALID: served template => makes every wave one chunk and says what a merged wave costs', () => {
    expect({
      oneChunkPerWave: hasIn({
        needle:
          '**A wave here holds ONE chunk, so a wave is ONE `Agent` call in a message of its own.**',
        text: TEMPLATE,
      }),
      aWaveOfOneIsAWave: hasIn({ needle: '**A wave of one is still a wave.**', text: TEMPLATE }),
      namesTheReportCollision: hasIn({
        needle:
          "Playwright writes one report path per package: a second run against that package overwrites the first one's report while it is still being written",
        text: TEMPLATE,
      }),
      neverMergeTwoWaveLines: hasIn({
        needle: '**Never merge two wave lines into one message to save a turn.**',
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
      oneChunkPerWave: true,
      aWaveOfOneIsAWave: true,
      namesTheReportCollision: true,
      neverMergeTwoWaveLines: true,
      neverTwoMinionsAtOnce: true,
      neverGroupsThemItself: true,
      siblingsParallelWaveRule: false,
    });
  });

  // ONLY THE REVIEWER'S `NEXT:` LINE DECIDES THE ROUND. A worker's `rework` is a claim about its own
  // chunk and moves the script forward; the reviewer is the session that settles it, because it read
  // every worker return AND opened the files. Pinned as the four routing rows plus the two signal
  // rows, because a routing table that treated a worker's `rework` as a verdict would restart the
  // round mid-phase and drop the phase gate that has not run yet.
  it('VALID: served template => routes every NEXT: value and lets only the reviewer decide the round', () => {
    expect({
      continueGoesOn: hasIn({ needle: '| `continue` | go to the next step |', text: TEMPLATE }),
      reworkGoesOn: hasIn({ needle: '| `rework` | go to the next step |', text: TEMPLATE }),
      wallStopsDispatching: hasIn({
        needle:
          '| `wall` | **STOP dispatching.** Let the rest of the wave finish, then go to step 6 and carry on in order. Step 7 signals `blocked`, naming that text and every chunk you had not dispatched yet. |',
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
      phaseGateClosesEachPhase: hasIn({
        needle:
          "**When a phase's last wave has returned, dispatch ONE `groundstomper-reviewer-minion`**",
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
      phaseGateClosesEachPhase: true,
    });
  });

  // `partial` COSTS A WHOLE FRESH SESSION *AND* ONE OF THIS LOCKED ROLE'S THREE ATTEMPTS, and that
  // session has to reconstruct the remainder out of git to arrive where this one already is. Both
  // roads to it are a SECOND failure of the same kind — a reviewer's `rework` is never one, which is
  // the sentence a session reaches for when a round goes badly.
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
      // An empty plan is a real outcome on this discipline: every unit on the flow was already
      // covered by a spec on disk. Reading it as a planner failure would spend a second planner.
      emptyPlanIsRealPlan: hasIn({
        needle:
          '**`PHASES: none` and `WAVES: none` are a real plan, not an error.** Every unit on this flow was already covered by a spec on disk',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      notFromRework: true,
      secondRefusal: true,
      secondEmptyPlan: true,
      theFileSettlesIt: true,
      emptyPlanIsRealPlan: true,
    });
  });

  // FIVE PROTOCOL BLOCKS ARE INTERPOLATED AND TWO ARE WITHHELD. Groundstomper reads the two indexes
  // off the document and never a plan block or a chunk field, so `planBlocks` and `chunkFields` are
  // pinned ABSENT — pasting either back would add ~5,700 characters of text this session cannot act
  // on. Each block is pinned by IDENTITY, so re-wording one in `roundProtocolStatics` stays pinned.
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

  // EACH BLOCK SITS BESIDE THE SECTION THAT USES IT. Stacked as one run they put nearly nine thousand
  // characters between the tool table and step 1, and the session holds every one of them with no
  // idea yet what it is for. This order IS the script's order — document, indexes and commit
  // subjects for steps 1, 3 and 6; the `NEXT:` line above the table that reads it; the brief lines
  // above the dispatch protocol that assembles one.
  it('VALID: served template => places those five blocks in the order the script needs them', () => {
    expect(TEMPLATE.indexOf(roundProtocolStatics.document)).toBeLessThan(
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

  // THE DENOMINATOR IS THE WHOLE FLOW, NOT THIS ROUND'S SPECS, and that is the thing a holder gets
  // wrong when the refusal lands. The gate recomputes over EVERY eligible unit on the flow, including
  // the ones no spec this round touched, so the row states that denominator rather than hedging.
  it('VALID: served template => describes both records the completion gate rebuilds for this track', () => {
    expect({
      twoRecordTable: hasIn({
        needle: '| What it rebuilds | Who was supposed to fill it in |',
        text: TEMPLATE,
      }),
      wholeFlowRow: hasIn({
        needle:
          '| every eligible unit on this flow, INCLUDING the ones no spec this round touched | your REVIEWER, every round |',
        text: TEMPLATE,
      }),
      concernRow: hasIn({
        needle:
          '| every file your work changed, crossed with each standing review concern | your REVIEWER, every round |',
        text: TEMPLATE,
      }),
      reviewerWritesBoth: hasIn({
        needle: '**Your reviewer writes both records. Nothing else does, and you cannot.**',
        text: TEMPLATE,
      }),
      finalReviewerSigns: hasIn({
        needle:
          'wards the whole round, signs every unit on your flow, and records its standing concerns',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      twoRecordTable: true,
      wholeFlowRow: true,
      concernRow: true,
      reviewerWritesBoth: true,
      finalReviewerSigns: true,
    });
  });

  // THE `RESOURCE`/`RESET` CONTRACT TABLE IS GONE, and it must not come back. The server an e2e run
  // needs is declared in Playwright's `webServer` config and torn down by the same run, so a holder
  // that went looking for one to start would start a second. The two field names are pinned ABSENT so
  // the empty structure cannot be restored as boilerplate.
  it('VALID: served template => replaces the empty RESOURCE/RESET table with one sentence', () => {
    expect({
      theSentence: hasIn({
        needle:
          "**You never add anything to that ALLOWED list.** You are given no dev server and you need none: the one an e2e run needs is declared in the project's Playwright `webServer` config, and the run that starts it stops it again at the end.",
        text: TEMPLATE,
      }),
      noResetEither: hasIn({
        needle:
          'There is no reset command either — each run creates the state it needs and deletes it when it ends',
        text: TEMPLATE,
      }),
      resourceField: hasIn({ needle: 'RESOURCE', text: TEMPLATE }),
      resetField: hasIn({ needle: 'RESET', text: TEMPLATE }),
    }).toStrictEqual({
      theSentence: true,
      noResetEither: true,
      resourceField: false,
      resetField: false,
    });
  });

  // `.gitignore` CARRIES `spike-tmp/`, so a probe written inside it never reaches `git status` and a
  // path that DOES reach it is something else. Without that sentence a holder reads every sweep entry
  // as scratch and hands a reviewer a list to delete that includes real work.
  it('VALID: served template => tells the sweep which probes git never lists', () => {
    expect({
      whatASweepFinds: hasIn({
        needle:
          'most often a probe a minion wrote OUTSIDE `spike-tmp/`, which git ignores, so nothing written inside it reaches this list',
        text: TEMPLATE,
      }),
      sweepGoesToAReviewer: hasIn({
        needle: '**A sweep goes to a REVIEWER, never to a worker.**',
        text: TEMPLATE,
      }),
      secondSweepClearsIt: hasIn({
        needle:
          '**The second sweep is what gets you to a clean tree**, because a commit always clears it.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      whatASweepFinds: true,
      sweepGoesToAReviewer: true,
      secondSweepClearsIt: true,
    });
  });
});
