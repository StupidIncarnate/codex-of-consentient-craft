import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';
import { workerMinionStatics } from './worker-minion-statics';

const { template } = workerMinionStatics.prompt;

const has = (needle: string): boolean => template.includes(needle);

describe('workerMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(workerMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          discipline: '$DISCIPLINE',
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => carries $DISCIPLINE once and $ARGUMENTS once, with $ARGUMENTS last', () => {
    expect({
      disciplineCount: template.split('$DISCIPLINE').length - 1,
      argumentsCount: template.split('$ARGUMENTS').length - 1,
      disciplineOnItsOwnLine: /^\$DISCIPLINE$/mu.test(template),
      disciplineComesFirst: template.indexOf('$DISCIPLINE') < template.indexOf('$ARGUMENTS'),
      argumentsIsTheTail: template.endsWith('$ARGUMENTS'),
      questIdHeading: /^## The quest id — everything else is in your parent's brief$/mu.test(
        template,
      ),
    }).toStrictEqual({
      disciplineCount: 1,
      argumentsCount: 1,
      disciplineOnItsOwnLine: true,
      disciplineComesFirst: true,
      argumentsIsTheTail: true,
      questIdHeading: true,
    });
  });

  it('VALID: template => stays under the MCP tool-result verbatim-delivery ceiling', () => {
    expect(template.length).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  // WHAT `$ARGUMENTS` ACTUALLY RESOLVES TO for a minion, and it is not a briefing:
  // `agentPromptGetBroker`'s minion-fetch branch substitutes `Quest ID: <uuid>` and nothing else —
  // deliberately, because the only richer substitution needs a `workItemId`, and a minion that
  // passed one would be held open by `subagentStopNeedsBlockGuard` until it signalled on its
  // PARENT's operation item. So the chunk arrives in the parent's spawn message. The section used
  // to be headed "## Briefing", which told a worker its briefing was one id.
  it('VALID: the last section => says the chunk is elsewhere and this line is the authoritative id', () => {
    expect({
      honestHeading: /^## The quest id — everything else is in your parent's brief$/mu.test(
        template,
      ),
      noBriefingHeading: /^## Briefing$/mu.test(template),
      briefIsTheSpawnMessage: has(
        "**Your BRIEF is your parent's spawn message, not this section.**",
      ),
      namesTheChunkFields: has(
        '`INTENT`, `FILES`, `UNITS`, `MIRROR`, `WARD` and `NOTES` — all arrive there',
      ),
      oneLineOnly: has('carries exactly one line'),
      thisOneWins: has('the quest id, THIS one is right'),
      sweepIsNotAMissingChunk: has('is not a sweep brief'),
      doNotReconstruct: has('do not try to reconstruct one from here'),
    }).toStrictEqual({
      honestHeading: true,
      noBriefingHeading: false,
      briefIsTheSpawnMessage: true,
      namesTheChunkFields: true,
      oneLineOnly: true,
      thisOneWins: true,
      sweepIsNotAMissingChunk: true,
      doNotReconstruct: true,
    });
  });

  // The worker is a LEAF: it never spawns a helper of its own, so it embeds the leaf variant rather
  // than the delegating one the planner carries.
  it('VALID: template => embeds the leaf-minion operating rules, and no other variant', () => {
    expect({
      leafMinionVariant: has(agentOperatingRulesStatics.leafMinionMarkdown),
      delegatingMinionVariant: has(agentOperatingRulesStatics.delegatingMinionMarkdown),
      workItemVariant: has(agentOperatingRulesStatics.markdown),
      operatorVariant: has(agentOperatingRulesStatics.operatorMarkdown),
    }).toStrictEqual({
      leafMinionVariant: true,
      delegatingMinionVariant: false,
      workItemVariant: false,
      operatorVariant: false,
    });
  });

  // `tsc` writes one shared `dist/` per package, so a second builder mid-round hands every sibling
  // phantom type errors on correct code. A rule this cheap to break is the FIRST line of the body,
  // not a bullet in a later section — an ordering the assertion pins directly.
  it('VALID: template => forbids npm run build in the first line of the body', () => {
    const banHeadline = '**You NEVER run `npm run build`.**';

    expect({
      ban: has(banHeadline),
      position: template.indexOf(banHeadline),
      headingLength: '# worker-minion\n\n'.length,
      namesTheCorruption: has('corrupt the shared `dist/`'),
      escalateInsteadOfBuilding: has('If you believe you need a build, you need your parent'),
    }).toStrictEqual({
      ban: true,
      position: '# worker-minion\n\n'.length,
      headingLength: '# worker-minion\n\n'.length,
      namesTheCorruption: true,
      escalateInsteadOfBuilding: true,
    });
  });

  // THE CONTRACT WITH THE DISCIPLINE PACKS. The predecessor hard-coded ONE discipline's method into
  // this template — write the failing test, shell the implementation, watch it fail, implement until
  // green — and the other four packs then had to argue with it. A manual-QA worker shells nothing; a
  // browser-e2e worker proves by mutation because the behaviour already works; a bug-repro worker's
  // red comes from the real system on unchanged source. Method steps 3 and 4 now point at two pack
  // headings BY NAME, and every pack's colocated test pins that it carries both.
  describe('the method is discipline-neutral and defers to two named pack headings', () => {
    it('VALID: template => numbers its steps 1 through 6, contiguously', () => {
      const method = template.slice(
        template.indexOf('## Method'),
        template.indexOf('**Some briefs carry no chunk'),
      );

      expect(Array.from(method.matchAll(/^\d\. \*\*/gmu)).map((match) => match[0])).toStrictEqual([
        '1. **',
        '2. **',
        '3. **',
        '4. **',
        '5. **',
        '6. **',
      ]);
    });

    it('VALID: steps 3 and 4 => name the pack headings rather than stating a method of their own', () => {
      expect({
        workHeading: has('The **`### The work`** section of your discipline above'),
        wholeOfTheStep: has('is the whole of what\n   this step means'),
        inTheOrderYouDoIt: has('it is written in the order you do it'),
        notASummary: has('it is not a summary\n   of a method you already know'),
        proofHeading: has('The **`### The proof`** section of your discipline'),
        threeShapesNamed: has('a behavioural red, a mutation, a measured value'),
        theSameQuestion: has('**what would this check have said if the behaviour were absent?**'),
        noAnswerNoProof: has('If there is no answer, the\n   check proves nothing'),
      }).toStrictEqual({
        workHeading: true,
        wholeOfTheStep: true,
        inTheOrderYouDoIt: true,
        notASummary: true,
        proofHeading: true,
        threeShapesNamed: true,
        theSameQuestion: true,
        noAnswerNoProof: true,
      });
    });

    // A worker that narrows `--only` itself is guessing at a repo-specific folder-type map; one that
    // widens it to a directory gets the run auto-backgrounded and strands its own turn.
    it('VALID: step 5 => runs the brief WARD command verbatim and treats DISCOVERY MISMATCH as not-a-failure', () => {
      expect({
        verbatim: has("**Run your brief's `WARD` command, VERBATIM.**"),
        noNarrowing: has('Do not narrow\n   it, do not widen it, and do not substitute your own'),
        plannerWroteIt: has("your planner wrote it from this chunk's\n   folder types"),
        fixUntilZero: has('Fix until it exits 0.'),
        mismatchIsNotAFailure: has('**That is not a failure**'),
        quoteIt: has('quote it in your `WARD:` line'),
        doNotEditTheCommand: has('Do not edit the command to make the message go away.'),
        notYoursToChoose: has(
          "**Choosing your own ward scope** — your brief's `WARD` line is a literal.",
        ),
      }).toStrictEqual({
        verbatim: true,
        noNarrowing: true,
        plannerWroteIt: true,
        fixUntilZero: true,
        mismatchIsNotAFailure: true,
        quoteIt: true,
        doNotEditTheCommand: true,
        notYoursToChoose: true,
      });
    });
  });

  // A round used to sit uncommitted until its operator committed at the end, so a session that died
  // mid-round lost every chunk — and the file list that commit was built from came from these return
  // blocks, read by the one session on the quest that cannot open a file to check them.
  describe('the commit', () => {
    it('VALID: step 6 => commits last, whatever state the chunk is in, with the chunk subject', () => {
      expect({
        last: has('**Commit your chunk — the LAST thing you do'),
        whateverState: has('and you do it whatever state the chunk is in.**'),
        onlyItsOwnFiles: has('`git add` the paths in `FILES` and nothing else'),
        subject: has('commit with the subject\n   `chunk <n>: <title>`'),
        allowEmpty: has('**`--allow-empty` when the chunk legitimately changed no file**'),
        emptyCommitExitsNonZero: has('`git commit` with nothing staged exits non-zero'),
        commitEvenUnfinished: has('**Commit even when the chunk came back unfinished**'),
        parentCannotSeeIt: has('your parent cannot see it (it never opens a source\n   file)'),
        theMeasuredCost: has('cost 101 minutes of wall-clock for 11 minutes of real work'),
        squashMakesItFree: has('the merge squashes it'),
        noSiblingFiles: has("Do NOT commit a sibling chunk's files."),
      }).toStrictEqual({
        last: true,
        whateverState: true,
        onlyItsOwnFiles: true,
        subject: true,
        allowEmpty: true,
        emptyCommitExitsNonZero: true,
        commitEvenUnfinished: true,
        parentCannotSeeIt: true,
        theMeasuredCost: true,
        squashMakesItFree: true,
        noSiblingFiles: true,
      });
    });

    // The operator's step 7 dispatches this same minion at a dirty tree with no chunk at all. Without
    // this paragraph that brief reads as a malformed one.
    it('VALID: template => handles the chunkless sweep brief its parent dispatches at a dirty tree', () => {
      expect({
        notAMistake: has('**Some briefs carry no chunk, and they are not a mistake.**'),
        sweepSubject: has('your subject is `sweep: <what these were>`'),
        chunkFieldReadsNone: has('`CHUNK:` reads `none — sweep`'),
        noWardLine: has('there is no\n`WARD` line to run'),
        decidePerPath: has('commit what is real work, delete what is scratch'),
        onlyAccount: has('your return is the only account of what\nhappened to them'),
      }).toStrictEqual({
        notAMistake: true,
        sweepSubject: true,
        chunkFieldReadsNone: true,
        noWardLine: true,
        decidePerPath: true,
        onlyAccount: true,
      });
    });
  });

  describe('what it returns', () => {
    it('VALID: template => carries every return field, with NEXT last', () => {
      const returnBlock = template.slice(
        template.indexOf('CHUNK:  <the chunk number'),
        template.indexOf('**`NEXT:` is the last line'),
      );

      expect({
        chunk: returnBlock.includes('CHUNK:'),
        result: returnBlock.includes('RESULT:'),
        commit: returnBlock.includes('COMMIT:'),
        files: returnBlock.includes('FILES:'),
        evidence: returnBlock.includes('EVIDENCE:'),
        gotchas: returnBlock.includes('GOTCHAS:'),
        ward: returnBlock.includes('WARD:'),
        next: returnBlock.includes(
          'NEXT:   continue | rework — <what is not done> | wall — <what a human must change>',
        ),
        evidenceDefersToThePack: returnBlock.includes(
          'what your discipline\'s "### The proof" section asks you to show',
        ),
      }).toStrictEqual({
        chunk: true,
        result: true,
        commit: true,
        files: true,
        evidence: true,
        gotchas: true,
        ward: true,
        next: true,
        evidenceDefersToThePack: true,
      });
    });

    // A worker's `rework` is a CLAIM about its own chunk, and the parent deliberately does not act on
    // it — it hands it to the reviewer, which reads it against the files. That is what keeps the
    // parent's routing a lookup rather than a judgement about whether a return was thin.
    it('VALID: template => defines all three NEXT values, and says the parent does not act on rework', () => {
      expect({
        lastLineAlways: has('**`NEXT:` is the last line, always'),
        onlyLineActedOn: has('and it is the only line your parent acts on.**'),
        continueMeaning: has("the chunk's `INTENT` is TRUE and you proved it"),
        greenWardIsNotEnough: has('A green ward alone is not this;\n  step 4 is.'),
        reworkMeaning: has('something about this chunk is not done'),
        parentDoesNotAct: has('**Your\n  parent does not act on this**'),
        reviewerDecides: has('it hands it to your reviewer'),
        wallIsEnvironmentOnly: has('an environment wall no session of any role could pass'),
        wallHaltsTheQuest: has('**This halts the whole quest**'),
        wrongForFutureWork: has(
          'it is the wrong answer for\n  anything a future worker could still do',
        ),
      }).toStrictEqual({
        lastLineAlways: true,
        onlyLineActedOn: true,
        continueMeaning: true,
        greenWardIsNotEnough: true,
        reworkMeaning: true,
        parentDoesNotAct: true,
        reviewerDecides: true,
        wallIsEnvironmentOnly: true,
        wallHaltsTheQuest: true,
        wrongForFutureWork: true,
      });
    });

    it('VALID: template => refuses a faked green and demands an honest failure report', () => {
      expect({
        sayItPlainly: has('say so plainly in `RESULT`'),
        commitAnyway: has('commit it anyway\nper step 6'),
        whatBrokeInGotchas: has('put what you tried and where it broke in `GOTCHAS`'),
        noFakeGreen: has(
          '**Do not fake a green ward and\ndo not report a check you did not run.**',
        ),
        cannotPivotOnPlausible: has('pivot on a plausible one'),
      }).toStrictEqual({
        sayItPlainly: true,
        commitAnyway: true,
        whatBrokeInGotchas: true,
        noFakeGreen: true,
        cannotPivotOnPlausible: true,
      });
    });
  });

  describe('what is not yours', () => {
    it('VALID: template => bans the build, destructive git, the Agent tool and the whole-repo ward', () => {
      expect({
        build: has('- **`npm run build`** — see the first line. Your parent owns it.'),
        destructiveGit: has('- **Destructive `git`**'),
        commitIsNotOnTheList: has('**Committing your own\n  chunk is NOT on this list**'),
        agentTool: has('- **The `Agent` tool** — you are a LEAF.'),
        wholeRepoWard: has('- **The whole-repo `npm run ward`**'),
        wardScope: has('- **Choosing your own ward scope**'),
      }).toStrictEqual({
        build: true,
        destructiveGit: true,
        commitIsNotOnTheList: true,
        agentTool: true,
        wholeRepoWard: true,
        wardScope: true,
      });
    });

    it('VALID: template => keeps the worker inside its own FILES list', () => {
      expect({
        stayInside: has('**Stay inside your chunk.**'),
        wiringIsInScope: has('that connection is\npart of your assignment'),
        noReplanning: has('Do NOT re-plan the round'),
        lastWriteWins: has('last-write-wins is how two workers undo\neach other'),
        sayInsteadOfReaching: has('say so in your return instead\nof reaching for it'),
      }).toStrictEqual({
        stayInside: true,
        wiringIsInScope: true,
        noReplanning: true,
        lastWriteWins: true,
        sayInsteadOfReaching: true,
      });
    });
  });
});
