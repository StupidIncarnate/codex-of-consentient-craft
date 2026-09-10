import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';
import { standardsReviewConcernsStatics } from '../standards-review-concerns/standards-review-concerns-statics';

import { siegemasterPromptStatics } from './siegemaster-prompt-statics';

const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = siegemasterPromptStatics.prompt.template;

// THE FENCED FIXER BRIEF IS THE ONLY PART A FIXER EVER READS — the operator copies it into an
// `Agent` call and everything around it stays in the operator's own context. So a needle found
// anywhere in the whole prompt proves nothing about what the fixer was told, and every rule a fixer
// has to obey is asserted against this slice instead. This page holds several fences — the tools
// table, the guide brief, the verifier, the stress tester and the reviewer — and `\nSYMPTOM\n` heads
// exactly one of them.
const FIXER_BRIEF_START = TEMPLATE.indexOf('\nSYMPTOM\n');
const FIXER_BRIEF = TEMPLATE.slice(FIXER_BRIEF_START, TEMPLATE.indexOf('\n```', FIXER_BRIEF_START));

describe('siegemasterPromptStatics', () => {
  it('VALID: fixer brief slice => anchors on the one fence that starts with SYMPTOM', () => {
    expect({
      anchorOccurrences: TEMPLATE.split('\nSYMPTOM\n').length - 1,
      startsWithTheAnchor: FIXER_BRIEF.startsWith('\nSYMPTOM\n'),
      endsOnTheReturnBlock: FIXER_BRIEF.trimEnd().endsWith(
        'NEXT:     pass | rework — <what is left> | wall — <what a person must change>',
      ),
      holdsNoOtherBriefsFetchLine: FIXER_BRIEF.includes('get-agent-prompt'),
    }).toStrictEqual({
      anchorOccurrences: 1,
      startsWithTheAnchor: true,
      endsOnTheReturnBlock: true,
      holdsNoOtherBriefsFetchLine: false,
    });
  });

  it('VALID: served template => carries exactly one $ARGUMENTS slot, and it is last', () => {
    expect({
      count: TEMPLATE.split('$ARGUMENTS').length - 1,
      atTheEnd: TEMPLATE.trimEnd().endsWith('$ARGUMENTS'),
      underItsOwnHeading: hasIn({ needle: '## Operation Context\n\n$ARGUMENTS', text: TEMPLATE }),
      placeholder: siegemasterPromptStatics.prompt.placeholders.arguments,
    }).toStrictEqual({
      count: 1,
      atTheEnd: true,
      underItsOwnHeading: true,
      placeholder: '$ARGUMENTS',
    });
  });

  it('VALID: served template => fits the MCP verbatim ceiling in bytes', () => {
    expect(Buffer.byteLength(TEMPLATE, 'utf8')).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  it('VALID: served template => names its twelve top-level sections in document order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^## .+$/gmu), (match) => match[0])).toStrictEqual([
      '## The words this page uses',
      '## What you do, and what you never do',
      '## Operating rules',
      '## Your tools',
      '## The script',
      "## Reading a sub-agent's return",
      '## Briefing the verifier',
      '## Briefing the stress tester',
      '## Briefing a fixer',
      '## Briefing your reviewer',
      '## Recording a spec change',
      '## Operation Context',
    ]);
  });

  // THE LOOP IS ROUND, THEN FIX, THEN RE-VERIFY — step 4 dispatches one round per path walk, in
  // order; steps 5 to 7 are the fix-and-reverify convergence that follows it, and every round that
  // had an issue coming back clean is what leaves that convergence. Pinning the wording catches a
  // step silently reordered.
  it('VALID: served template => names its ten script steps in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^### \d+\. .+$/gmu), (match) => match[0])).toStrictEqual([
      '### 1. Fetch your flow, and the list of what you owe a verdict on',
      '### 2. Order your path walks',
      '### 3. Build the guide, then allocate your off-map families',
      '### 4. Send the pair for this path walk',
      '### 5. Send fixers for what every round found',
      '### 6. Read what the fixers changed',
      '### 7. Verifiers re-walk the paths that had issues',
      '### 8. Run your reviewer',
      '### 9. Record what you claim, and what you found',
      '### 10. Signal',
    ]);
  });

  it('VALID: served template => lists the reviewer sweep and the bare ward under NOT YOURS', () => {
    expect(
      hasIn({
        needle:
          'NOT YOURS Edit / Write on any path fixers write code, not you driving anything — a browser, curl, a CLI walkers drive, not you ScheduleWakeup / ListAgents / any timer the notification IS the wake, see [HELPERS] npm run ward -- --uncommitted see [WARD SCOPE] npm run ward (bare) see [WARD SCOPE]',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // THIS OPERATOR'S ROUTING TABLE IS THE REVIEWER'S, INSIDE STEP 8 — the fix-and-reverify convergence
  // that repeats is steps 5 to 7, ended only by every issue-carrying round coming back clean, and only
  // the reviewer's `NEXT:` line moves the operator on. Step 8 is gated on a DIRTY TREE rather than on
  // a fixer having run: a round writes the guide, a record per verifier, a plan per stress tester and
  // a failing test per defect, and the reviewer is the only session on the pass that wards or commits.
  it("VALID: served template => routes the reviewer's NEXT: line through exactly pass, rework and wall", () => {
    expect({
      pass: hasIn({ needle: '| `pass` | go to step 9 |', text: TEMPLATE }),
      rework: hasIn({
        needle: '| `rework` | go back to step 5 and send out exactly what it named |',
        text: TEMPLATE,
      }),
      wall: hasIn({
        needle: '| `wall` | go to step 9, then signal `blocked` at step 10 |',
        text: TEMPLATE,
      }),
      noCap: hasIn({
        needle: '**There is no cap on this loop.** Keep walking until the flow is clean.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ pass: true, rework: true, wall: true, noCap: true });
  });

  // THE REVIEWER IS THE ONLY SESSION ON THE PASS THAT WARDS OR COMMITS, so the gate in front of it
  // decides whether the pass is graded at all. A round leaves files behind whatever it finds — the
  // guide, a record per verifier, a plan per stress tester, a failing test per defect — so gating on
  // "did a fixer run" sends a clean pass to a sweep, and a sweep runs no ward.
  it('VALID: served template => gates step 8 on a dirty tree, not on whether a fixer ran', () => {
    expect({
      gateIsGitStatus: hasIn({
        needle: '**`git status` first, and anything it lists means the reviewer runs.**',
        text: TEMPLATE,
      }),
      namesWhatARoundLeaves: hasIn({
        needle:
          "the guide, one round record per verifier, one plan file per stress tester, and one failing test for every defect a minion's sub-agents recorded",
        text: TEMPLATE,
      }),
      sweepRunsNoWard: hasIn({
        needle: 'sends it to a sweep, which runs no ward at all',
        text: TEMPLATE,
      }),
      cleanTreeIsTheOnlySkip: hasIn({
        needle:
          '**A clean `git status` is the one case that skips this step**, because nothing was produced: go to step 9.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      gateIsGitStatus: true,
      namesWhatARoundLeaves: true,
      sweepRunsNoWard: true,
      cleanTreeIsTheOnlySkip: true,
    });
  });

  // A MINION RETURNS THREE LINES AND WRITES EVERYTHING ELSE TO A FILE, because the parent's context is
  // the scarcest thing in this design. So the two things this operator needs off a round — the symptom
  // block a fixer brief quotes, and the list of failing tests its reviewer must not weaken — are read
  // from `.quest-plans/` and forwarded, never recalled from a return.
  it('VALID: served template => takes a round’s record from its file and forwards its red tests', () => {
    expect({
      recordsAreFiles: hasIn({
        needle: '**The records you brief from are FILES, not returns.**',
        text: TEMPLATE,
      }),
      readsThemFromQuestPlans: hasIn({
        needle: '`ls .quest-plans/` and `Read` the ones this pass wrote.',
        text: TEMPLATE,
      }),
      reviewerBriefCarriesRedTests: hasIn({
        needle:
          'RED TESTS:\n  <every path your rounds reported on a RED TESTS: or TESTS: line, one per line, or "none">',
        text: TEMPLATE,
      }),
      andSaysWhyItMatters: hasIn({
        needle: '**`RED TESTS:` is what stops your reviewer weakening your own evidence.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      recordsAreFiles: true,
      readsThemFromQuestPlans: true,
      reviewerBriefCarriesRedTests: true,
      andSaysWhyItMatters: true,
    });
  });

  it("VALID: served template => reads a sub-agent's return and treats a missing NEXT: line as rework", () => {
    expect({
      pass: hasIn({
        needle:
          "| `pass` | from a verifier or a stress tester: it reached the exit. **Read its `RED TESTS:` line — a stress tester calls the same line `TESTS:`. Every path on it is a defect that minion's sub-agents already turned into a failing test, and every one of them goes to step 5.** From a fixer: move on. |",
        text: TEMPLATE,
      }),
      rework: hasIn({
        needle:
          '| `rework` | from a verifier or a stress tester, it found issues — it still goes to step 5 with everything else this round found. From a fixer, it could not finish. |',
        text: TEMPLATE,
      }),
      wall: hasIn({
        needle:
          '| `wall` | stop sending work out. Let anything running finish, then go to step 9, and signal `blocked` at step 10 — never `done`. |',
        text: TEMPLATE,
      }),
      missingLine: hasIn({
        needle: '| nothing starting `NEXT:` | treat it as `rework`, and say so when you signal |',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ pass: true, rework: true, wall: true, missingLine: true });
  });

  // SCOPE IS THE WHOLE RULE. Ward picks its check types off the paths it is handed, so a fixer passes
  // its own paths and nothing else — `--uncommitted` grades the whole working tree and a bare run
  // grades the repo, and either one from a pair of concurrent fixers grades work that is not theirs.
  // The reviewer's single `--uncommitted` sweep is the one wide run on the pass. The lane sentences
  // are pinned beside them for a reason of their own: whatever a fixer compiles under a LIVE lane
  // moves what that round is measuring, and the rule itself belongs to the buildDiscipline snippet,
  // so this prompt has to keep POINTING there rather than answering the question a second way.
  it("VALID: served template => scopes a fixer's own ward run to its own paths and keeps a live lane out of it", () => {
    expect({
      scopedRun: hasIn({
        needle: "npm run ward -- -- <this brief's own paths>",
        text: TEMPLATE,
      }),
      namesWhyOwnPathsOnly: hasIn({
        needle:
          'Each sub-agent you dispatch runs ward on its own files and\nnothing wider: `npm run ward -- -- <its own paths>`',
        text: TEMPLATE,
      }),
      neverWidens: hasIn({
        needle:
          '**YOUR OWN PATHS AND NOTHING WIDER. NEVER --uncommitted. NEVER a bare ward. NEVER commit.**',
        text: TEMPLATE,
      }),
      buildUnderALiveLane: hasIn({
        needle:
          'A build under a live lane changes what that round is measuring, and the round reads\nthe difference back as a defect.',
        text: TEMPLATE,
      }),
      routesTheBuildRuleToItsOwner: hasIn({
        needle:
          'Nobody on this pass runs a build either, and the `<dungeonmaster-buildDiscipline>` snippet is where\nthat rule lives.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      scopedRun: true,
      namesWhyOwnPathsOnly: true,
      neverWidens: true,
      buildUnderALiveLane: true,
      routesTheBuildRuleToItsOwner: true,
    });
  });

  // A FIXER HOLDS THE `run-ward` MCP TOOL ITSELF, and reaches for it before the Bash line its brief
  // names. Measured on the codeweaver track, whose brief carried the same gap: five of ten
  // sub-agents called that tool with `{}`, got a zod dump naming three missing fields, and spent a
  // turn recovering. The operator-facing sentence explaining why the fence refuses it lives OUTSIDE
  // the fence, where no fixer reads it — which is why every needle below is matched against the
  // fenced slice, and a whole-prompt match would go green over a brief that says nothing.
  it('VALID: fixer brief => names the exact ward command and refuses the run-ward MCP tool inside the fence', () => {
    expect({
      exactCommand: hasIn({
        needle:
          "Run this EXACT command to verify your work: `npm run ward -- -- <this brief's own paths>` — two separate `--` tokens, both needed.",
        text: FIXER_BRIEF,
      }),
      refusesTheMcpTool: hasIn({
        needle:
          '**NEVER the run-ward MCP tool.** Different command: it grades the whole branch, and it wants a quest id and a work item id you were not given. Reaching for it spends a turn on a validation error. Run the Bash line above.',
        text: FIXER_BRIEF,
      }),
      underThePROVEHeading:
        FIXER_BRIEF.indexOf('NEVER the run-ward MCP tool') > FIXER_BRIEF.indexOf('\nPROVE\n'),
      ownPathsLineKept: hasIn({
        needle:
          '**YOUR OWN PATHS AND NOTHING WIDER. NEVER --uncommitted. NEVER a bare ward. NEVER commit.**',
        text: FIXER_BRIEF,
      }),
      discoveryMismatchIsNotAFailure: hasIn({
        needle:
          'DISCOVERY MISMATCH on a check type = ward answering, not failing. --passWithNoTests is never the fix.',
        text: FIXER_BRIEF,
      }),
      operatorSentenceOutsideTheFence: hasIn({
        needle:
          '**Your fixer holds the `run-ward` MCP tool too, and reaches for it before the Bash line**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      exactCommand: true,
      refusesTheMcpTool: true,
      underThePROVEHeading: true,
      ownPathsLineKept: true,
      discoveryMismatchIsNotAFailure: true,
      operatorSentenceOutsideTheFence: true,
    });
  });

  // THE BRIEF IS A BEST GUESS AND THE FIXER HAS THE CODE OPEN — this operator briefs from what a
  // round MEASURED, never from reading the files, so a route it named can simply be the wrong one.
  // The permission to follow the evidence is paired with the duty to declare it in the same block:
  // on the audited codeweaver pass a sub-agent swapped a status comparison for a guard matching a
  // wider set, shipped a real defect, and mentioned the swap in a footnote under `NEXT: pass`. This
  // operator's reviewer exists to catch exactly that shape, so the deviation goes on the RETURN
  // block — `DEVIATED:`, beside CAUSE / RED / REACHES / NEXT — rather than into prose. The rule
  // blocks are carved out by name, or "evidence wins" reads as licence to loosen an assertion.
  it('VALID: fixer brief => lets hard evidence beat a handed direction and forces the deviation onto the return', () => {
    expect({
      directionsAreAGuess: hasIn({
        needle:
          'LOOK AT and the cause it implies are my BEST GUESS. I briefed this from what a round measured across the file set that proves this flow; you have the code open and I do not.',
        text: FIXER_BRIEF,
      }),
      evidenceWins: hasIn({
        needle:
          'Find HARD EVIDENCE against one of them — the cause is in another file, that route is not the one that runs — and follow the evidence, not the direction.',
        text: FIXER_BRIEF,
      }),
      andIsReported: hasIn({
        needle:
          'Then put it on the DEVIATED line below. A deviation that shows up only in the change is a silent behaviour change: the reviewer behind you is there to catch a fix that hid a symptom, and it cannot see one you never declared.',
        text: FIXER_BRIEF,
      }),
      rulesAreNotGuesses: hasIn({
        needle:
          'FIX, RED FIRST, DO NOT TOUCH and PROVE below are rules, not guesses. Evidence never moves those.',
        text: FIXER_BRIEF,
      }),
      returnCarriesIt: hasIn({
        needle:
          'DEVIATED: <every direction of mine the evidence beat, what the evidence was, and what I did instead — or "none">',
        text: FIXER_BRIEF,
      }),
      onTheReturnBlockNotInProse:
        FIXER_BRIEF.indexOf('DEVIATED: <every direction of mine') >
        FIXER_BRIEF.indexOf('\nRETURN\n'),
    }).toStrictEqual({
      directionsAreAGuess: true,
      evidenceWins: true,
      andIsReported: true,
      rulesAreNotGuesses: true,
      returnCarriesIt: true,
      onTheReturnBlockNotInProse: true,
    });
  });

  // WHEN TO SEND A SEARCH OUT IS THE ONE THING THE SNIPPET CANNOT SAY. The
  // `<dungeonmaster-searchStrategy>` snippet reaches every session and every sub-agent with the shape
  // an answer comes back in, so this page states the decision instead and never the shape — a second
  // copy of the shape is the drift the snippet exists to remove. Measured on the flowrider track, whose
  // prompt carried the same gap: an explorer dispatched to map an e2e setup built 103,000 tokens of
  // context and returned one config file quoted whole, paying three times for what one `Read` pays for
  // once. The clause sits in the operator's own boundaries section, above the script, so it governs
  // every step of it; the fenced-slice assertion is what proves it was not handed down a level.
  it('VALID: served template => gives the OPERATOR the when-to-delegate rule, and no fixer reads it', () => {
    expect({
      largeSearchSmallAnswer: hasIn({
        needle: '**You send a search out only when the SEARCH is large and the ANSWER is small.**',
        text: TEMPLATE,
      }),
      readItYourselfWhenYouKnowTheFile: hasIn({
        needle:
          'A file you can already name is a `Read`; an explorer fetching it is that `Read` with two extra hops and triple the tokens.',
        text: TEMPLATE,
      }),
      theBriefIsJustTheQuestion: hasIn({
        needle:
          '**The brief is the question and nothing else** — every sub-agent starts with the `<dungeonmaster-searchStrategy>` snippet, which already tells it what to hand back.',
        text: TEMPLATE,
      }),
      theSubjectIsTheOperator: hasIn({
        needle:
          "**This lever is the OPERATOR's and no minion's**: a verifier's and a stress tester's own sub-agents are the last level there is, a fixer dispatches nothing at all",
        text: TEMPLATE,
      }),
      restatesNoReturnShape: hasIn({ needle: 'NOTHING FOUND', text: TEMPLATE }),
      neverReachesTheFixer: hasIn({
        needle: 'SEARCH is large and the ANSWER is small',
        text: FIXER_BRIEF,
      }),
    }).toStrictEqual({
      largeSearchSmallAnswer: true,
      readItYourselfWhenYouKnowTheFile: true,
      theBriefIsJustTheQuestion: true,
      theSubjectIsTheOperator: true,
      restatesNoReturnShape: false,
      neverReachesTheFixer: false,
    });
  });

  // A CLAUSE ABOUT EXPLORING IS EXACTLY WHAT REOPENS DEPTH. `siegemaster-verifier` and
  // `siegemaster-stress` each carry a `[DEPTH STOPS AT TWO]` rule over the same measurement — one fixer
  // that let its own sub-agent go looking spawned ten `Explore` grandchildren and burned roughly 4.5
  // million context tokens proving a single fix — and this operator sits at the top of that chain. What
  // holds the chain closed from HERE is that the dispatch roster is a closed four and the fenced fixer
  // brief licenses no dispatch at all: no `Agent` call, no `subagent_type`, nothing sent exploring.
  // Both held before the when-to-delegate clause landed and have to keep holding after it.
  it('VALID: served template => keeps the dispatch roster closed and licenses no dispatch inside the fixer brief', () => {
    expect({
      closedRoster: hasIn({
        needle: 'Agent(...) verifiers, stress testers, fixers, your reviewer',
        text: TEMPLATE,
      }),
      fixerGetsNoAgentCall: FIXER_BRIEF.includes('Agent('),
      fixerGetsNoSubagentType: FIXER_BRIEF.includes('subagent_type'),
      fixerIsNeverSentExploring: /explor/iu.test(FIXER_BRIEF),
      fixerDelegatesNothing: /delegat/iu.test(FIXER_BRIEF),
    }).toStrictEqual({
      closedRoster: true,
      fixerGetsNoAgentCall: false,
      fixerGetsNoSubagentType: false,
      fixerIsNeverSentExploring: false,
      fixerDelegatesNothing: false,
    });
  });

  // ALL DISPATCHED SUB-AGENTS SHARE ONE DISPATCH SHAPE, so the verifier, the stress tester, the fixer
  // and the reviewer each carry the same `subagent_type`/`model` pair rather than four independent
  // claims.
  it('VALID: served template => dispatches every sub-agent with subagent_type general-purpose and model sonnet', () => {
    expect(
      hasIn({
        needle: 'Dispatch with `subagent_type: "general-purpose"` and `model: "sonnet"`',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  it('VALID: served template => briefs the verifier and the stress tester via get-agent-prompt with no workItemId', () => {
    expect({
      verifierFetch: hasIn({
        needle:
          "Call get-agent-prompt({ agent: 'siegemaster-verifier', questId: 'QUEST_ID' }) FIRST, then follow what it returns exactly.",
        text: TEMPLATE,
      }),
      stressFetch: hasIn({
        needle:
          "Call get-agent-prompt({ agent: 'siegemaster-stress', questId: 'QUEST_ID' }) FIRST, then follow what it returns exactly.",
        text: TEMPLATE,
      }),
      neverAddYours: hasIn({
        needle: '**That fetch carries no `workItemId`. Never add yours.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ verifierFetch: true, stressFetch: true, neverAddYours: true });
  });

  it('VALID: served template => briefs the reviewer via get-agent-prompt naming siegemaster-reviewer with no workItemId', () => {
    expect(
      hasIn({
        needle:
          "Call get-agent-prompt({ agent: 'siegemaster-reviewer', questId: 'QUEST_ID' }) FIRST, then follow what it returns exactly.",
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  it('VALID: served template => signals complete carrying operationStatus done or blocked', () => {
    expect({
      done: hasIn({
        needle:
          "signal-back({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'done' })",
        text: TEMPLATE,
      }),
      blocked: hasIn({ needle: "operationStatus: 'blocked', blockedReason:", text: TEMPLATE }),
    }).toStrictEqual({ done: true, blocked: true });
  });

  // EACH ROUND RUNS IN TWO LANES OF ITS OWN, AND WHAT THIS OPERATOR ALLOCATES IS A NAME — the
  // driver takes a bare token and builds `tmp/siege/<name>/` around it, so a directory-shaped
  // string points a minion at a directory nothing will ever create. The operator starts neither
  // lane: each minion starts the one it was named, so no round measures state a previous round
  // left behind, and no name is ever reused. Each minion CLOSES its own too, with the driver's own
  // `end`; a KILL stays banned for everyone, because the driver spawns its servers and browser
  // detached and only that shutdown reaches them.
  it('VALID: served template => allocates two bare lane NAMES per round, starts neither, and has each minion close its own', () => {
    expect({
      noSingleOwnership: hasIn({ needle: 'You own the dev server, and only you.', text: TEMPLATE }),
      freshLanePerRound: hasIn({
        needle: 'Allocate this round TWO lane NAMES before you brief either one',
        text: TEMPLATE,
      }),
      aNameIsNotAPath: hasIn({
        needle: '**A name is a bare token, never a path.**',
        text: TEMPLATE,
      }),
      minionStartsItsOwn: hasIn({
        needle:
          "the verifier and the stress tester each start their own lane from the name you gave\nthem, drive it, and close it themselves with the driver's own `end` command once their round is\nrecorded. Nobody KILLS a lane, and nobody closes one they did not start.",
        text: TEMPLATE,
      }),
      neverReuseALane: hasIn({
        needle:
          "A lane reused across rounds is a fresh round measuring a previous round's leftover state.",
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      noSingleOwnership: false,
      freshLanePerRound: true,
      aNameIsNotAPath: true,
      minionStartsItsOwn: true,
      neverReuseALane: true,
    });
  });

  // A DEAD LANE IS THE MINION'S TO REPLACE, NOT THE OPERATOR'S AND NOT A WALL — and the record has
  // to carry the restart, because units measured either side of one are not comparable.
  it('VALID: served template => routes a dead lane to the minion that started it, never to a wall', () => {
    expect({
      willNotStart: hasIn({
        needle: '**A lane that will not start is NOT a wall.**',
        text: TEMPLATE,
      }),
      diesMidRound: hasIn({
        needle:
          'A lane that dies mid-round is not a wall either — the minion that started it starts a fresh one under a new name, never you, and its record says where in the walk that happened, because nothing it measured before that restart is comparable with what it measured after.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ willNotStart: true, diesMidRound: true });
  });

  // THIS PROMPT TAKES NEITHER SHARED REVIEWER BLOCK NOR THE EVIDENCE CONTRACT — it walks a live
  // system by hand rather than grading a test suite or product code.
  it('VALID: served template => carries none of the three shared reviewer/authoring blocks', () => {
    expect({
      judging: hasIn({ needle: flowEvidenceContractStatics.judgingMarkdown, text: TEMPLATE }),
      authoring: hasIn({ needle: flowEvidenceContractStatics.authoringMarkdown, text: TEMPLATE }),
      standards: hasIn({ needle: standardsReviewConcernsStatics.markdown, text: TEMPLATE }),
    }).toStrictEqual({ judging: false, authoring: false, standards: false });
  });

  it('VALID: served template => carries no round-protocol or sibling-role vocabulary', () => {
    expect({
      roundDocument: hasIn({ needle: 'round document', text: TEMPLATE }),
      plannerMinion: hasIn({ needle: 'planner-minion', text: TEMPLATE }),
      workerMinion: hasIn({ needle: 'worker-minion', text: TEMPLATE }),
      groundstomper: hasIn({ needle: 'groundstomper', text: TEMPLATE }),
      pesteater: hasIn({ needle: 'pesteater', text: TEMPLATE }),
      blightLedger: hasIn({ needle: 'blightLedger', text: TEMPLATE }),
      getBlightChecklist: hasIn({ needle: 'get-blight-checklist', text: TEMPLATE }),
      getPlannerInformation: hasIn({ needle: 'get-planner-information', text: TEMPLATE }),
      getWorkerInformation: hasIn({ needle: 'get-worker-information', text: TEMPLATE }),
      getReviewerInformation: hasIn({ needle: 'get-reviewer-information', text: TEMPLATE }),
      phases: hasIn({ needle: 'PHASES', text: TEMPLATE }),
      waves: hasIn({ needle: 'WAVES', text: TEMPLATE }),
    }).toStrictEqual({
      roundDocument: false,
      plannerMinion: false,
      workerMinion: false,
      groundstomper: false,
      pesteater: false,
      blightLedger: false,
      getBlightChecklist: false,
      getPlannerInformation: false,
      getWorkerInformation: false,
      getReviewerInformation: false,
      phases: false,
      waves: false,
    });
  });
});
