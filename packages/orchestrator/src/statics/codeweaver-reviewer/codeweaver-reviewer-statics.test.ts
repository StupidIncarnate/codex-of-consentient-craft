import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';
import { standardsReviewConcernsStatics } from '../standards-review-concerns/standards-review-concerns-statics';

import { codeweaverReviewerStatics } from './codeweaver-reviewer-statics';

const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = codeweaverReviewerStatics.prompt.template;

describe('codeweaverReviewerStatics', () => {
  it('VALID: served template => carries exactly one $ARGUMENTS slot, and it is last', () => {
    expect({
      count: TEMPLATE.split('$ARGUMENTS').length - 1,
      atTheEnd: TEMPLATE.trimEnd().endsWith('$ARGUMENTS'),
      underItsOwnHeading: hasIn({ needle: '## The quest id\n\n$ARGUMENTS', text: TEMPLATE }),
      placeholder: codeweaverReviewerStatics.prompt.placeholders.arguments,
    }).toStrictEqual({
      count: 1,
      atTheEnd: true,
      underItsOwnHeading: true,
      placeholder: '$ARGUMENTS',
    });
  });

  // MEASURED WITH `standardsReviewConcernsStatics.markdown` ALREADY INTERPOLATED — `TEMPLATE` here IS
  // the resolved text the MCP layer weighs.
  it('VALID: served template => fits the MCP verbatim ceiling in bytes', () => {
    expect(Buffer.byteLength(TEMPLATE, 'utf8')).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  // THE SHARED STANDARDS BLOCK OPENS WITH ITS OWN `##` HEADING, landing between step 4 and step 5 of
  // this file's own workflow — the interpolation adds a section this file never writes itself.
  it('VALID: served template => names its six top-level sections in document order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^## .+$/gmu), (match) => match[0])).toStrictEqual([
      '## What you were given',
      '## Rules',
      '## Workflow',
      '## The five standing concerns',
      '## On a sweep brief',
      '## The quest id',
    ]);
  });

  it('VALID: served template => names its eight workflow steps in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^### \d+\. .+$/gmu), (match) => match[0])).toStrictEqual([
      '### 1. Load the standards',
      '### 2. Read the quest',
      '### 3. Find out what changed',
      '### 4. Open every file the work produced',
      '### 5. Fix what you can',
      '### 6. Build, then ward',
      '### 7. Commit and push',
      '### 8. Return',
    ]);
  });

  // THIS SESSION SIGNALS NOTHING — its parent does, once, after reading its return.
  it('VALID: served template => never calls signal-back, and the parent signals instead', () => {
    expect(
      hasIn({
        needle: '**You never call `signal-back`.** Your parent signals, once, after you return.',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // BUILD THEN WARD, IN THAT ORDER, AND ONLY THIS SESSION RUNS EITHER — `tsc` writes one shared
  // `dist/` per package, so a second builder on the pass would hand every sibling phantom errors.
  it('VALID: served template => builds then wards, in that order, twice at most', () => {
    expect({
      order: TEMPLATE.indexOf('npm run build') < TEMPLATE.indexOf('npm run ward -- --staged'),
      pairFenced: hasIn({ needle: 'npm run build\nnpm run ward -- --staged', text: TEMPLATE }),
      twiceAtMost: hasIn({ needle: 'twice at most', text: TEMPLATE }),
    }).toStrictEqual({ order: true, pairFenced: true, twiceAtMost: true });
  });

  // THE PASS ARRIVES ENTIRELY UNCOMMITTED, so `git status` / `git diff HEAD` plus the untracked
  // files ARE the pass — and that measurement has to happen BEFORE the commit that would empty it.
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

  // ONE COMMIT, THEN A BARE PUSH — no `-u`, and nobody else here touches git at all.
  it('VALID: served template => commits with git add -A, then pushes bare', () => {
    expect({
      addAll: hasIn({ needle: 'git add -A', text: TEMPLATE }),
      barePush: /^git push$/mu.exec(TEMPLATE) !== null,
    }).toStrictEqual({ addAll: true, barePush: true });
  });

  // THE RETURN BLOCK IS A WIRE FORMAT its parent parses by field name — a field renamed or dropped
  // here is a parent reading nothing back for it.
  it('VALID: served template => returns exactly these eight fields, in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^([A-Z]+):/gmu), (match) => match[1])).toStrictEqual([
      'VERDICT',
      'READ',
      'FIXES',
      'FINDINGS',
      'BUILD',
      'WARD',
      'COMMIT',
      'NEXT',
    ]);
  });

  // ONLY THIS `NEXT:` LINE DECIDES THE PASS, and it carries exactly three values.
  it('VALID: served template => ends its return on a NEXT: line carrying exactly pass, rework and wall', () => {
    expect(
      hasIn({
        needle:
          'NEXT:      pass | rework — <what is not done> | wall — <what a person must change>',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // THIS REVIEWER TAKES THE STANDING CONCERNS ONLY — it judges product code built to a spec, never a
  // test suite (that is `flowrider-reviewer`'s judging half) and never a hand-driven repair.
  it('VALID: served template => carries the standing concerns and withholds the evidence contract', () => {
    expect({
      standards: hasIn({ needle: standardsReviewConcernsStatics.markdown, text: TEMPLATE }),
      judging: hasIn({ needle: flowEvidenceContractStatics.judgingMarkdown, text: TEMPLATE }),
      authoring: hasIn({ needle: flowEvidenceContractStatics.authoringMarkdown, text: TEMPLATE }),
    }).toStrictEqual({ standards: true, judging: false, authoring: false });
  });

  // THIS IS A MINION FETCH — no work item of its own, so a `workItemId` never belongs here. A minion
  // carrying one could signal on its parent's work item and complete it early.
  it('VALID: served template => never carries a workItemId', () => {
    expect(hasIn({ needle: 'workItemId', text: TEMPLATE })).toBe(false);
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
