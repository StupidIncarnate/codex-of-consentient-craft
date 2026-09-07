import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';
import { standardsReviewConcernsStatics } from '../standards-review-concerns/standards-review-concerns-statics';

import { siegemasterPromptStatics } from './siegemaster-prompt-statics';

const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = siegemasterPromptStatics.prompt.template;

describe('siegemasterPromptStatics', () => {
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
      '### 8. Run your reviewer — only if a fixer changed code',
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
  // the reviewer's `NEXT:` line moves the operator on. Step 8 runs at all only when a fixer changed
  // code: a reviewer reads CODE, and a flow whose every round came back clean leaves it nothing to
  // open, nothing to build against and nothing to commit.
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

  it("VALID: served template => reads a sub-agent's return and treats a missing NEXT: line as rework", () => {
    expect({
      pass: hasIn({
        needle:
          '| `pass` | from a verifier or a stress tester: it reached the exit. **Read its `NOTED:` line — anything but `none` goes to step 5 before you move to the next round.** From a fixer: move on. |',
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
  // The reviewer's single `--uncommitted` sweep is the one wide run on the pass. The lane sentence is
  // pinned beside them because it is the one measurement the old build ban carried that still holds:
  // whatever a fixer compiles under a LIVE lane moves what that round is measuring.
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
        needle: 'ward on your own paths only · no --uncommitted · no bare ward · no commit',
        text: TEMPLATE,
      }),
      buildUnderALiveLane: hasIn({
        needle:
          'A build under a live lane changes what that round is measuring, and it reads the difference back as a\ndefect.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      scopedRun: true,
      namesWhyOwnPathsOnly: true,
      neverWidens: true,
      buildUnderALiveLane: true,
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
  // left behind, and no name is ever reused.
  it('VALID: served template => allocates two bare lane NAMES per round and starts neither itself', () => {
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
          'the verifier and the stress tester each start their own lane from the name you gave them, drive it, and leave it to close itself. Nobody kills a lane.',
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
