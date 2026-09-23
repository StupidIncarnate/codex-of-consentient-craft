import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

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
  // the resolved text the MCP layer weighs. 22,325 bytes measured against a 50,000 ceiling.
  it('VALID: served template => fits the MCP verbatim ceiling in bytes', () => {
    expect(Buffer.byteLength(TEMPLATE, 'utf8')).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  // THE SHARED STANDARDS BLOCK OPENS WITH ITS OWN `##` HEADING, landing after step 7 of this file's
  // own workflow — the interpolation adds a section this file never writes itself.
  it('VALID: served template => names its five top-level sections in document order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^## .+$/gmu), (match) => match[0])).toStrictEqual([
      '## What you were given',
      '## Rules',
      '## Workflow',
      '## The five standing concerns',
      '## The quest id',
    ]);
  });

  it('VALID: served template => names its seven workflow steps in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^### \d+\. .+$/gmu), (match) => match[0])).toStrictEqual([
      '### 1. Load the standards',
      '### 2. Fetch your scope',
      '### 3. Find out what changed',
      '### 4. Judge one file at a time, writing the judgement down before you open the next',
      '### 5. Fix what you can',
      '### 6. Ward',
      '### 7. Mark every assigned unit, then signal',
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

  // THIS SESSION IS ITS OWN WORK ITEM, dispatched with a real workItemId, and `subagentStopNeedsBlockGuard`
  // holds it open until it calls `signal-back` itself — there is no parent to signal for it.
  it('VALID: served template => calls signal-back itself, once every assigned unit carries a mark', () => {
    expect({
      signalRule: hasIn({
        needle:
          '**[SIGNAL] You call `signal-back` yourself, once, after every assigned unit carries a mark.** Nobody\nsignals for you, and nothing ends your turn without it',
        text: TEMPLATE,
      }),
      callShape: hasIn({
        needle: "signal: 'complete',",
        text: TEMPLATE,
      }),
      noParentSignals: hasIn({ needle: 'Your parent signals', text: TEMPLATE }),
      noNeverCallSignalBack: hasIn({ needle: 'You never call `signal-back`', text: TEMPLATE }),
    }).toStrictEqual({
      signalRule: true,
      callShape: true,
      noParentSignals: false,
      noNeverCallSignalBack: false,
    });
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

  // ONE WARD, AND IT IS THIS SESSION'S ALONE — `work` wards only its own piece's paths, never
  // `--uncommitted`, so a run before this one has read the work grades what nobody read.
  it('VALID: served template => wards once, scoped to --uncommitted, gated on every file carrying its comment', () => {
    expect({
      scopeRule: hasIn({
        needle:
          "**[WARD SCOPE] `npm run ward -- --uncommitted` is yours, once, and only once every file on your list carries its own written comment.** No other SESSION on the pass runs it — `work` wards only its own piece's paths, never `--uncommitted` — and you run no bare `npm run ward`; that is the dispatcher's.",
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
      whyRunItHere: hasIn({
        needle:
          'a DETERMINISTIC\n`ward` step re-grades the whole family `--committed --uncommitted` anyway — but a red it finds\nroutes to a `spiritmender` repair',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      scopeRule: true,
      neverWidensASubAgentsRun: true,
      lineFenced: true,
      wardStepGate: true,
      twiceAtMost: true,
      flakeIsolation: true,
      whyRunItHere: true,
    });
  });

  // THE UNCHECKABLE CLAIM IS GONE, not merely joined by a checkable one. Left standing anywhere, it
  // is the sentence a session quotes back at itself to justify warding after zero written comments.
  it('VALID: served template => carries no self-reported "after you have read everything" gate', () => {
    expect(hasIn({ needle: 'after you have read everything', text: TEMPLATE })).toBe(false);
  });

  // THE PASS ARRIVES ENTIRELY UNCOMMITTED, and NOTHING in this session's own turn ever commits it —
  // the deterministic `commit` step does that after `done`. Reading git before opening a single file
  // is still the rule; it is no longer protecting against this session's own commit, because this
  // session has none to make.
  it('VALID: served template => enumerates what changed before it opens a single file', () => {
    expect({
      readBeforeOpening: hasIn({
        needle: '**Run both before you open a single file.**',
        text: TEMPLATE,
      }),
      order:
        TEMPLATE.indexOf('### 3. Find out what changed') <
        TEMPLATE.indexOf('### 4. Judge one file at a time'),
    }).toStrictEqual({ readBeforeOpening: true, order: true });
  });

  // NEITHER A COMMIT NOR A PUSH IS THIS SESSION'S TO MAKE — `review`'s `done` routes to a
  // deterministic `commit` step (`stepHandlerCommitBroker`) that runs both, from a message built off
  // this session's own marks. A session that ran `git add -A` / `git commit` / `git push` here would
  // race that step on the same worktree for nothing it could keep.
  it('VALID: served template => never runs git add, git commit or git push, and says so', () => {
    expect({
      gitRule: hasIn({
        needle:
          '**[GIT] You read git; you never write it.** `git status`, `git diff HEAD`, `git log`,\n`git rev-parse` — run as many of these as you need. **Never `git add`, `git commit`, `git push`,\n`git stash`, `git reset`, `git checkout --`, `git clean` or `git rebase`.**',
        text: TEMPLATE,
      }),
      whyNotRace: hasIn({
        needle: 'writing git yourself\nraces that step on the same worktree for nothing',
        text: TEMPLATE,
      }),
      addAllAbsent: /^git add -A$/mu.exec(TEMPLATE) === null,
      commitAbsent: !TEMPLATE.includes('git commit -m'),
      barePushAbsent: /^git push$/mu.exec(TEMPLATE) === null,
    }).toStrictEqual({
      gitRule: true,
      whyNotRace: true,
      addAllAbsent: true,
      commitAbsent: true,
      barePushAbsent: true,
    });
  });

  // THE OLD RETURN-BLOCK PROTOCOL IS GONE ENTIRELY — nothing reads free-form prose from this session
  // anymore. What persists is the `quest-work` observation on each unit and the `signal-back` call.
  it('VALID: served template => carries no VERDICT/READ/FIXES/FINDINGS/WARD/COMMIT/NEXT return block', () => {
    expect(Array.from(TEMPLATE.matchAll(/^([A-Z]+):/gmu), (match) => match[1])).toStrictEqual([]);
  });

  // THE MARKING CALL IS THE REPLACEMENT WIRE FORMAT — every assigned unit needs a mark or
  // `signal-back` refuses the call by name.
  it('VALID: served template => marks every assigned unit through quest-work before signalling', () => {
    expect({
      observationsCall: hasIn({
        needle: "payload: {\n    kind: 'observations',",
        text: TEMPLATE,
      }),
      metMark: hasIn({ needle: "mark: 'met',", text: TEMPLATE }),
      cantMeetMark: hasIn({ needle: "mark: 'cant-meet',", text: TEMPLATE }),
      unmetMark: hasIn({ needle: "mark: 'unmet',", text: TEMPLATE }),
      gateNamesTheGap: hasIn({
        needle:
          '**Every unit in `assignedUnits` needs one of these three, or `signal-back` refuses your call by\nname**',
        text: TEMPLATE,
      }),
      unmetMintsWork: hasIn({
        needle:
          'only `unmet` mints a successor,\nscoped to exactly the units you marked that way, back at `work`',
        text: TEMPLATE,
      }),
      wallOutcome: hasIn({
        needle: "payload: { kind: 'outcome', word: 'wall', reason:",
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      observationsCall: true,
      metMark: true,
      cantMeetMark: true,
      unmetMark: true,
      gateNamesTheGap: true,
      unmetMintsWork: true,
      wallOutcome: true,
    });
  });

  // THIS REVIEWER TAKES THE STANDING CONCERNS ONLY — the evidence contract's judging half belongs to
  // `flowrider-reviewer`, which grades a test suite rather than product code.
  it('VALID: served template => carries the standing concerns and withholds the flow evidence contract', () => {
    expect({
      standards: hasIn({ needle: standardsReviewConcernsStatics.markdown, text: TEMPLATE }),
      evidenceContractHeading: hasIn({
        needle: 'The Evidence Contract — what makes an observable COVERED',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ standards: true, evidenceContractHeading: false });
  });

  // THIS IS A REAL WORK-ITEM SESSION, not a parent-summoned minion — `get-agent-prompt` is called
  // WITH a workItemId, which is what holds this session inside `subagentStopNeedsBlockGuard` until it
  // signals. The four substituted lines and both MCP calls this page tells it to make all name one.
  it('VALID: served template => carries workItemId as a real, required field', () => {
    expect(hasIn({ needle: 'Work Item ID: <id>', text: TEMPLATE })).toBe(true);
  });

  it('VALID: served template => carries no false claims about a briefing parent or a retired brief line', () => {
    expect({
      yourParent: hasIn({ needle: 'Your parent', text: TEMPLATE }),
      briefingSubAgents: hasIn({ needle: 'briefing sub-agents', text: TEMPLATE }),
      operationLine: hasIn({ needle: 'an `OPERATION:` line', text: TEMPLATE }),
      flowLineInBrief: hasIn({ needle: 'the FLOW: line in your brief', text: TEMPLATE }),
      readChecksLine: hasIn({ needle: 'A `READ-CHECKS:` line', text: TEMPLATE }),
      sweepLine: hasIn({ needle: 'A `SWEEP:` line', text: TEMPLATE }),
      onASweepBriefHeading: hasIn({ needle: 'On a sweep brief', text: TEMPLATE }),
      getQuestFlowCall: hasIn({ needle: "get-quest({ questId: 'QUEST_ID'", text: TEMPLATE }),
      getQaChecklist: hasIn({ needle: 'get-qa-checklist', text: TEMPLATE }),
    }).toStrictEqual({
      yourParent: false,
      briefingSubAgents: false,
      operationLine: false,
      flowLineInBrief: false,
      readChecksLine: false,
      sweepLine: false,
      onASweepBriefHeading: false,
      getQuestFlowCall: false,
      getQaChecklist: false,
    });
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
