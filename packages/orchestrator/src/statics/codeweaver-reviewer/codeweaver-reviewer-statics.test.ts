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
      '### 4. Judge one file at a time, writing the judgement down before you open the next',
      '### 5. Fix what you can',
      '### 6. Ward',
      '### 7. Commit and push',
      '### 8. Return',
    ]);
  });

  // NOTHING ELSE CATCHES AN UNDECLARED CROSS-PACKAGE IMPORT. The root `node_modules` resolves a
  // sibling package whatever the importing package's manifest says, so tsc, the build and lint all
  // pass — and this reviewer is the only reader that opens the manifest.
  it('VALID: served template => checks every new cross-package import against the importing package’s manifest', () => {
    expect({
      question: hasIn({
        needle: '**Does every import crossing a package boundary have a dependency behind it?**',
        text: TEMPLATE,
      }),
      whyNothingElseCatchesIt: hasIn({
        needle:
          "A workspace\n   resolves a sibling package out of the ROOT `node_modules` whether or not the importing\n   package's own `package.json` names it, so `tsc`, the build and lint all stay green",
        text: TEMPLATE,
      }),
      bothVerdicts: hasIn({
        needle:
          'A missing entry is either a dependency to add\n   or — where one package reached into another instead of sharing with it — code that belongs in a\n   package both sides can call.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ question: true, whyNothingElseCatchesIt: true, bothVerdicts: true });
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

  // THE READING STEP IS A LOOP, NOT A BATCH. A live reviewer of this shape ran twenty reads back to
  // back and went straight to ward, and nothing in that transcript separated it from a session that
  // opened none of the files. The per-file comment is the artifact that tells the two apart.
  it('VALID: served template => reads one file at a time, writing that file’s comment before the next', () => {
    expect({
      oneAtATime: hasIn({ needle: '**Work the list ONE FILE AT A TIME.**', text: TEMPLATE }),
      commentBeforeTheNextFile: hasIn({
        needle:
          "Then emit that file's comment as a text block, and only once it is written do you open the next file.",
        text: TEMPLATE,
      }),
      neverABatch: hasIn({
        needle: '**Never a batch of reads followed by a single verdict over all of them.**',
        text: TEMPLATE,
      }),
      whyItIsWritten: hasIn({
        needle:
          '**The comment is the only durable evidence that the file was read**, which is why it is written while the file is still in front of you.',
        text: TEMPLATE,
      }),
      aVerdictOverTwentyProvesNothing: hasIn({
        needle:
          'A verdict written after twenty reads describes twenty files at once and could have been written without opening any of them',
        text: TEMPLATE,
      }),
      emittedAfterEachFileBeforeTheNext: hasIn({
        needle:
          '**Format for the per-file comment (emit verbatim after each file, before the next one):**',
        text: TEMPLATE,
      }),
      noneSkipped: hasIn({
        needle: 'A file carrying no comment of its own has not been reviewed',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      oneAtATime: true,
      commentBeforeTheNextFile: true,
      neverABatch: true,
      whyItIsWritten: true,
      aVerdictOverTwentyProvesNothing: true,
      emittedAfterEachFileBeforeTheNext: true,
      noneSkipped: true,
    });
  });

  // THE COMMENT IS VOICED FOR WHAT THIS REVIEWER GRADES — product code against the flow. Each line
  // of it is one of step 4's own questions, so a filled-in block IS the reading, written down.
  it('VALID: served template => shapes the per-file comment around path, acceptance, evidence, fit, test and gap', () => {
    expect({
      path: hasIn({ needle: '#### Reviewed — <path>', text: TEMPLATE }),
      acceptance: hasIn({
        needle:
          '- Acceptance: MEETS | DOES NOT MEET — <the observable or edge label this file was built for>',
        text: TEMPLATE,
      }),
      evidence: hasIn({
        needle: '- Evidence: <the line, branch or call in THIS file that decides that>',
        text: TEMPLATE,
      }),
      fit: hasIn({
        needle:
          '- Fit: <the other side you opened against it — caller, contract, `package.json` — or "nothing else touches it">',
        text: TEMPLATE,
      }),
      test: hasIn({
        needle:
          '- Test: <the test beside it, and the wrong value that turns it red — or "none in this work">',
        text: TEMPLATE,
      }),
      missing: hasIn({
        needle: '- Missing: <what the flow needs and this file does not carry — or "nothing">',
        text: TEMPLATE,
      }),
      cleanFilesToo: hasIn({
        needle: 'Emit one for every file, a clean one included',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      path: true,
      acceptance: true,
      evidence: true,
      fit: true,
      test: true,
      missing: true,
      cleanFilesToo: true,
    });
  });

  // ONE WARD, AND IT IS THIS SESSION'S ALONE — every sibling on the pass runs a ward scoped to its
  // own paths, so a `--uncommitted` run before this one has read the work grades what nobody read.
  // BOTH ward-gate sites name the written comments, because "I have read everything" is a claim the
  // session makes about itself and one comment per file is a condition anybody can count.
  it('VALID: served template => wards once, scoped to --uncommitted, gated on every file carrying its comment', () => {
    expect({
      scopeRule: hasIn({
        needle:
          "**[WARD SCOPE] `npm run ward -- --uncommitted` is yours, once, and only once every file on your list carries its own written comment.** Nobody else on the pass runs it. You run no bare `npm run ward`; that is the dispatcher's.",
        text: TEMPLATE,
      }),
      neverWidensASubAgentsRun: hasIn({
        needle:
          "You never widen a sub-agent's scoped run into a `--uncommitted` of your own before that work's files carry their comments.",
        text: TEMPLATE,
      }),
      lineFenced: hasIn({ needle: '```bash\nnpm run ward -- --uncommitted\n```', text: TEMPLATE }),
      wardStepGate: hasIn({
        needle:
          'Run it once, in the foreground, once every file on your step 4 list carries its own written comment — count the comments against the files before you type the command.',
        text: TEMPLATE,
      }),
      twiceAtMost: hasIn({
        needle: '**Fix reds, then run it once more. Twice at most.**',
        text: TEMPLATE,
      }),
      flakeIsolation: hasIn({
        needle: '**Diagnose a red before you fix it.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      scopeRule: true,
      neverWidensASubAgentsRun: true,
      lineFenced: true,
      wardStepGate: true,
      twiceAtMost: true,
      flakeIsolation: true,
    });
  });

  // THE UNCHECKABLE CLAIM IS GONE, not merely joined by a checkable one. Left standing anywhere, it
  // is the sentence a session quotes back at itself to justify warding after zero written comments.
  it('VALID: served template => carries no self-reported "after you have read everything" gate', () => {
    expect({
      oldWardScopeClaim: hasIn({ needle: 'after you have read everything', text: TEMPLATE }),
      oldWardStepClaim: hasIn({
        needle: 'Run it once, in the foreground, after you have read everything.',
        text: TEMPLATE,
      }),
      oldStepFourHeading: hasIn({
        needle: '### 4. Open every file the work produced',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      oldWardScopeClaim: false,
      oldWardStepClaim: false,
      oldStepFourHeading: false,
    });
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
  it('VALID: served template => returns exactly these seven fields, in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^([A-Z]+):/gmu), (match) => match[1])).toStrictEqual([
      'VERDICT',
      'READ',
      'FIXES',
      'FINDINGS',
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
