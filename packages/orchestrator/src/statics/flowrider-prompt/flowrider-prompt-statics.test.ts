import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { roundProtocolStatics } from '../round-protocol/round-protocol-statics';

import { flowriderPromptStatics } from './flowrider-prompt-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides before it
// matches, so re-flowing a paragraph reds nothing that is still true. The size assertion reads real
// bytes instead, because bytes are what the MCP layer weighs.
const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = flowriderPromptStatics.prompt.template;

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

describe('flowriderPromptStatics', () => {
  // THE SERVER SUBSTITUTES THE OPERATION CONTEXT AT `$ARGUMENTS`, and everything this session knows
  // about its own package slice arrives there. A second slot would split that context in two, and a
  // slot that is not last buries the ledger under instructions the session has already read.
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
      '### 2. Dispatch ONE `flowrider-planner-minion`',
      '### 3. Read the document back',
      '### 4. Run the phases',
      '### 5. Dispatch ONE FINAL `flowrider-reviewer-minion`',
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
  // the three minions, and the one signal. Anything a future edit slips in here — a build, a ward, a
  // `git commit`, a `discover` — reds this test rather than quietly widening the role.
  it('VALID: served template => keeps the ALLOWED list to exactly those six entries', () => {
    expect(ALLOWED_ENTRIES).toStrictEqual([
      'Write on .quest-plans/<operationItemId>-round-<n>.md ← step 1 ONLY, to create it',
      'cat >> .quest-plans/<operationItemId>-round-<n>.md ← every later write to it, always with >>',
      'Read on .quest-plans/<operationItemId>-round-<n>.md ← step 3, that ONE path and no other',
      'git status ← step 6, the sweep, and nowhere else',
      'Agent(flowrider-planner-minion | flowrider-worker-minion | flowrider-reviewer-minion)',
      'signal-back ← step 7, once, and it ends your turn',
    ]);
  });

  // THIS OPERATOR RUNS NO BUILD AND NO WARD — its REVIEWER does, and `git status` is the only git verb
  // it holds. `push` is NOT its either, which is the thing a reader coming from the shared round
  // protocol gets wrong: the reviewer commits the round AND publishes it. The dev-server line is this
  // discipline's own: every test on this round drives real routes from Jest in process, so a session
  // that went looking for a server to start would be starting one nothing on the round needs.
  it('VALID: served template => forbids the build, the ward, source reads and every git verb but status', () => {
    expect({
      noSource: hasIn({
        needle: 'Read / Edit / Write on any path but the round document ← you never see source.',
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
      noServerNoBrowser: hasIn({
        needle:
          'starting a dev server, a browser or Playwright ← nothing on this round runs any of the three',
        text: FORBIDDEN,
      }),
      // THE HARDEST LINE ON THIS PROMPT TO GET RIGHT: the checklist measures flowrider's OWN track,
      // so refusing it reads as a mistake. A session that fetched it would hold a REMAINING count it
      // cannot act on, because it may not open a test file to see whether that count is honest —
      // every minion fetches it first-hand instead, narrowed to this slice.
      noQaChecklist: hasIn({
        needle: 'get-qa-checklist ← your planner, your workers and your reviewer each fetch it',
        text: FORBIDDEN,
      }),
    }).toStrictEqual({
      noSource: true,
      noBuild: true,
      noWard: true,
      noGitHistory: true,
      noCommitAndNoPush: true,
      noServerNoBrowser: true,
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

  // A WAVE IS THE ONLY THING TWO `Agent` CALLS IN ONE MESSAGE ARE FOR, and the PLAN decides which
  // chunks share one. A wave the operator grouped itself has had its collision check made by nobody —
  // the planner is the session that opened the files and said those chunks are safe together.
  it('VALID: served template => dispatches a WAVE in one message and lets the plan pick the waves', () => {
    expect({
      oneMessagePerWave: hasIn({
        needle:
          "**Every chunk on one wave's line goes out in a SINGLE assistant message, one `Agent` call each**",
        text: TEMPLATE,
      }),
      neverGroupsThemItself: hasIn({
        needle: 'the plan itself — you never group chunks yourself',
        text: TEMPLATE,
      }),
      neverTwoWavesAtOnce: hasIn({
        needle:
          '**Never put two waves in one message, and never a planner or a reviewer beside anything else.**',
        text: TEMPLATE,
      }),
      phaseGateClosesEachPhase: hasIn({
        needle:
          "**When a phase's last wave has returned, dispatch ONE `flowrider-reviewer-minion`**",
        text: TEMPLATE,
      }),
      // On this discipline an empty plan has TWO honest causes, and the second is the one a session
      // would otherwise read as a planner failure: the slice had no unit left waiting at all.
      emptyPlanIsRealPlan: hasIn({
        needle:
          '**`PHASES: none` and `WAVES: none` are a real plan, not an error.** Either the work was already proved on disk, or this slice had no unit left waiting.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      oneMessagePerWave: true,
      neverGroupsThemItself: true,
      neverTwoWavesAtOnce: true,
      phaseGateClosesEachPhase: true,
      emptyPlanIsRealPlan: true,
    });
  });

  // ONLY THE REVIEWER'S `NEXT:` LINE DECIDES THE ROUND. A worker's `rework` is a claim about its own
  // chunk and moves the script forward; the reviewer is the session that settles it, because it read
  // every worker return AND opened the files. Pinned as the four routing rows plus the two signal
  // rows, because a routing table that treated a worker's `rework` as a verdict would restart the
  // round mid-wave and lose every chunk still out.
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
    }).toStrictEqual({
      continueGoesOn: true,
      reworkGoesOn: true,
      wallStopsDispatching: true,
      missingLineIsRework: true,
      reviewerContinueIsDone: true,
      reviewerReworkIsAnotherRound: true,
      noRoundCap: true,
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
    }).toStrictEqual({
      notFromRework: true,
      secondRefusal: true,
      secondEmptyPlan: true,
      theFileSettlesIt: true,
    });
  });

  // FIVE PROTOCOL BLOCKS ARE INTERPOLATED AND TWO ARE WITHHELD. Flowrider reads the two indexes off
  // the document and never a plan block or a chunk field, so `planBlocks` and `chunkFields` are
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

  // FLOWRIDER IS ONE OF THE THREE ROLES THE SIGN-OFF COMPLETION GATE BINDS, so `signal-back` rebuilds
  // TWO records before it saves anything — and the sign-off row is the commonest refusal on this
  // role. Its implementation sibling deletes that row because product code signs no track; a
  // single-record version here would leave the refusal a session actually meets unexplained.
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
          "| every unit in your slice still waiting for this track's sign-off | your REVIEWER, every round |",
        text: TEMPLATE,
      }),
      reviewerWritesBoth: hasIn({
        needle: '**Your reviewer writes both records. Nothing else does, and you cannot.**',
        text: TEMPLATE,
      }),
      finalReviewerSigns: hasIn({
        needle:
          "That reviewer is the only session that wards the whole round, writes this track's sign-offs, and records its standing concerns.",
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

  // THE `RESOURCE`/`RESET` CONTRACT TABLE IS GONE, and it must not come back. Both fields read "none"
  // on this discipline — every test on this round drives real routes, queues and a file system
  // straight from Jest, so nothing long-running exists to own and nothing goes stale between waves.
  // The two field names are pinned ABSENT so the empty structure cannot be restored as boilerplate.
  it('VALID: served template => replaces the empty RESOURCE/RESET table with one sentence', () => {
    expect({
      theSentence: hasIn({
        needle:
          '**You never add anything to that ALLOWED list.** Every test on this round is an integration test run under Jest — a harness brings up whatever it drives and tears it down again — so nobody starts a long-running server, and the browser belongs to another role. There is no reset command either',
        text: TEMPLATE,
      }),
      resourceField: hasIn({ needle: 'RESOURCE', text: TEMPLATE }),
      resetField: hasIn({ needle: 'RESET', text: TEMPLATE }),
    }).toStrictEqual({ theSentence: true, resourceField: false, resetField: false });
  });

  // THE IDS IN `## Context` ARE WHAT NARROW EVERY MINION'S OWN CHECKLIST FETCH TO THIS SLICE. A
  // paraphrased Operation Context is therefore not a shorter copy but a WIDER denominator: each
  // minion's `get-qa-checklist` comes back scoped to something other than the work this item owns.
  it('VALID: served template => makes the verbatim Operation Context the thing that scopes the round', () => {
    expect({
      wordForWord: hasIn({
        needle:
          '**Reproduce the WHOLE Operation Context word for word — no paraphrase, no summary.**',
        text: TEMPLATE,
      }),
      theIdsScopeTheFetch: hasIn({
        needle:
          "the ids on its first lines are what narrows each minion's own `get-qa-checklist` fetch to your slice",
        text: TEMPLATE,
      }),
      minionsGetNothingElse: hasIn({
        needle:
          "A minion's own `get-agent-prompt` fetch hands back its method and the Quest ID and nothing more",
        text: TEMPLATE,
      }),
    }).toStrictEqual({ wordForWord: true, theIdsScopeTheFetch: true, minionsGetNothingElse: true });
  });
});
