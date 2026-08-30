import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';
import { standardsReviewConcernsStatics } from '../standards-review-concerns/standards-review-concerns-statics';

import { siegemasterWalkerStatics } from './siegemaster-walker-statics';

const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = siegemasterWalkerStatics.prompt.template;

describe('siegemasterWalkerStatics', () => {
  it('VALID: served template => carries exactly one $ARGUMENTS slot, and it is last', () => {
    expect({
      count: TEMPLATE.split('$ARGUMENTS').length - 1,
      atTheEnd: TEMPLATE.trimEnd().endsWith('$ARGUMENTS'),
      underItsOwnHeading: hasIn({ needle: '## The quest id\n\n$ARGUMENTS', text: TEMPLATE }),
      placeholder: siegemasterWalkerStatics.prompt.placeholders.arguments,
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

  it('VALID: served template => names its five top-level sections in document order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^## .+$/gmu), (match) => match[0])).toStrictEqual([
      '## What you were given',
      '## Rules',
      '## Workflow',
      '## What you return',
      '## The quest id',
    ]);
  });

  it('VALID: served template => names its ten workflow steps in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^### \d+\. .+$/gmu), (match) => match[0])).toStrictEqual([
      '### 1. Read the flow',
      '### 2. Read your guide',
      '### 3. Learn the expected values BEFORE you drive',
      '### 4. Load the tools your flow needs',
      '### 5. Reset, then drive',
      '### 6. Two browser traps that look exactly like product bugs',
      '### 7. Record as you drive',
      '### 8. Stop only where you cannot go on',
      '### 9. Sign what you measured',
      '### 10. Close every tab you opened',
    ]);
  });

  // A WALKER IS THE ONE SUB-AGENT PROMPT THAT PROVES A FIX, and it can only do that by making none of
  // its own — a fix a walker made here is a fix nobody else re-drove.
  it('VALID: served template => changes nothing, and never touches the dev server it does not own', () => {
    expect({
      changesNothing: hasIn({
        needle: '**You change nothing.** No code, no test, no config, no fix.',
        text: TEMPLATE,
      }),
      neverStartsOrStops: hasIn({
        needle: '**[THE SERVER IS NOT YOURS] Never start, stop, restart or bounce anything.**',
        text: TEMPLATE,
      }),
      deadServerIsReported: hasIn({
        needle: 'A dead server is something you\nreport, not something you fix.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      changesNothing: true,
      neverStartsOrStops: true,
      deadServerIsReported: true,
    });
  });

  // `BROKEN WOULD SHOW` IS THE WHOLE PROOF — it appears once as the per-unit record field and once
  // more as the rule that field exists to enforce.
  it('VALID: served template => requires a BROKEN WOULD SHOW value on every unit record', () => {
    expect({
      fieldInTheRecordShape: hasIn({
        needle: 'BROKEN WOULD SHOW: <the specific different value a defect would have produced>',
        text: TEMPLATE,
      }),
      namedAsTheWholeProof: hasIn({
        needle: '**`BROKEN WOULD SHOW` is the whole proof.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ fieldInTheRecordShape: true, namedAsTheWholeProof: true });
  });

  // THE RETURN BLOCK IS A WIRE FORMAT its parent parses by field name.
  it('VALID: served template => returns exactly these eight fields, in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^([A-Z]+):/gmu), (match) => match[1])).toStrictEqual([
      'PATH',
      'REACHED',
      'EVIDENCE',
      'BREAKING',
      'NOTED',
      'UNREACHED',
      'PATCHED',
      'NEXT',
    ]);
  });

  it('VALID: served template => ends its return on a NEXT: line carrying exactly pass, rework and wall', () => {
    expect(
      hasIn({
        needle: 'NEXT:      pass | rework — <what is broken> | wall — <what a person must change>',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // THIS ROLE NEVER SIGNALS — it is a minion that returns text inside its parent's turn. `signal-back`
  // is not absent from the text: the rule that forbids it names it explicitly, the same way each of
  // the three reviewer prompts states "You never call `signal-back`." rather than omitting the word.
  it('VALID: served template => states plainly that it calls no signal-back, rather than omitting the word', () => {
    expect(
      hasIn({
        needle:
          '**[TURN END] You return text. You call no `signal-back` and you start no sub-agent.**',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // A WORK ITEM ID REACHES THIS SESSION, AND WHERE IT MAY GO IS THE WHOLE POINT. It writes its own
  // sign-offs, and `signoffContract` requires a `workItemId`, so its parent hands one down in the
  // brief. What must never happen is that id reaching `get-agent-prompt`: `agentPromptGetBroker`
  // throws on a minion that passes one, and `subagentStopNeedsBlockGuard` reads a `get-agent-prompt`
  // invocation carrying one as proof the caller owes a `signal-back` and holds its turn open for a
  // call this session must never make. The guard keys on the tool NAME and on a TOP-LEVEL
  // `input.workItemId`, so an id nested inside a sign-off body is invisible to it — which is exactly
  // why the sign-off use is safe and the fetch use is not.
  it('VALID: served template => uses workItemId only inside a sign-off, never in a get-agent-prompt fetch', () => {
    const fetches = Array.from(TEMPLATE.matchAll(/get-agent-prompt\(\{[^}]*\}\)/gu), (m) => m[0]);

    expect({
      namesItForTheSignoff: hasIn({
        needle: "workItemId: 'WORK ITEM from your brief'",
        text: TEMPLATE,
      }),
      briefLineDeclaresIt: hasIn({ needle: "your parent's work item id", text: TEMPLATE }),
      saysWhereItMayNotGo: hasIn({ needle: 'and nowhere else', text: TEMPLATE }),
      anyFetchCarriesIt: fetches.some((call) => call.includes('workItemId')),
    }).toStrictEqual({
      namesItForTheSignoff: true,
      briefLineDeclaresIt: true,
      saysWhereItMayNotGo: true,
      anyFetchCarriesIt: false,
    });
  });

  // A WALKER DRIVES A LIVE SYSTEM BY HAND — it takes neither the evidence contract (that governs a
  // written test suite) nor the standing concerns (that govern a code review).
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
