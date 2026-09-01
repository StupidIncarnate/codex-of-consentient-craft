import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';
import { standardsReviewConcernsStatics } from '../standards-review-concerns/standards-review-concerns-statics';

import { codeweaverPromptStatics } from './codeweaver-prompt-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides before it
// matches, so re-flowing a paragraph reds nothing that is still true. The size assertion reads real
// bytes instead, because bytes are what the MCP layer weighs.
const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = codeweaverPromptStatics.prompt.template;

describe('codeweaverPromptStatics', () => {
  // THE SERVER SUBSTITUTES THE OPERATION CONTEXT AT `$ARGUMENTS`. A second slot would split that
  // context in two, and a slot that is not last buries it under instructions already read.
  it('VALID: served template => carries exactly one $ARGUMENTS slot, and it is last', () => {
    expect({
      count: TEMPLATE.split('$ARGUMENTS').length - 1,
      atTheEnd: TEMPLATE.trimEnd().endsWith('$ARGUMENTS'),
      underItsOwnHeading: hasIn({ needle: '## Operation Context\n\n$ARGUMENTS', text: TEMPLATE }),
      placeholder: codeweaverPromptStatics.prompt.placeholders.arguments,
    }).toStrictEqual({
      count: 1,
      atTheEnd: true,
      underItsOwnHeading: true,
      placeholder: '$ARGUMENTS',
    });
  });

  // OVER `maxVerbatimChars` THE MCP LAYER SPILLS THE RESULT TO A FILE and hands the agent an error
  // stub. This template has no interpolation left to resolve, so the served text IS this literal.
  it('VALID: served template => fits the MCP verbatim ceiling in bytes', () => {
    expect(Buffer.byteLength(TEMPLATE, 'utf8')).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  // THE HEADING LIST IS THE SHAPE OF THE ROLE. Pinning the LINES rather than the count is what
  // catches a section silently deleted or renamed.
  it('VALID: served template => names its nine top-level sections in document order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^## .+$/gmu), (match) => match[0])).toStrictEqual([
      '## The words this page uses',
      '## What you do, and what you never do',
      '## Operating rules',
      '## Your tools',
      '## The script',
      "## Reading a sub-agent's return",
      '## Briefing a sub-agent',
      '## Recording what you claim',
      '## Operation Context',
    ]);
  });

  // THE SCRIPT IS THE WHOLE OF WHAT THIS SESSION DOES. A step that changed which action it dispatches would still read as a valid nine-step script if only the count were
  // pinned, so the exact wording of each numbered heading is pinned instead.
  it('VALID: served template => names its nine script steps in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^### \d+\. .+$/gmu), (match) => match[0])).toStrictEqual([
      '### 1. Fetch your flow',
      '### 2. Explore the package',
      '### 3. Write your map',
      '### 4. Send the changes out',
      '### 5. Read what changed',
      '### 6. Run your reviewer',
      '### 7. Pass, or go round again',
      '### 8. Record what you claim, and what you found',
      '### 9. Signal',
    ]);
  });

  // THIS OPERATOR RUNS NO BUILD AND NO WARD — its REVIEWER does. Both commands are named in the
  // FORBIDDEN half of the tools table, right after the heading that opens it.
  it('VALID: served template => lists npm run build and npm run ward under NOT YOURS', () => {
    expect(
      hasIn({
        needle:
          'NOT YOURS Edit / Write on any path but your map sub-agents write code, not you ScheduleWakeup / ListAgents / any timer the notification IS the wake, see [HELPERS] npm run build see [BUILD] npm run ward, in every form see [BUILD]',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // ONLY THE REVIEWER'S `NEXT:` LINE DECIDES THE PASS. Pinned as the exact three-row table so a
  // fourth value slipping in, or one of the three being dropped, reds this test.
  it("VALID: served template => routes the reviewer's NEXT: line through exactly pass, rework and wall", () => {
    expect({
      pass: hasIn({
        needle:
          '| `pass` | go to step 8, and copy its `FINDINGS:` into your signal — anything it named for someone else survives nowhere else |',
        text: TEMPLATE,
      }),
      rework: hasIn({
        needle: '| `rework` | go back to step 4 and send out exactly what it named |',
        text: TEMPLATE,
      }),
      wall: hasIn({ needle: '| `wall` | go to step 8 and signal `blocked` |', text: TEMPLATE }),
      noCap: hasIn({
        needle: '**There is no cap. Keep going until your reviewer says `pass`.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ pass: true, rework: true, wall: true, noCap: true });
  });

  // A SUB-AGENT'S OWN `rework` IS A CLAIM ABOUT ITS OWN CHANGE, NOT A VERDICT ON THE PASS — so this
  // table routes it back into step 4 rather than ending anything, and a missing line reads as rework.
  it("VALID: served template => reads a sub-agent's return and treats a missing NEXT: line as rework", () => {
    expect({
      pass: hasIn({ needle: '| `pass` | move on |', text: TEMPLATE }),
      rework: hasIn({
        needle:
          '| `rework` | it could not finish. Read what it says is left, and send that out again. |',
        text: TEMPLATE,
      }),
      wall: hasIn({
        needle:
          '| `wall` | stop sending work out. Let anything already running finish, then go to step 8. |',
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

  // A CELL IS ONE PACKAGE, AND CODE TWO PACKAGES NEED BELONGS IN NEITHER OF THEM. Left unsaid, a
  // session reaches for the two moves that compile — copying the behaviour in, or importing across a
  // dependency edge the manifest does not have — so all three moves are named with their verdicts.
  it('VALID: served template => routes cross-package code through a shared home rather than a copy or a reach', () => {
    expect({
      copy: hasIn({
        needle:
          '| copy it into your package | no. The two copies drift, and your reviewer reports it as duplication. |',
        text: TEMPLATE,
      }),
      importAcross: hasIn({
        needle:
          "| import it from the sibling | only where your package's `package.json` already depends on that package. |",
        text: TEMPLATE,
      }),
      move: hasIn({
        needle:
          '| move it into a package both can call, then point both sides at the new home | yes |',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ copy: true, importAcross: true, move: true });
  });

  // ONE CALL, NOT TWO. The second `{ questId, packageName }` call existed only to reach a contract
  // no flow-scoped render showed; `questFlowSliceTransformer` now renders those under their own
  // heading, so a prompt still asking for two calls spends a whole tool result re-fetching what the
  // first one already returned. Pinned as the EXACT fenced block, because a session copies it.
  it('VALID: served template => step 1 spells out exactly ONE get-quest call', () => {
    const fenced =
      "get-quest({ questId: 'QUEST_ID', flowId: '<your flow>', packageName: '<your package>' })";

    expect({
      theCall: hasIn({ needle: fenced, text: TEMPLATE }),
      callCount: TEMPLATE.split('get-quest({ questId').length - 1,
      saysOne: hasIn({ needle: 'ONE call:', text: TEMPLATE }),
    }).toStrictEqual({ theCall: true, callCount: 2, saysOne: true });
  });

  // A CONTRACT IS THE ONE PART OF A CELL NO OBSERVABLE MENTIONS, so a missing one breaks no test the
  // session runs and ships as a hole. Step 5 is where the diff is read, which is the only point the
  // session can still send work back out.
  it('VALID: served template => step 5 checks every contract landed and dispatches for any that did not', () => {
    expect({
      asksTheQuestion: hasIn({ needle: '2. **Is EVERY contract there?**', text: TEMPLATE }),
      dispatchesForMisses: hasIn({
        needle: '**Anything missing goes straight back out as a sub-agent brief.**',
        text: TEMPLATE,
      }),
      namesTheOrphans: hasIn({
        needle: 'The contracts under `NO flow of yours anchors` are the ones to check hardest',
        text: TEMPLATE,
      }),
      countUpdated: hasIn({ needle: 'Four questions, and only you can ask them', text: TEMPLATE }),
    }).toStrictEqual({
      asksTheQuestion: true,
      dispatchesForMisses: true,
      namesTheOrphans: true,
      countUpdated: true,
    });
  });

  // THE SHARED PACKAGE'S NAME CANNOT BE WRITTEN DOWN HERE — every repo picks its own (`shared`,
  // `shared-core`, `shared-ui`), so the prompt sends the session to `get-project-map` and has it
  // match on the `[library]` KIND, which is the one property every repo's version shares. The
  // replaced-whole warning is what stops a session clearing `packagesAffected` while adding one
  // entry to it.
  it('VALID: served template => finds the shared package by KIND through get-project-map, never by a name of its own', () => {
    expect({
      pointsAtTheTool: hasIn({
        needle: '**`get-project-map` names the candidates.**',
        text: TEMPLATE,
      }),
      matchesOnKind: hasIn({
        needle:
          'Every repo calls that package something different —\n`shared`, `shared-core`, `shared-ui` — so look for the KIND rather than the name: a package the map\nlabels `[library]` is one every other package may depend on.',
        text: TEMPLATE,
      }),
      whenTheRepoHasNone: hasIn({
        needle:
          '**A repo with no library package at all leaves you the second row of that table**, not the third',
        text: TEMPLATE,
      }),
      replacedWholeTrap: hasIn({
        needle:
          '**It is REPLACED WHOLE on write.** Send back every entry already\nthere plus your new one, or the write drops the rest.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      pointsAtTheTool: true,
      matchesOnKind: true,
      whenTheRepoHasNone: true,
      replacedWholeTrap: true,
    });
  });

  // THE MANIFEST EDIT IS THE HALF OF A MOVE NOTHING WOULD REPORT MISSING. The root `node_modules`
  // resolves a sibling package whether or not the importing one declares it, so the pass stays green
  // and the package breaks when it is installed alone.
  it('VALID: served template => makes the moving session add the package.json dependency the move needs', () => {
    expect(
      hasIn({
        needle:
          "**Put the dependency in your package's `package.json` where it is not already there.** The\n  workspace's root `node_modules` resolves the import without it, so nothing you run turns red and\n  the package breaks the day it is installed on its own.",
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // SIBLING CELLS COMMIT AS THEY FINISH AND THE LIBRARY TIER RUNS FIRST, so the helper this cell is
  // about to brief may already be on the branch. Reading the branch before planning is what turns
  // that into a reuse instead of a second copy.
  it('VALID: served template => reads what the earlier cells committed before it plans', () => {
    expect({
      commands: hasIn({
        needle: 'git log --oneline -n 20\ngit log --name-only -n 10',
        text: TEMPLATE,
      }),
      why: hasIn({
        needle:
          'The ledger runs the library packages first and every cell commits as it finishes, so a helper yours\nneeds may already be on this branch',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ commands: true, why: true });
  });

  // A BRIEF THAT LEAVES SOMETHING OUT PRODUCES A CHANGE THAT LEAVES IT OUT TOO, so the dispatch
  // shape — the exact type and model — is pinned rather than left to a session's judgement.
  it('VALID: served template => dispatches a sub-agent with subagent_type general-purpose and model sonnet', () => {
    expect(
      hasIn({
        needle: 'Dispatch with `subagent_type: "general-purpose"` and `model: "sonnet"`.',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // THE REVIEWER'S BRIEF NAMES ITS OWN PROMPT AND CARRIES NO `workItemId` — a sub-agent holding this
  // session's work item id could signal on it and complete the work early.
  it('VALID: served template => briefs the reviewer via get-agent-prompt naming codeweaver-reviewer with no workItemId', () => {
    expect({
      fetchLine: hasIn({
        needle:
          "Call get-agent-prompt({ agent: 'codeweaver-reviewer', questId: 'QUEST_ID' }) FIRST, then follow what it returns exactly.",
        text: TEMPLATE,
      }),
      neverAddYours: hasIn({
        needle:
          '**That fetch carries no `workItemId`. Never add yours.** A sub-agent holding your work item id could\nsignal on it and complete your work while you are still running.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ fetchLine: true, neverAddYours: true });
  });

  // THE ORCHESTRATOR OWNS THE LEDGER; THIS SESSION ONLY REPORTS AN OUTCOME ON IT — `operationStatus`
  // is what carries that outcome on the one `signal-back` call this role ever makes.
  it('VALID: served template => signals complete carrying operationStatus done or blocked', () => {
    expect({
      done: hasIn({
        needle:
          "signal-back({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'done' })",
        text: TEMPLATE,
      }),
      blocked: hasIn({
        needle: "operationStatus: 'blocked', blockedReason:",
        text: TEMPLATE,
      }),
    }).toStrictEqual({ done: true, blocked: true });
  });

  // THIS ROLE READS CODE AND JUDGES A DIFF; IT NEITHER GRADES A TEST SUITE NOR THE STANDING
  // CONCERNS. Neither shared reviewer block belongs here — only `codeweaver-reviewer` takes one.
  it('VALID: served template => carries none of the three shared reviewer/authoring blocks', () => {
    expect({
      judging: hasIn({ needle: flowEvidenceContractStatics.judgingMarkdown, text: TEMPLATE }),
      authoring: hasIn({ needle: flowEvidenceContractStatics.authoringMarkdown, text: TEMPLATE }),
      standards: hasIn({ needle: standardsReviewConcernsStatics.markdown, text: TEMPLATE }),
    }).toStrictEqual({ judging: false, authoring: false, standards: false });
  });

  // THE ROUND PROTOCOL IS GONE FROM THIS ROLE. This operator scripts its own steps directly rather
  // than dispatching a planner/worker/reviewer trio over a shared round document, so none of that
  // vocabulary — nor a sibling operation-owning role's name — belongs in its text.
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
