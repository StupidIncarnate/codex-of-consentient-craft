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
      '### 4. Read one file the fixers changed, comment on it, then the next',
      '### 5. Ward',
      '### 6. Commit and push',
      '### 7. Return',
    ]);
  });

  // STEP 4 IS A LOOP, NOT A SWEEP. A live sibling reviewer ran twenty `discover` and `Read` calls
  // back to back and then announced its ward, with no per-file judgement anywhere between them — a
  // transcript a session that opened nothing could have produced word for word. One comment per
  // file is the artifact a skim cannot forge.
  it('VALID: served template => step 4 reads one file, comments on it, then opens the next', () => {
    expect({
      heading: hasIn({
        needle: '### 4. Read one file the fixers changed, comment on it, then the next',
        text: TEMPLATE,
      }),
      oneAtATime: hasIn({
        needle:
          '**Every one, in full, and ONE AT A TIME.** Open a file, read all of it, write its comment, then open the next.',
        text: TEMPLATE,
      }),
      neverABatchedVerdict: hasIn({
        needle: 'Never a batch of reads followed by a single verdict.',
        text: TEMPLATE,
      }),
      commentNamesThePath: hasIn({ needle: '#### Comment — <path>', text: TEMPLATE }),
      commentNamesTheVerdict: hasIn({
        needle: '- **[MEETS|DOES NOT MEET]**: <the acceptance this file was supposed to meet>',
        text: TEMPLATE,
      }),
      commentNamesWhatDecidedIt: hasIn({
        needle: '- Because: <the one line, symbol or assertion in this file that decides it>',
        text: TEMPLATE,
      }),
      noFileGoesUncommented: hasIn({
        needle:
          'Do NOT skip emitting a Comment block — not for a file you find nothing wrong with, not for a file that is not a repair at all. Skipping breaks the record.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      heading: true,
      oneAtATime: true,
      neverABatchedVerdict: true,
      commentNamesThePath: true,
      commentNamesTheVerdict: true,
      commentNamesWhatDecidedIt: true,
      noFileGoesUncommented: true,
    });
  });

  // THE COMMENT IS WORTHLESS IF IT MAY WAIT. Written after the next file is open, it is a summary
  // again — and this role's own subject is the change that clears a symptom without touching what
  // produced it, which is exactly what a batched read does to a review.
  it('VALID: served template => emits each comment before the next file is opened, and says why', () => {
    expect({
      beforeTheNextOpen: hasIn({
        needle:
          'Emit the comment as a text block IMMEDIATELY after reading that file, and BEFORE you open the next one.',
        text: TEMPLATE,
      }),
      readBackLater: hasIn({
        needle:
          'You read these blocks back from your own context when you write `READ:` and `CAUSES:` in step 7.',
        text: TEMPLATE,
      }),
      aBatchedVerdictIsUnfalsifiable: hasIn({
        needle:
          'a session that skimmed all twenty writes exactly the same verdict as a session that read them',
        text: TEMPLATE,
      }),
      theOnlyDurableEvidence: hasIn({
        needle: 'it is the only durable evidence that the file was read',
        text: TEMPLATE,
      }),
      repairShapedHandwave: hasIn({
        needle:
          '**A batched read is the very handwave you were dispatched to catch.** A repair that widens a type, swallows an error, defaults a missing value or loosens an assertion makes the symptom go away without touching what produced it',
        text: TEMPLATE,
      }),
      appliedToReviewing: hasIn({
        needle:
          'Reading four files at once and declaring them fine is that same move applied to reviewing',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      beforeTheNextOpen: true,
      readBackLater: true,
      aBatchedVerdictIsUnfalsifiable: true,
      theOnlyDurableEvidence: true,
      repairShapedHandwave: true,
      appliedToReviewing: true,
    });
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
  it('VALID: served template => wards once, scoped to --uncommitted, behind the per-file comments', () => {
    expect({
      scopeRule: hasIn({
        needle:
          "**[WARD SCOPE] `npm run ward -- --uncommitted` is yours, once, and it does not run until every file on your list carries its own written comment from step 4.** Nobody else on the pass runs it. You run no bare `npm run ward`; that is the dispatcher's.",
        text: TEMPLATE,
      }),
      // THE THIRD GATE SITE, and the one that reads differently enough to survive a check on the
      // other two. Widening a sub-agent's run is gated on the same comments, not on a claim about
      // having read — which is how both sibling reviewers say it.
      neverWidensASubAgentsRun: hasIn({
        needle:
          "You never widen a sub-agent's scoped run into a `--uncommitted` of your own before that work's files carry their comments.",
        text: TEMPLATE,
      }),
      lineFenced: hasIn({ needle: '```bash\nnpm run ward -- --uncommitted\n```', text: TEMPLATE }),
      onceBehindTheComments: hasIn({
        needle:
          'Run it once, in the foreground, and not until every file on your list carries its own written comment from step 4.',
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
      onceBehindTheComments: true,
      twiceAtMost: true,
    });
  });

  // THE WARD GATE IS A CHECKABLE CONDITION IN BOTH PLACES IT IS STATED. "After you have read
  // everything" is a claim the session makes about itself and nothing can grade; "every file carries
  // its comment" is a thing that is either in the transcript or is not.
  it('VALID: served template => gates its ward on every file carrying its own comment, in both places', () => {
    expect({
      inTheScopeRule: hasIn({
        needle:
          '**[WARD SCOPE] `npm run ward -- --uncommitted` is yours, once, and it does not run until every file on your list carries its own written comment from step 4.**',
        text: TEMPLATE,
      }),
      inTheWardStep: hasIn({
        needle:
          'Run it once, in the foreground, and not until every file on your list carries its own written comment from step 4.',
        text: TEMPLATE,
      }),
      statedTwiceAndNowhereElse:
        TEMPLATE.replace(WHITESPACE_RUN, ' ').split('carries its own written comment from step 4')
          .length - 1,
    }).toStrictEqual({
      inTheScopeRule: true,
      inTheWardStep: true,
      statedTwiceAndNowhereElse: 2,
    });
  });

  // THE UNCHECKABLE WORDING IS REPLACED, NOT SUPPLEMENTED. Left standing beside the gate, it is the
  // cheaper of the two to satisfy, so it is the one a session would read.
  it('VALID: served template => carries no "after you have read everything" gate anywhere', () => {
    expect({
      inTheScopeRule: hasIn({
        needle: '`npm run ward -- --uncommitted` is yours, once, after you have read everything',
        text: TEMPLATE,
      }),
      inTheWardStep: hasIn({
        needle: 'Run it once, in the foreground, after you have read everything',
        text: TEMPLATE,
      }),
      anywhereAtAll: hasIn({ needle: 'after you have read everything', text: TEMPLATE }),
      // The widen clause is the third site carrying an unfalsifiable read-claim, and it wears
      // different words from the two above, so neither of those needles reaches it. Presence of the
      // replacement is asserted in the ward-gate test; this pins that the old wording is GONE.
      widenCarriesNoReadClaim: hasIn({
        needle: 'of your own before you have read its work',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      inTheScopeRule: false,
      inTheWardStep: false,
      anywhereAtAll: false,
      widenCarriesNoReadClaim: false,
    });
  });

  // GATING THE WARD MUST NOT DISTURB WHY SOME OF ITS REDS ARE THE POINT. `--uncommitted` grades the
  // whole tree, and a round's deliberately failing tests are in that tree as the proof a defect is
  // real — so the scope reasoning and the evidence rule are one passage and both survive the gate.
  it('VALID: served template => keeps the reds-are-evidence reasoning under its --uncommitted ward', () => {
    expect({
      scopeReason: hasIn({
        needle:
          '**`--uncommitted` is the right scope because the whole pass is still uncommitted when you arrive.** It unions `git diff HEAD` with `git ls-files --others`, so the brand-new files a fixer wrote are graded rather than skipped.',
        text: TEMPLATE,
      }),
      redsAreDeliberate: hasIn({
        needle:
          '**Those reds are deliberate, and step 5 says what to do when your ward meets one.**',
        text: TEMPLATE,
      }),
      writtenAsProof: hasIn({
        needle:
          'A round wrote it to fail against unchanged source, as proof the defect it encodes is real.',
        text: TEMPLATE,
      }),
      looseningIsTheShapeThisRoleCatches: hasIn({
        needle:
          'loosening an assertion that proves a defect is exactly the symptom-hiding shape this role exists to catch, and it destroys the only durable record that the defect was ever there',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      scopeReason: true,
      redsAreDeliberate: true,
      writtenAsProof: true,
      looseningIsTheShapeThisRoleCatches: true,
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
