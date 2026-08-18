import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';
import { plannerMinionStatics } from './planner-minion-statics';

const { template } = plannerMinionStatics.prompt;

const has = (needle: string): boolean => template.includes(needle);

describe('plannerMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(plannerMinionStatics).toStrictEqual({
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
  // PARENT's operation item. So the real brief arrives in the parent's spawn message. The section
  // used to be headed "## Briefing", which told a minion its briefing was one id.
  it('VALID: the last section => says the parent brief is elsewhere and this line is the authoritative id', () => {
    expect({
      honestHeading: /^## The quest id — everything else is in your parent's brief$/mu.test(
        template,
      ),
      noBriefingHeading: /^## Briefing$/mu.test(template),
      briefIsTheSpawnMessage: has(
        "**Your BRIEF is your parent's spawn message, not this section.**",
      ),
      namesWhatArrivesThere: has('`BUILD:`, `TREE:` and `REWORK:` all arrive there'),
      oneLineOnly: has('carries exactly one line'),
      thisOneWins: has(
        "where it and your parent's header disagree about the quest id, THIS one is\nright",
      ),
      noBriefIsRework: has('say so and return `NEXT: rework`'),
      doNotReconstruct: has('do not\ntry to reconstruct one from here'),
    }).toStrictEqual({
      honestHeading: true,
      noBriefingHeading: false,
      briefIsTheSpawnMessage: true,
      namesWhatArrivesThere: true,
      oneLineOnly: true,
      thisOneWins: true,
      noBriefIsRework: true,
      doNotReconstruct: true,
    });
  });

  // The planner is the ONE minion allowed to spawn a sub-agent, and only for a bounded spike, so it
  // takes the delegating variant. The leaf variant would forbid the spike its own method requires.
  it('VALID: template => embeds the delegating-minion operating rules, and no other variant', () => {
    expect({
      delegatingMinionVariant: has(agentOperatingRulesStatics.delegatingMinionMarkdown),
      leafMinionVariant: has(agentOperatingRulesStatics.leafMinionMarkdown),
      workItemVariant: has(agentOperatingRulesStatics.markdown),
      operatorVariant: has(agentOperatingRulesStatics.operatorMarkdown),
    }).toStrictEqual({
      delegatingMinionVariant: true,
      leafMinionVariant: false,
      workItemVariant: false,
      operatorVariant: false,
    });
  });

  // THE REGRESSION GUARD FOR THE PIVOT. The plan used to be persisted through
  // `modify-quest({ planningNotes: { operationPlans: [...] } })`, which forced this session to mint a
  // UUID for the plan and every chunk against a UUID-VALIDATED contract — so a bad id was a REJECTED
  // write rather than a degraded one, leaving the operator with nothing to read back and no way to
  // find out why. It is a committed markdown file now: numbering IS the order, a path is a path, and
  // a bad write shows up in `git status`.
  describe('the plan is a committed file, not a quest write', () => {
    it('VALID: template => names the file path, its commit subject, and nothing about operationPlans', () => {
      expect({
        filePath: has('`.quest-plans/round-<n>.md`'),
        commitSubject: has('commit it with the\nsubject `plan round <n>: <count> chunks`'),
        onlyGitWrite: has('That commit is the only thing you put in git.'),
        noOperationPlans: has('operationPlans'),
        noModifyQuestWrite: has('modify-quest({ questId'),
        noUuidMinting: has('a UUID you generate'),
        noDependsOnField: has('dependsOn'),
      }).toStrictEqual({
        filePath: true,
        commitSubject: true,
        onlyGitWrite: true,
        noOperationPlans: false,
        noModifyQuestWrite: false,
        noUuidMinting: false,
        noDependsOnField: false,
      });
    });

    it('VALID: the chunk format => carries every field the worker template reads back', () => {
      expect({
        heading: has('## chunk 1 — <one line a worker can hold in its head>'),
        summary: has('SUMMARY: <2-3 sentences'),
        intent: has(
          'INTENT: <what must be TRUE when this chunk is done — an outcome, not a task list>',
        ),
        files: has('FILES:\n  - ./packages/<pkg>/src/<path>.ts'),
        units: has('UNITS:\n  - <a unit id this chunk must satisfy>'),
        mirror: has(
          'MIRROR: ./packages/<pkg>/src/<an existing sibling whose shape this follows>.ts',
        ),
        ward: has('WARD: npm run ward -- --only lint,typecheck,unit -- '),
        notes: has('NOTES:\n  <everything its worker cannot derive'),
      }).toStrictEqual({
        heading: true,
        summary: true,
        intent: true,
        files: true,
        units: true,
        mirror: true,
        ward: true,
        notes: true,
      });
    });

    // The chunk NUMBER is the dependency order. The predecessor carried a `dependsOn` array of chunk
    // UUIDs beside a list that was already ordered, which said the same thing twice and invited a
    // reading where "independent" meant "safe to run at once".
    it('VALID: template => makes the chunk number the dependency order and says there is no second field', () => {
      expect({
        numberIsOrder: has('**Number from 1, contiguously. THE ORDER IS THE DEPENDENCY ORDER.**'),
        parentDispatchesInOrder: has('Your parent dispatches chunk 1,'),
        noSecondField: has('There is no separate dependency field'),
        laterIsNumberedLater: has(
          'A chunk that must land after another is simply numbered after it.',
        ),
      }).toStrictEqual({
        numberIsOrder: true,
        parentDispatchesInOrder: true,
        noSecondField: true,
        laterIsNumberedLater: true,
      });
    });

    it('VALID: template => makes FILES ownership, bans a shared path, and requires the ./ prefix', () => {
      expect({
        ownership: has('**`FILES` is OWNERSHIP, and two chunks must never list the same path.**'),
        lastWriteWins: has('Last-write-wins is how'),
        oneChunkIfShared: has('If two chunks genuinely need one file, they are one chunk.'),
        prefix: has('**`FILES` paths start with `./` or are absolute**'),
        noDirectories: has('they are FILE paths, never directories'),
      }).toStrictEqual({
        ownership: true,
        lastWriteWins: true,
        oneChunkIfShared: true,
        prefix: true,
        noDirectories: true,
      });
    });

    // The planner writes the ward command because it is the session that knows the folder types. Its
    // operator's own tool table FORBIDS `get-folder-detail`, so an operator asked to narrow `--only`
    // was guessing at a repo-specific map it could not read.
    it('VALID: template => makes WARD a literal the worker runs verbatim, narrowed by the discipline', () => {
      expect({
        literal: has('**`WARD` is a literal command its worker runs verbatim**'),
        whyThisSession: has('session that knows the folder types'),
        nobodyBelowNarrows: has('nobody below you narrows anything'),
        disciplineSaysWhich: has('your discipline says which'),
        sameFilesAsFiles: has('file paths as `FILES`'),
        neverADirectory: has('Never a bare directory: it pulls in the whole package'),
      }).toStrictEqual({
        literal: true,
        whyThisSession: true,
        nobodyBelowNarrows: true,
        disciplineSaysWhich: true,
        sameFilesAsFiles: true,
        neverADirectory: true,
      });
    });

    it('VALID: template => requires UNITS and says what a chunk without one is graded against', () => {
      expect({
        gradedBySetDifference: has(
          '**`UNITS` is what the reviewer grades the chunk against**, by set difference.',
        ),
        emptyComesBackClean: has('none is graded against nothing and comes back clean'),
        sayWhyInNotes: has('`NOTES` why it exists'),
      }).toStrictEqual({
        gradedBySetDifference: true,
        emptyComesBackClean: true,
        sayWhyInNotes: true,
      });
    });

    it('VALID: template => tells the session to err small and names why a big chunk is invisible', () => {
      expect({
        errSmall: has('**Err small.**'),
        oneWorkerHoldsIt: has('A chunk must be small enough for ONE worker to hold in full.'),
        skimIsInvisible: has(
          '**An over-large chunk\n  gets skimmed, and the skim is invisible in a green run**',
        ),
        twoTightBeatsOne: has('Two tight chunks\n  beat one that needs a table of contents.'),
      }).toStrictEqual({
        errSmall: true,
        oneWorkerHoldsIt: true,
        skimIsInvisible: true,
        twoTightBeatsOne: true,
      });
    });
  });

  // The `short:` routing shape had no reader: the operator's last gate decided on the reviewer's
  // remainder alone, so scope the planner reported as uncovered was reported complete by the ledger.
  // Now it is a CHUNK, which reaches a worker, a reviewer and the next round through the same path
  // as everything else.
  it('VALID: template => turns unplannable scope into a chunk rather than a routing note', () => {
    expect({
      stillGetsAChunk: has('**Scope you cannot plan cleanly still gets a chunk.**'),
      intentNamesTheDecision: has(
        '`INTENT` naming what must be settled and `NOTES` naming the contradiction',
      ),
      reachesTheNextRound: has(
        'Its worker returns\n  `rework` or `wall`, and that reaches the next round.',
      ),
      leavingItOutDropsIt: has('**Leaving it out of the plan is how it gets\n  dropped**'),
      noChannelWithoutAReader: has(
        'nothing downstream reads a channel your parent does not route on',
      ),
    }).toStrictEqual({
      stillGetsAChunk: true,
      intentNamesTheDecision: true,
      reachesTheNextRound: true,
      leavingItOutDropsIt: true,
      noChannelWithoutAReader: true,
    });
  });

  describe('what it returns', () => {
    it('VALID: template => returns two lines, and never the plan body', () => {
      expect({
        planLine: has('PLAN: .quest-plans/round-<n>.md — <count> chunks'),
        continueLine: has('NEXT: continue'),
        wallLine: has('NEXT: wall — <what, and what a human must change>'),
        exactlyTwoValues: has('There are exactly two values'),
        zeroChunksIsContinue: has(
          '`continue` covers every plan you were able to write, zero chunks\nincluded',
        ),
        neverPasteThePlan: has('**Never paste the plan into your return.**'),
      }).toStrictEqual({
        planLine: true,
        continueLine: true,
        wallLine: true,
        exactlyTwoValues: true,
        zeroChunksIsContinue: true,
        neverPasteThePlan: true,
      });
    });

    it('VALID: template => declares a zero-chunk plan legal and forbids inventing work', () => {
      expect({
        legal: has('**A plan with ZERO chunks is a legal plan.**'),
        alreadyTrue: has('The scope is already true on disk'),
        noChunkSections: has('no `## chunk` sections'),
        doNotInvent: has('**Do not invent a chunk to look\nproductive.**'),
      }).toStrictEqual({
        legal: true,
        alreadyTrue: true,
        noChunkSections: true,
        doNotInvent: true,
      });
    });

    // Its parent opens no source file and holds no opinion about the plan, so a question handed up
    // is guessed at blind or dropped. `ask-user-question` is deliberately absent: a minion runs
    // inside its parent's turn, so nothing resumes it with an answer.
    it('VALID: template => forbids routing a design choice upward and never reaches for a question tool', () => {
      expect({
        wallIsEnvironmentOnly: has('**`wall` is for an environment wall and nothing else**'),
        designIsNeverAWall: has(
          '**A design choice is NEVER a wall and never a question for your parent.**',
        ),
        parentGuessesOrDrops: has(
          'a question handed up to it is guessed at blind or dropped silently',
        ),
        decideIt: has("Decide it,\nput the reasoning in the plan's `SUMMARY`"),
        usersCallIsAChunk: has(
          "Where it is\ngenuinely the USER's call rather than yours, that is still a CHUNK",
        ),
        noAskUserQuestion: has('ask-user-question'),
      }).toStrictEqual({
        wallIsEnvironmentOnly: true,
        designIsNeverAWall: true,
        parentGuessesOrDrops: true,
        decideIt: true,
        usersCallIsAChunk: true,
        noAskUserQuestion: false,
      });
    });
  });

  describe('the method', () => {
    it('VALID: template => numbers its steps 1 through 9, contiguously', () => {
      const method = template.slice(
        template.indexOf('## Method'),
        template.indexOf('## The plan file'),
      );

      expect(Array.from(method.matchAll(/^\d\. \*\*/gmu)).map((match) => match[0])).toStrictEqual([
        '1. **',
        '2. **',
        '3. **',
        '4. **',
        '5. **',
        '6. **',
        '7. **',
        '8. **',
        '9. **',
      ]);
    });

    it('VALID: step 1 => reads the four fields the operator hands it, including last round as this round', () => {
      expect({
        scope: has("It carries your parent's `SCOPE:` block verbatim"),
        build: has("`BUILD:` (the\n   output of this round's build)"),
        tree: has('`TREE:` (the output of `git status`)'),
        reworkIsThisScope: has(
          "what last round's reviewer said is not done, which IS this round's scope",
        ),
      }).toStrictEqual({ scope: true, build: true, tree: true, reworkIsThisScope: true });
    });

    it('VALID: step 2 => loads the standards blocking, in one ToolSearch batch', () => {
      expect({
        blocking: has('**Load the project standards YOURSELF (BLOCKING).**'),
        parentCannotDigest: has(
          'Your parent did not load them and cannot\n   digest them for you.',
        ),
        overrideTraining: has(
          'they override your training defaults, which are WRONG for this codebase',
        ),
        oneBatch: has(
          'in the SAME first `ToolSearch`\n   batch so you do not pay a second round-trip later',
        ),
      }).toStrictEqual({
        blocking: true,
        parentCannotDigest: true,
        overrideTraining: true,
        oneBatch: true,
      });
    });

    it('VALID: steps 4 and 5 => read real code and are the only session that reads history', () => {
      expect({
        realCode: has('**Read the real code before you plan against it.**'),
        notAgainstTheSpecAlone: has('**Plan against\n   reality, never against the spec alone**'),
        onlySessionThatReadsHistory: has(
          '**Read the HISTORY too — you are the only session that does.**',
        ),
        readTheBodies: has('**read the BODIES**'),
        chunkSubject: has('commits its chunk under `chunk <n>: <title>`'),
        reviewSubject: has('commits its round under `review <n>: <verdict>`'),
        earlierPlansAreInGit: has("Earlier rounds' plan files are in git too, at `.quest-plans/`."),
        ptNIsTheJob: has('makes this the job, not background reading'),
        writesNothingElse: has('**You WRITE nothing to git except the plan file.**'),
      }).toStrictEqual({
        realCode: true,
        notAgainstTheSpecAlone: true,
        onlySessionThatReadsHistory: true,
        readTheBodies: true,
        chunkSubject: true,
        reviewSubject: true,
        earlierPlansAreInGit: true,
        ptNIsTheJob: true,
        writesNothingElse: true,
      });
    });

    // A red build reaching this session is not a wall: this is the one session that can open the
    // failing file and see what a predecessor left behind.
    it('VALID: step 6 => turns a red build or a dirty tree into chunk 1', () => {
      expect({
        isAChunk: has('**A red `BUILD:` or a dirty `TREE:` is a CHUNK, not a wall.**'),
        canOpenTheFile: has('You are the session that can open\n   the failing file'),
        chunkOne: has('Cut chunk 1 for it and let the rest of\n   the round depend on it.'),
      }).toStrictEqual({ isAChunk: true, canOpenTheFile: true, chunkOne: true });
    });

    it('VALID: step 7 => bounds the spike to a net-new pattern under gitignored spike-tmp', () => {
      expect({
        onlyMinionAllowed: has('You are the ONLY minion permitted to spawn its own\n   sub-agents'),
        netNewOnly: has('a pattern nobody in this repo has\n   built yet'),
        spikeTmp: has('**`spike-tmp/` is the required home**'),
        gitignored: has('it is gitignored, and you commit nothing there'),
        untrackedRefusesTheSignal: has("an untracked file REFUSES your parent's every signal"),
        disciplineSaysKeptOrRemoved: has('Your discipline says whether it wants a spike KEPT'),
        readItYourself: has(
          'if you find yourself spawning a helper to\n   read files for you, read them yourself',
        ),
      }).toStrictEqual({
        onlyMinionAllowed: true,
        netNewOnly: true,
        spikeTmp: true,
        gitignored: true,
        untrackedRefusesTheSignal: true,
        disciplineSaysKeptOrRemoved: true,
        readItYourself: true,
      });
    });
  });
});
