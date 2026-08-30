import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';
import { standardsReviewConcernsStatics } from '../standards-review-concerns/standards-review-concerns-statics';

import { flowriderPromptStatics } from './flowrider-prompt-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides before it
// matches, so re-flowing a paragraph reds nothing that is still true.
const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = flowriderPromptStatics.prompt.template;

describe('flowriderPromptStatics', () => {
  it('VALID: served template => carries exactly one $ARGUMENTS slot, and it is last', () => {
    expect({
      count: TEMPLATE.split('$ARGUMENTS').length - 1,
      atTheEnd: TEMPLATE.trimEnd().endsWith('$ARGUMENTS'),
      underItsOwnHeading: hasIn({ needle: '## Operation Context\n\n$ARGUMENTS', text: TEMPLATE }),
      placeholder: flowriderPromptStatics.prompt.placeholders.arguments,
    }).toStrictEqual({
      count: 1,
      atTheEnd: true,
      underItsOwnHeading: true,
      placeholder: '$ARGUMENTS',
    });
  });

  // MEASURED WITH `authoringMarkdown` ALREADY INTERPOLATED — the served template carries no further
  // substitution, so `TEMPLATE` here IS the resolved text the MCP layer weighs.
  it('VALID: served template => fits the MCP verbatim ceiling in bytes', () => {
    expect(Buffer.byteLength(TEMPLATE, 'utf8')).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  // `authoringMarkdown` OPENS WITH ITS OWN `##` HEADING, so the interpolation adds one section to
  // this list that the source file itself never writes — a rename inside the shared block reds this
  // test exactly as a rename inside this file would.
  it('VALID: served template => names its twelve top-level sections in document order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^## .+$/gmu), (match) => match[0])).toStrictEqual([
      '## The words this page uses',
      '## What you do, and what you never do',
      '## Operating rules',
      '## Your tools',
      '## The script',
      '## Modality — chosen per OBSERVABLE, never per flow',
      '## Proving something in the browser',
      '## Proving something below the browser',
      "## Reading a sub-agent's return",
      '## Briefing a sub-agent',
      '## Recording what you claim',
      '## Operation Context',
    ]);
  });

  it('VALID: served template => names its ten script steps in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^### \d+\. .+$/gmu), (match) => match[0])).toStrictEqual([
      '### 1. Fetch your flow',
      '### 2. Get the full list of units',
      '### 3. Read the implementation, and choose a layer per unit',
      '### 4. Write your map',
      '### 5. Send the tests out',
      '### 6. Read what was written',
      '### 7. Run your reviewer',
      '### 8. Pass, or go round again',
      '### 9. Record what you claim, and what you found',
      '### 10. Signal',
    ]);
  });

  it('VALID: served template => lists npm run build and npm run ward under NOT YOURS', () => {
    expect(
      hasIn({
        needle:
          'NOT YOURS Edit / Write on any path but your map sub-agents write tests, not you ScheduleWakeup / ListAgents / any timer the notification IS the wake, see [HELPERS] npm run build see [BUILD] npm run ward, in every form see [BUILD]',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  it("VALID: served template => routes the reviewer's NEXT: line through exactly pass, rework and wall", () => {
    expect({
      pass: hasIn({ needle: '| `pass` | go to step 9 |', text: TEMPLATE }),
      rework: hasIn({
        needle:
          '| `rework` | go back to step 5 and send out exactly what it named. **Any unit it named that you already signed: overwrite that sign-off from the new `PROVED` line, or clear it with `flowriderSignoff: null`.** A `confirmed` your reviewer just rejected is the one thing that must not survive the loop. |',
        text: TEMPLATE,
      }),
      wall: hasIn({ needle: '| `wall` | go to step 9 and signal `blocked` |', text: TEMPLATE }),
      noCap: hasIn({
        needle: '**There is no cap. Keep going until your reviewer says `pass`.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ pass: true, rework: true, wall: true, noCap: true });
  });

  it("VALID: served template => reads a sub-agent's return and treats a missing NEXT: line as rework", () => {
    expect({
      pass: hasIn({ needle: '| `pass` | move on |', text: TEMPLATE }),
      rework: hasIn({
        needle: '| `rework` | it could not finish. Read what is left, and send that out again. |',
        text: TEMPLATE,
      }),
      wall: hasIn({
        needle:
          '| `wall` | stop sending work out. Let anything running finish, then go to step 9. |',
        text: TEMPLATE,
      }),
      missingLine: hasIn({
        needle: '| nothing starting `NEXT:` | treat it as `rework`, and say so when you signal |',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ pass: true, rework: true, wall: true, missingLine: true });
  });

  // A WAVE OF SUB-AGENTS RUNNING WARD AT ONCE COLLIDES ON THE SHARED `dist/` IF ANY OF THEM
  // TYPECHECKS — ward's typecheck is `tsc -b`, a build. Scoping to `lint,test` keeps that out; the
  // reviewer's `--staged` run is where typecheck happens, once, after every sub-agent has finished.
  it("VALID: served template => scopes a sub-agent's own ward run to lint,test and forbids it from building", () => {
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
      neverRunWardMcpTool: hasIn({
        needle: 'no run-ward MCP tool',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      scopedRun: true,
      namesWhyLintTestOnly: true,
      neverBuild: true,
      neverRunWardMcpTool: true,
    });
  });

  it('VALID: served template => dispatches a sub-agent with subagent_type general-purpose and model sonnet', () => {
    expect(
      hasIn({
        needle: 'Dispatch with `subagent_type: "general-purpose"` and `model: "sonnet"`.',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  it('VALID: served template => briefs the reviewer via get-agent-prompt naming flowrider-reviewer with no workItemId', () => {
    expect({
      fetchLine: hasIn({
        needle:
          "Call get-agent-prompt({ agent: 'flowrider-reviewer', questId: 'QUEST_ID' }) FIRST, then follow what it returns exactly.",
        text: TEMPLATE,
      }),
      neverAddYours: hasIn({
        needle:
          '**That fetch carries no `workItemId`. Never add yours.** A sub-agent holding your work item id could\nsignal on it and complete your work while you are still running.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ fetchLine: true, neverAddYours: true });
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

  // THIS PROMPT TAKES THE AUTHORING HALF OF THE EVIDENCE CONTRACT — it chooses the layer per unit and
  // briefs sub-agents against that choice — and NEITHER the judging half (that is its reviewer's) NOR
  // the standing concerns (also its reviewer's, never the author's).
  it('VALID: served template => carries the authoring evidence contract and withholds judging and standards', () => {
    expect({
      authoring: hasIn({ needle: flowEvidenceContractStatics.authoringMarkdown, text: TEMPLATE }),
      judging: hasIn({ needle: flowEvidenceContractStatics.judgingMarkdown, text: TEMPLATE }),
      standards: hasIn({ needle: standardsReviewConcernsStatics.markdown, text: TEMPLATE }),
    }).toStrictEqual({ authoring: true, judging: false, standards: false });
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
