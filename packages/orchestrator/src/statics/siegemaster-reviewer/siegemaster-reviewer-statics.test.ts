import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';
import { standardsReviewConcernsStatics } from '../standards-review-concerns/standards-review-concerns-statics';

import { siegemasterReviewerStatics } from './siegemaster-reviewer-statics';

const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = siegemasterReviewerStatics.prompt.template;

describe('siegemasterReviewerStatics', () => {
  it('VALID: served template => carries exactly one $ARGUMENTS slot, and it is last', () => {
    expect({
      count: TEMPLATE.split('$ARGUMENTS').length - 1,
      atTheEnd: TEMPLATE.trimEnd().endsWith('$ARGUMENTS'),
      underItsOwnHeading: hasIn({ needle: '## The quest id\n\n$ARGUMENTS', text: TEMPLATE }),
      placeholder: siegemasterReviewerStatics.prompt.placeholders.arguments,
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

  it('VALID: served template => names its seven workflow steps in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^### \d+\. .+$/gmu), (match) => match[0])).toStrictEqual([
      '### 1. Load the standards',
      '### 2. Read the quest and the units',
      '### 3. Find out what changed',
      '### 4. Open every file the fixers changed',
      '### 5. Ward',
      '### 6. Commit and push',
      '### 7. Return',
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

  // ONE WARD, AND IT IS THIS SESSION'S ALONE — every sibling on the pass runs a ward scoped to its
  // own paths, so a `--uncommitted` run before this one has read the repairs grades what nobody read.
  it('VALID: served template => wards once, scoped to --uncommitted, after it has read everything', () => {
    expect({
      scopeRule: hasIn({
        needle:
          "**[WARD SCOPE] `npm run ward -- --uncommitted` is yours, once, after you have read everything.** Nobody else on the pass runs it. You run no bare `npm run ward`; that is the dispatcher's.",
        text: TEMPLATE,
      }),
      neverWidensASubAgentsRun: hasIn({
        needle:
          "You never widen a sub-agent's scoped run into a `--uncommitted` of your own before you have read its work.",
        text: TEMPLATE,
      }),
      lineFenced: hasIn({ needle: '```bash\nnpm run ward -- --uncommitted\n```', text: TEMPLATE }),
      onceAfterReading: hasIn({
        needle: 'Run it once, in the foreground, after you have read everything.',
        text: TEMPLATE,
      }),
      twiceAtMost: hasIn({
        needle: '**Fix reds, then run it once more. Twice at most.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      scopeRule: true,
      neverWidensASubAgentsRun: true,
      lineFenced: true,
      onceAfterReading: true,
      twiceAtMost: true,
    });
  });

  // `--uncommitted` GRADES THE WHOLE TREE, AND A ROUND'S OWN EVIDENCE IS IN IT. A verifier and a
  // stress tester each leave failing tests behind on purpose, uncommitted, as proof a defect is real.
  // This reviewer meets them as reds. Without a rule naming them, the cheapest way it has to clear one
  // is to loosen the assertion — which is the symptom-hiding shape this role exists to catch, applied
  // to the record of the defect itself.
  it('VALID: served template => refuses to clear a red its brief named as a round’s evidence', () => {
    expect({
      briefCarriesTheList: hasIn({
        needle:
          'It carries a **`RED TESTS:`** block too — every test path a round has already turned into a failing test.',
        text: TEMPLATE,
      }),
      redIsNotItsToClear: hasIn({
        needle:
          "**A test named on your brief's `RED TESTS:` block is EVIDENCE, and its red is not yours to clear.**",
        text: TEMPLATE,
      }),
      stillRedIsRework: hasIn({
        needle:
          'One that is STILL red means the repair never landed: report it as `NEXT: rework` naming the DEFECT, and attempt no repair on the test.',
        text: TEMPLATE,
      }),
      neverGreenByTouchingTheTest: hasIn({
        needle: '**Never turn one green by touching the test**',
        text: TEMPLATE,
      }),
      everyOtherRedStaysItsOwn: hasIn({
        needle: 'Every red on any other file is yours under the rule below.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      briefCarriesTheList: true,
      redIsNotItsToClear: true,
      stillRedIsRework: true,
      neverGreenByTouchingTheTest: true,
      everyOtherRedStaysItsOwn: true,
    });
  });

  // A ROUND THAT FIXED NOTHING STILL LEAVES A TREE. Its guide, its per-verifier round records and its
  // per-stress-tester plan files are markdown, so `--uncommitted` resolves to 0 source files and ward
  // exits 0. Read as green, that is a pass reported over a run that graded nothing.
  it('VALID: served template => reports a 0-file ward scope as empty rather than green', () => {
    expect(
      hasIn({
        needle:
          '**A ward reporting that the file scope resolved to 0 source files is EMPTY, not green.** Nothing was staged for it to grade. A pass that produced only round records and plan files lands there, because they are markdown. Report it as `WARD: empty — 0 files`, never as green.',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // A CLEAN ROUND STILL REACHES THIS REVIEWER, because its parent gates step 8 on a dirty tree rather
  // than on a fixer having run. Every one of step 4's questions is about a repair, so a pass with no
  // repair needs an exit that is not silence.
  it('VALID: served template => carries an exit for a pass on which no fixer ran', () => {
    expect(
      hasIn({
        needle:
          '**No fixer ran on this pass?** Then there is no repair to judge. Write `no repairs` on `CAUSES:` and go on to step 5 — what the rounds produced still has to be warded and committed, and that is why you were dispatched.',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // ITS SUBJECT IS A SET OF REPAIRS, NOT A PASS — so the enumeration this reviewer names is "your
  // scope", where its siblings say "the pass".
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
        TEMPLATE.indexOf('### 6. Commit and push'),
    }).toStrictEqual({ enumerateFirst: true, doThisBeforeCommitting: true, order: true });
  });

  it('VALID: served template => commits with git add -A, then pushes bare', () => {
    expect({
      addAll: hasIn({ needle: 'git add -A', text: TEMPLATE }),
      barePush: /^git push$/mu.exec(TEMPLATE) !== null,
    }).toStrictEqual({ addAll: true, barePush: true });
  });

  // THIS REVIEWER GRADES A REPAIR, WHICH IS NOT THE SAME QUESTION AS EITHER SIBLING'S — so its return
  // carries `CAUSES`, `REDS`, `RIPPLES` and `SPEC` in place of the sibling-specific fields.
  it('VALID: served template => returns exactly these eleven fields, in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^([A-Z]+):/gmu), (match) => match[1])).toStrictEqual([
      'VERDICT',
      'READ',
      'CAUSES',
      'REDS',
      'RIPPLES',
      'SPEC',
      'FIXES',
      'FINDINGS',
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

  // A DEAD DEV SERVER IS NOT THIS ROLE'S WALL — its parent owns the server and can restart it, so
  // that failure is a `rework`, never a `wall`.
  it("VALID: served template => refuses a dead dev server as this reviewer's own wall", () => {
    expect(
      hasIn({
        needle:
          '**`wall`** — the environment blocks every session of every role. A dead dev server is NOT a wall;\nyour parent owns it and can restart it.',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // THIS REVIEWER TAKES THE STANDING CONCERNS ONLY — it reads repairs as code, and never re-drives
  // the system a fresh walker already proved the fix against.
  it('VALID: served template => carries the standing concerns and withholds the evidence contract', () => {
    expect({
      standards: hasIn({ needle: standardsReviewConcernsStatics.markdown, text: TEMPLATE }),
      judging: hasIn({ needle: flowEvidenceContractStatics.judgingMarkdown, text: TEMPLATE }),
      authoring: hasIn({ needle: flowEvidenceContractStatics.authoringMarkdown, text: TEMPLATE }),
    }).toStrictEqual({ standards: true, judging: false, authoring: false });
  });

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
