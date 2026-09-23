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
  // prompts, so it is the one to measure first after an edit to either shared block. 25,046 bytes
  // measured against a 50,000 ceiling.
  it('VALID: served template => fits the MCP verbatim ceiling in bytes', () => {
    expect(Buffer.byteLength(TEMPLATE, 'utf8')).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  // TWO SHARED BLOCKS INTERPOLATE HERE, and `judgingMarkdown` alone opens THREE `##` headings of its
  // own, landing after step 7 of this file's own workflow, ahead of `standardsReviewConcernsStatics`'s
  // one. Each is a section this file never writes itself; a rename inside either shared block reds this.
  it('VALID: served template => names its eight top-level sections in document order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^## .+$/gmu), (match) => match[0])).toStrictEqual([
      '## What you were given',
      '## Rules',
      '## Workflow',
      '## The Evidence Contract — what makes an observable COVERED',
      '## Known false greens — reject on sight',
      '## Verdicts — a unit carries one sign-off per track, and there are three',
      '## The five standing concerns',
      '## The quest id',
    ]);
  });

  it('VALID: served template => names its seven workflow steps in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^### \d+\. .+$/gmu), (match) => match[0])).toStrictEqual([
      '### 1. Load the standards',
      '### 2. Fetch your scope',
      '### 3. Find out what changed',
      "### 4. Judge the tests ONE FILE AT A TIME, and write each file's comment before you open the next",
      '### 5. Take the standing concerns on the same files',
      '### 6. Ward',
      '### 7. Mark every assigned unit, then signal',
    ]);
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
      callShape: hasIn({ needle: "signal: 'complete',", text: TEMPLATE }),
      noParentSignals: hasIn({ needle: 'Your parent signals', text: TEMPLATE }),
      noNeverCallSignalBack: hasIn({ needle: 'You never call `signal-back`', text: TEMPLATE }),
    }).toStrictEqual({
      signalRule: true,
      callShape: true,
      noParentSignals: false,
      noNeverCallSignalBack: false,
    });
  });

  // ONE WARD, AND IT IS THIS SESSION'S ALONE — `work` wards only its own piece's paths, never
  // `--uncommitted`, so a run before this one has read the work grades what nobody read.
  it("VALID: served template => wards once, scoped to --uncommitted, and never widens a sub-agent's run", () => {
    expect({
      whoseItIs: hasIn({
        needle:
          "No other SESSION on the pass runs it — `work` wards only its own\npiece's paths, never `--uncommitted` — and you run no bare `npm run ward`; that is the dispatcher's.",
        text: TEMPLATE,
      }),
      neverWidensASubAgentsRun: hasIn({
        needle:
          "You never widen a sub-agent's scoped run into a `--uncommitted` of your own before its files carry\ntheir comments.",
        text: TEMPLATE,
      }),
      lineFenced: hasIn({ needle: '```bash\nnpm run ward -- --uncommitted\n```', text: TEMPLATE }),
      twiceAtMost: hasIn({
        needle: '**Fix reds, then run it once more. Twice at most.**',
        text: TEMPLATE,
      }),
      whyRunItHere: hasIn({
        needle:
          'a DETERMINISTIC\n`ward` step re-grades the whole family `--committed --uncommitted` anyway — but a red it finds routes\nto a `spiritmender` repair',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      whoseItIs: true,
      neverWidensASubAgentsRun: true,
      lineFenced: true,
      twiceAtMost: true,
      whyRunItHere: true,
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

  // `LAYER` NOW READS A REAL FIELD `get-quest-work` HANDS BACK, never a legend cross-reference — the
  // per-unit `surface` field replaces the retired `## CHECK SURFACES` join.
  it("VALID: served template => reads a unit's LAYER off get-quest-work's own surface field", () => {
    expect(
      hasIn({
        needle:
          "**`LAYER`.** Read the unit's own `surface` field off `get-quest-work` — a terminal or a branch carries\none too, from its own row — and reject an assertion whose layer disagrees with it, on that\ndisagreement alone.",
        text: TEMPLATE,
      }),
    ).toBe(true);
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
  // all. Read as green, that is a pass reported over a run that graded nothing — and nothing here
  // reads that as evidence any unit is settled.
  it('VALID: served template => treats a 0-file ward scope as a clean run, never as evidence a unit is met', () => {
    expect(
      hasIn({
        needle:
          '**A ward reporting that the file scope resolved to 0 source files is EMPTY, not green.** Nothing was staged for it to grade. Treat that as a clean run, never as evidence any unit is `met`.',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // THE PASS ARRIVES ENTIRELY UNCOMMITTED, and NOTHING in this session's own turn ever commits it —
  // the deterministic `commit` step does that after `done`.
  it('VALID: served template => enumerates what changed before it opens a single file', () => {
    expect({
      readBeforeOpening: hasIn({
        needle: '**Run both before you open a single file.**',
        text: TEMPLATE,
      }),
      order:
        TEMPLATE.indexOf('### 3. Find out what changed') <
        TEMPLATE.indexOf('### 4. Judge the tests ONE FILE AT A TIME'),
    }).toStrictEqual({ readBeforeOpening: true, order: true });
  });

  // NEITHER A COMMIT NOR A PUSH IS THIS SESSION'S TO MAKE — `review`'s `done` routes to a
  // deterministic `commit` step that runs both, from a message built off this session's own marks.
  it('VALID: served template => never runs git add, git commit or git push, and says so', () => {
    expect({
      gitRule: hasIn({
        needle:
          '**[GIT] You read git; you never write it.** `git status`, `git diff HEAD`, `git log`,\n`git rev-parse` — run as many of these as you need. **Never `git add`, `git commit`, `git push`,\n`git stash`, `git reset`, `git checkout --`, `git clean` or `git rebase`.**',
        text: TEMPLATE,
      }),
      addAllAbsent: /^git add -A$/mu.exec(TEMPLATE) === null,
      commitAbsent: !TEMPLATE.includes('git commit -m'),
      barePushAbsent: /^git push$/mu.exec(TEMPLATE) === null,
    }).toStrictEqual({
      gitRule: true,
      addAllAbsent: true,
      commitAbsent: true,
      barePushAbsent: true,
    });
  });

  // THE OLD RETURN-BLOCK PROTOCOL IS GONE ENTIRELY — this reviewer used to answer with nine labelled
  // fields (VERDICT/READ/BITES/UNCOVERED/FIXES/FINDINGS/WARD/COMMIT/NEXT); what persists now is the
  // `quest-work` observation on each unit and the `signal-back` call.
  it('VALID: served template => carries no VERDICT/READ/BITES/UNCOVERED/FIXES/FINDINGS/WARD/COMMIT/NEXT block', () => {
    expect(Array.from(TEMPLATE.matchAll(/^([A-Z]+):/gmu), (match) => match[1])).toStrictEqual([]);
  });

  // THE MARKING CALL IS THE REPLACEMENT WIRE FORMAT — every assigned unit needs a mark or
  // `signal-back` refuses the call by name.
  it('VALID: served template => marks every assigned unit through quest-work before signalling', () => {
    expect({
      observationsCall: hasIn({ needle: "payload: {\n    kind: 'observations',", text: TEMPLATE }),
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

  // THIS REVIEWER TAKES BOTH HALVES OF THE SHARED SURFACE ITS FAMILY OWNS: the judging half of the
  // evidence contract (never the authoring half — that reaches no served prompt today) AND the
  // standing concerns every reviewer takes.
  it('VALID: served template => carries the judging evidence contract and the standing concerns, and withholds authoring', () => {
    expect({
      judging: hasIn({ needle: flowEvidenceContractStatics.judgingMarkdown, text: TEMPLATE }),
      standards: hasIn({ needle: standardsReviewConcernsStatics.markdown, text: TEMPLATE }),
      authoring: hasIn({ needle: flowEvidenceContractStatics.authoringMarkdown, text: TEMPLATE }),
    }).toStrictEqual({ judging: true, standards: true, authoring: false });
  });

  // THIS FILE'S OWN TEXT CORRECTS TWO THINGS THE INTERPOLATED JUDGING BLOCK STILL GETS WRONG: the
  // retired `get-qa-checklist` tool name and the retired three-track `{ verdict, … }` sign-off. The
  // shared block itself is out of this fix's reach — see the file's own PURPOSE header and this
  // package's CLAUDE.md, "A shared block is a contract on every prompt that interpolates it."
  it('VALID: served template => names the stale tool and sign-off shape the interpolated block still carries', () => {
    expect({
      staleToolNamedInJudging: hasIn({ needle: 'get-qa-checklist', text: TEMPLATE }),
      staleSignOffShapeNamedInJudging: hasIn({
        needle: '`{ verdict, evidence, toSettle?, workItemId, at }`',
        text: TEMPLATE,
      }),
      thisFileNamesGetQuestWorkInstead: hasIn({
        needle: "get-quest-work({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID' })",
        text: TEMPLATE,
      }),
      thisFileNamesOneObservationInstead: hasIn({
        needle: "kind: 'observations',",
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      staleToolNamedInJudging: true,
      staleSignOffShapeNamedInJudging: true,
      thisFileNamesGetQuestWorkInstead: true,
      thisFileNamesOneObservationInstead: true,
    });
  });

  it('VALID: served template => carries no false claims about a briefing parent or a retired brief line', () => {
    expect({
      yourParentSignals: hasIn({ needle: 'Your parent signals', text: TEMPLATE }),
      briefingSubAgents: hasIn({ needle: 'briefing sub-agents', text: TEMPLATE }),
      operationLine: hasIn({ needle: 'an `OPERATION:` line', text: TEMPLATE }),
      flowLineInBrief: hasIn({ needle: 'the FLOW: line in your brief', text: TEMPLATE }),
      sweepLine: hasIn({ needle: 'A `SWEEP:` line', text: TEMPLATE }),
      onASweepBriefHeading: hasIn({ needle: 'On a sweep brief', text: TEMPLATE }),
    }).toStrictEqual({
      yourParentSignals: false,
      briefingSubAgents: false,
      operationLine: false,
      flowLineInBrief: false,
      sweepLine: false,
      onASweepBriefHeading: false,
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
