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

  it('VALID: served template => names its eleven top-level sections in document order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^## .+$/gmu), (match) => match[0])).toStrictEqual([
      '## The words this page uses',
      '## What you do, and what you never do',
      '## Operating rules',
      '## Your tools',
      '## The script',
      "## Reading a sub-agent's return",
      '## Briefing a walker',
      '## Briefing a fixer',
      '## Briefing your reviewer',
      '## Recording a spec change',
      '## Operation Context',
    ]);
  });

  // THE LOOP IS WALK, FIX, WALK AGAIN — the numbered script still runs once end to end, and the two
  // dev-server steps (2 and 9) bracket it. Pinning the wording catches a step silently reordered.
  it('VALID: served template => names its eleven script steps in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^### \d+\. .+$/gmu), (match) => match[0])).toStrictEqual([
      '### 1. Fetch your flow, and the list of what you owe a verdict on',
      '### 2. Start the dev server',
      '### 3. Build the walker guide, then decide the walk order',
      '### 4. Send ONE walker',
      '### 5. Send fixers for what it found',
      '### 6. Read what the fixers changed',
      '### 7. Walk again',
      '### 8. Run your reviewer — only if a fixer changed code',
      '### 9. Record what you claim, and what you found',
      '### 10. Stop the dev server',
      '### 11. Signal',
    ]);
  });

  it('VALID: served template => lists npm run build and npm run ward under NOT YOURS', () => {
    expect(
      hasIn({
        needle:
          'NOT YOURS Edit / Write on any path fixers write code, not you driving anything — a browser, curl, a CLI walkers drive, not you ScheduleWakeup / ListAgents / any timer the notification IS the wake, see [HELPERS] npm run build see [BUILD] npm run ward, in every form see [BUILD]',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // THIS OPERATOR'S ROUTING TABLE IS THE REVIEWER'S, INSIDE STEP 8 — the loop that repeats is steps 4
  // to 7, ended only by a clean walk, and only the reviewer's `NEXT:` line moves the operator on.
  // Step 8 runs at all only when a fixer changed code: a reviewer reads CODE, and a flow that walked
  // clean leaves it an empty diff to confirm.
  it("VALID: served template => routes the reviewer's NEXT: line through exactly pass, rework and wall", () => {
    expect({
      pass: hasIn({ needle: '| `pass` | go to step 9 |', text: TEMPLATE }),
      rework: hasIn({
        needle: '| `rework` | go back to step 5 and send out exactly what it named |',
        text: TEMPLATE,
      }),
      wall: hasIn({
        needle: '| `wall` | go to step 9, then signal `blocked` at step 11 |',
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
          '| `pass` | from a walker: it reached the exit. **Read its `NOTED:` line — anything but `none` goes to step 5 before you walk on.** From a fixer: move on. |',
        text: TEMPLATE,
      }),
      rework: hasIn({
        needle:
          '| `rework` | from a walker, it found issues — go to step 5. From a fixer, it could not finish. |',
        text: TEMPLATE,
      }),
      wall: hasIn({
        needle:
          '| `wall` | stop sending work out. Let anything running finish, then go to step 9, and signal `blocked` at step 11 — never `done`. |',
        text: TEMPLATE,
      }),
      missingLine: hasIn({
        needle: '| nothing starting `NEXT:` | treat it as `rework`, and say so when you signal |',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ pass: true, rework: true, wall: true, missingLine: true });
  });

  // A WAVE OF FIXERS RUNNING WARD AT ONCE COLLIDES ON THE SHARED `dist/` IF ANY OF THEM TYPECHECKS —
  // ward's typecheck is `tsc -b`, a build, and a build under the live system changes what the next
  // walker measures. Scoping to `lint,test` keeps typecheck out; the reviewer's `--staged` run is
  // where it happens, once, at the end.
  it("VALID: served template => scopes a fixer's own ward run to lint,test and forbids it from building", () => {
    expect({
      scopedRun: hasIn({
        needle: "npm run ward -- --only lint,test -- <this brief's own paths>",
        text: TEMPLATE,
      }),
      namesWhyLintTestOnly: hasIn({
        needle: '`--only lint,test` keeps typecheck out, and typecheck is the one that builds',
        text: TEMPLATE,
      }),
      neverBuild: hasIn({ needle: 'no npm run build', text: TEMPLATE }),
    }).toStrictEqual({ scopedRun: true, namesWhyLintTestOnly: true, neverBuild: true });
  });

  // ALL THREE SUB-AGENT KINDS SHARE ONE DISPATCH SHAPE, so the walker, the fixer and the reviewer
  // each carry the same `subagent_type`/`model` pair rather than three independent claims.
  it('VALID: served template => dispatches every sub-agent with subagent_type general-purpose and model sonnet', () => {
    expect(
      hasIn({
        needle: 'Dispatch with `subagent_type: "general-purpose"` and `model: "sonnet"`',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  it('VALID: served template => briefs the walker via get-agent-prompt naming siegemaster-walker with no workItemId', () => {
    expect({
      fetchLine: hasIn({
        needle:
          "Call get-agent-prompt({ agent: 'siegemaster-walker', questId: 'QUEST_ID' }) FIRST, then follow what it returns exactly.",
        text: TEMPLATE,
      }),
      neverAddYours: hasIn({
        needle: '**That fetch carries no `workItemId`. Never add yours.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ fetchLine: true, neverAddYours: true });
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

  // THIS ROLE OWNS THE DEV SERVER FOR ITS WHOLE LIFETIME — started once at step 2, stopped once at
  // step 9 — and never lets a walker or a fixer touch it.
  it('VALID: served template => owns the dev server across the whole session, exclusively', () => {
    expect({
      startsOnce: hasIn({ needle: '**You own the dev server, and only you.**', text: TEMPLATE }),
      neverRestart: hasIn({ needle: 'Never restart it mid-session.', text: TEMPLATE }),
      walkerAndFixerLocked: hasIn({
        needle: 'Never let a walker or a fixer touch it.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ startsOnce: true, neverRestart: true, walkerAndFixerLocked: true });
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
