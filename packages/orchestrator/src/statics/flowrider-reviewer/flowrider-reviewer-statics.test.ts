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
      "### 4. Judge the tests ONE FILE AT A TIME, and write each file's comment before you open the next",
      '### 5. Take the standing concerns on the same files',
      '### 6. Ward',
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

  // ONE WARD, AND IT IS THIS SESSION'S ALONE — every sibling on the pass runs a ward scoped to its
  // own paths, so a `--uncommitted` run before this one has read the work grades what nobody read.
  it("VALID: served template => wards once, scoped to --uncommitted, and never widens a sub-agent's run", () => {
    expect({
      whoseItIs: hasIn({
        needle:
          "Nobody else on the pass runs it. You run no bare `npm run ward`; that is the dispatcher's.",
        text: TEMPLATE,
      }),
      neverWidensASubAgentsRun: hasIn({
        needle:
          "You never widen a sub-agent's scoped run into a `--uncommitted` of your own before its files carry their comments.",
        text: TEMPLATE,
      }),
      lineFenced: hasIn({ needle: '```bash\nnpm run ward -- --uncommitted\n```', text: TEMPLATE }),
      twiceAtMost: hasIn({
        needle: '**Fix reds, then run it once more. Twice at most.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      whoseItIs: true,
      neverWidensASubAgentsRun: true,
      lineFenced: true,
      twiceAtMost: true,
    });
  });

  // THE READING STEP IS A LOOP, AND THE LOOP'S OUTPUT IS THE ONLY THING THAT MAKES IT FALSIFIABLE. A
  // measured run made about twenty `discover`/`Read` calls back to back and then announced it was
  // running ward — nothing in that transcript separates a reviewer that read twenty files from one
  // that skimmed them, because a single verdict over a batch could have been written without opening
  // any of them.
  it('VALID: served template => judges one test file at a time and comments before opening the next', () => {
    expect({
      stepHeading: hasIn({
        needle:
          "### 4. Judge the tests ONE FILE AT A TIME, and write each file's comment before you open the next",
        text: TEMPLATE,
      }),
      oneFileAtATime: hasIn({
        needle:
          "work that list one file at a time: open ONE file, read every assertion in it, write that file's comment, and only then open the next",
        text: TEMPLATE,
      }),
      neverABatch: hasIn({
        needle: '**Never a run of reads followed by a single verdict.**',
        text: TEMPLATE,
      }),
      emittedBeforeTheNextIsOpened: hasIn({
        needle:
          'emit each one as a text block in your turn, immediately after that file and before the next is opened',
        text: TEMPLATE,
      }),
      oneForEveryFile: hasIn({
        needle:
          'emit one for every file on the list — a clean file still gets its comment, because a missing comment is a file nobody can tell you opened',
        text: TEMPLATE,
      }),
      whyItIsWrittenDown: hasIn({
        needle:
          '**The comment is the only durable evidence that you read the file.** A verdict written after twenty reads describes twenty files at once, and could have been written without opening any of them',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      stepHeading: true,
      oneFileAtATime: true,
      neverABatch: true,
      emittedBeforeTheNextIsOpened: true,
      oneForEveryFile: true,
      whyItIsWrittenDown: true,
    });
  });

  // THE BITE JUDGEMENT RIDES IN THE COMMENT, because that is the one thing this reviewer exists to
  // decide. A per-file comment with no failing value in it is the existence-only citation the
  // evidence contract rejects, wearing a new format.
  it('VALID: served template => the per-file comment carries the bite judgement', () => {
    expect({
      commentNamesThePath: hasIn({
        needle: '#### Comment — <repo-relative path>',
        text: TEMPLATE,
      }),
      acceptsLine: hasIn({
        needle: '- ACCEPTS: yes | no — <the one thing in this file that decides it>',
        text: TEMPLATE,
      }),
      bitesLine: hasIn({
        needle:
          '- BITES: <per assertion: file:line, and the wrong value or state that turns it red>',
        text: TEMPLATE,
      }),
      concernsLine: hasIn({
        needle: '- CONCERNS: <what the five standing concerns found here — or "none">',
        text: TEMPLATE,
      }),
      biteIsTheJob: hasIn({
        needle:
          '**`BITES` is the line this reviewer exists to write.** For every assertion you opened, name the wrong value or state that turns it red.',
        text: TEMPLATE,
      }),
      unnameableIsNotATest: hasIn({
        needle:
          "An assertion you cannot name one for is not a test yet, and the file's `ACCEPTS` is `no`.",
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      commentNamesThePath: true,
      acceptsLine: true,
      bitesLine: true,
      concernsLine: true,
      biteIsTheJob: true,
      unnameableIsNotATest: true,
    });
  });

  // WARD IS GATED ON A CHECKABLE CONDITION, IN BOTH PLACES THAT NAME ONE. "After you have read
  // everything" is a claim the session makes about itself and nothing checks; "every file carries its
  // comment" is a condition its own transcript either shows or does not.
  it('VALID: served template => gates ward on every file carrying its own comment, in both places', () => {
    expect({
      scopeRule: hasIn({
        needle:
          '**[WARD SCOPE] `npm run ward -- --uncommitted` is yours, once, and only once every file on your list carries its own written comment.**',
        text: TEMPLATE,
      }),
      wardStep: hasIn({
        needle:
          'Run it once, in the foreground, and only once every file on your list carries its own written comment.',
        text: TEMPLATE,
      }),
      unfalsifiableClaimIsGone: hasIn({
        needle: 'after you have read everything',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ scopeRule: true, wardStep: true, unfalsifiableClaimIsGone: false });
  });

  // THE STANDING CONCERNS STAY THEIR OWN STEP, but their findings land on the same per-file comment
  // rather than in a sweep of their own — the shared block already prescribes one reading per file.
  it("VALID: served template => the standing concerns land on the file's own comment", () => {
    expect(
      hasIn({
        needle:
          "What they find on a file goes on that file's own comment, in its `CONCERNS:` line, before you open the next one.",
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // A 0-FILE GIT SCOPE RUNS NOTHING AND EXITS 0. `--uncommitted` takes its scope from whatever the
  // tree happens to hold, so a pass whose only changes are the map file resolves to no source files at
  // all. Read as green, that is a pass reported over a run that graded nothing.
  it('VALID: served template => reports a 0-file ward scope as empty rather than green', () => {
    expect(
      hasIn({
        needle:
          '**A ward reporting that the file scope resolved to 0 source files is EMPTY, not green.** Nothing was staged for it to grade. Report it as `WARD: empty — 0 files`, never as green.',
        text: TEMPLATE,
      }),
    ).toBe(true);
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
  it('VALID: served template => returns exactly these nine fields, in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^([A-Z]+):/gmu), (match) => match[1])).toStrictEqual([
      'VERDICT',
      'READ',
      'BITES',
      'UNCOVERED',
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
  // `{ verdict, evidence, toSettle?, workItemId, at }`, naming a field on the OBJECT it grades rather
  // than telling this session to pass one anywhere. That field name arrives by identity as part of
  // `judgingMarkdown`; this reviewer's own fetch and return still carry none of its own.
  it("VALID: served template => carries workItemId only as the sign-off contract's own field name", () => {
    expect(
      hasIn({ needle: '`{ verdict, evidence, toSettle?, workItemId, at }`', text: TEMPLATE }),
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
