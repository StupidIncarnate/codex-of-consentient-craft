import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';
import { standardsReviewConcernsStatics } from '../standards-review-concerns/standards-review-concerns-statics';

import { flowriderReviewerStatics } from './flowrider-reviewer-statics';

const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = flowriderReviewerStatics.prompt.template;

describe('flowriderReviewerStatics', () => {
  it('VALID: served template => carries exactly one $ARGUMENTS slot, and it is last', () => {
    expect({
      count: TEMPLATE.split('$ARGUMENTS').length - 1,
      atTheEnd: TEMPLATE.trimEnd().endsWith('$ARGUMENTS'),
      underItsOwnHeading: hasIn({ needle: '## The quest id\n\n$ARGUMENTS', text: TEMPLATE }),
      placeholder: flowriderReviewerStatics.prompt.placeholders.arguments,
    }).toStrictEqual({
      count: 1,
      atTheEnd: true,
      underItsOwnHeading: true,
      placeholder: '$ARGUMENTS',
    });
  });

  // MEASURED WITH BOTH SHARED BLOCKS ALREADY INTERPOLATED — the largest of the three reviewer
  // prompts, so it is the one to measure first after an edit to either shared block.
  it('VALID: served template => fits the MCP verbatim ceiling in bytes', () => {
    expect(Buffer.byteLength(TEMPLATE, 'utf8')).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  // TWO SHARED BLOCKS INTERPOLATE HERE, and `judgingMarkdown` alone opens THREE `##` headings of its
  // own — landing inside step 4, ahead of `standardsReviewConcernsStatics`'s one, ahead of step 5.
  // Each is a section this file never writes itself; a rename inside either shared block reds this.
  it('VALID: served template => names its nine top-level sections in document order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^## .+$/gmu), (match) => match[0])).toStrictEqual([
      '## What you were given',
      '## Rules',
      '## Workflow',
      '## The Evidence Contract — what makes an observable COVERED',
      '## Known false greens — reject on sight',
      '## Verdicts — a unit carries one sign-off per track, and there are three',
      '## The five standing concerns',
      '## On a sweep brief',
      '## The quest id',
    ]);
  });

  it('VALID: served template => names its eight workflow steps in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^### \d+\. .+$/gmu), (match) => match[0])).toStrictEqual([
      '### 1. Load the standards',
      '### 2. Read the quest and the units',
      '### 3. Find out what changed',
      '### 4. Open every test the work produced, and judge whether it bites',
      '### 5. Take the standing concerns on the same files',
      '### 6. Build, then ward',
      '### 7. Commit and push',
      '### 8. Return',
    ]);
  });

  it('VALID: served template => never calls signal-back, and the parent signals instead', () => {
    expect(
      hasIn({
        needle: '**You never call `signal-back`.** Your parent signals, once, after you return.',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  it('VALID: served template => builds then wards, in that order, twice at most', () => {
    expect({
      order: TEMPLATE.indexOf('npm run build') < TEMPLATE.indexOf('npm run ward -- --staged'),
      pairFenced: hasIn({ needle: 'npm run build\nnpm run ward -- --staged', text: TEMPLATE }),
      twiceAtMost: hasIn({ needle: 'twice at most', text: TEMPLATE }),
    }).toStrictEqual({ order: true, pairFenced: true, twiceAtMost: true });
  });

  it('VALID: served template => enumerates what changed before it commits anything', () => {
    expect({
      enumerateFirst: hasIn({
        needle: 'Commit first and both come back empty, and you would review nothing at all',
        text: TEMPLATE,
      }),
      doThisBeforeCommitting: hasIn({
        needle: 'Run both BEFORE you commit anything',
        text: TEMPLATE,
      }),
      order:
        TEMPLATE.indexOf('### 3. Find out what changed') <
        TEMPLATE.indexOf('### 7. Commit and push'),
    }).toStrictEqual({ enumerateFirst: true, doThisBeforeCommitting: true, order: true });
  });

  it('VALID: served template => commits with git add -A, then pushes bare', () => {
    expect({
      addAll: hasIn({ needle: 'git add -A', text: TEMPLATE }),
      barePush: /^git push$/mu.exec(TEMPLATE) !== null,
    }).toStrictEqual({ addAll: true, barePush: true });
  });

  // THIS REVIEWER GRADES ONE THING ITS SIBLINGS DO NOT — WHETHER A TEST BITES — so its return carries
  // `BITES` and `UNCOVERED` on top of the shared fields the other two reviewers also return.
  it('VALID: served template => returns exactly these ten fields, in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^([A-Z]+):/gmu), (match) => match[1])).toStrictEqual([
      'VERDICT',
      'READ',
      'BITES',
      'UNCOVERED',
      'FIXES',
      'FINDINGS',
      'BUILD',
      'WARD',
      'COMMIT',
      'NEXT',
    ]);
  });

  it('VALID: served template => ends its return on a NEXT: line carrying exactly pass, rework and wall', () => {
    expect(
      hasIn({
        needle:
          'NEXT:      pass | rework — <what is not done> | wall — <what a person must change>',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // THIS REVIEWER TAKES BOTH HALVES OF THE SHARED SURFACE ITS FAMILY OWNS: the judging half of the
  // evidence contract (never the authoring half — that is the flowrider PROMPT's) AND the standing
  // concerns every reviewer takes.
  it('VALID: served template => carries the judging evidence contract and the standing concerns, and withholds authoring', () => {
    expect({
      judging: hasIn({ needle: flowEvidenceContractStatics.judgingMarkdown, text: TEMPLATE }),
      standards: hasIn({ needle: standardsReviewConcernsStatics.markdown, text: TEMPLATE }),
      authoring: hasIn({ needle: flowEvidenceContractStatics.authoringMarkdown, text: TEMPLATE }),
    }).toStrictEqual({ judging: true, standards: true, authoring: false });
  });

  // `workItemId` IS PRESENT HERE, UNLIKE THE OTHER THREE MINION PROMPTS — the judging half of the
  // evidence contract this reviewer takes describes a sign-off's own SHAPE,
  // `{ verdict, evidence, question?, workItemId, at }`, naming a field on the OBJECT it grades rather
  // than telling this session to pass one anywhere. That field name arrives by identity as part of
  // `judgingMarkdown`; this reviewer's own fetch and return still carry none of its own.
  it("VALID: served template => carries workItemId only as the sign-off contract's own field name", () => {
    expect(
      hasIn({ needle: '`{ verdict, evidence, question?, workItemId, at }`', text: TEMPLATE }),
    ).toBe(true);
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
