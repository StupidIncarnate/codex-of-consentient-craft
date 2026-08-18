import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';
import { standardsReviewConcernsStatics } from '../standards-review-concerns/standards-review-concerns-statics';
import { reviewerMinionStatics } from './reviewer-minion-statics';

const { template } = reviewerMinionStatics.prompt;

const has = (needle: string): boolean => template.includes(needle);

const METHOD = template.slice(
  template.indexOf('## Method — in this order'),
  template.indexOf('## What is not yours'),
);

describe('reviewerMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(reviewerMinionStatics).toStrictEqual({
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
  // PARENT's operation item. So the worker returns arrive in the parent's spawn message and exist
  // NOWHERE else. The section used to be headed "## Briefing", which told a reviewer its briefing
  // was one id.
  it('VALID: the last section => says the worker returns are elsewhere and this line is the authoritative id', () => {
    expect({
      honestHeading: /^## The quest id — everything else is in your parent's brief$/mu.test(
        template,
      ),
      noBriefingHeading: /^## Briefing$/mu.test(template),
      briefIsTheSpawnMessage: has(
        "**Your BRIEF is your parent's spawn message, not this section.**",
      ),
      namesWhatArrivesThere: has(
        "the plan file's path,\nevery worker return, and any `SCOPE: quest` / `SKIP WARD` line all arrive there",
      ),
      oneLineOnly: has('carries exactly one line'),
      thisOneWins: has('the quest id, THIS one is right'),
      noReturnsIsSaidInVerdict: has('say so in\n`VERDICT`'),
      canStillReadTheRound: has('you can still read the plan file and the round'),
    }).toStrictEqual({
      honestHeading: true,
      noBriefingHeading: false,
      briefIsTheSpawnMessage: true,
      namesWhatArrivesThere: true,
      oneLineOnly: true,
      thisOneWins: true,
      noReturnsIsSaidInVerdict: true,
      canStillReadTheRound: true,
    });
  });

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

  // Two mandates, one job. The five standing concerns are discipline-INDEPENDENT, so they live in
  // their own statics and sit adjacent to `$DISCIPLINE` rather than being copied into five packs
  // that would then drift apart.
  it('VALID: template => embeds the standing review concerns directly beneath the discipline slot', () => {
    expect({
      embedded: has(standardsReviewConcernsStatics.markdown),
      afterTheDisciplineSlot:
        template.indexOf(standardsReviewConcernsStatics.markdown) > template.indexOf('$DISCIPLINE'),
    }).toStrictEqual({ embedded: true, afterTheDisciplineSlot: true });
  });

  // Its `NEXT:` line IS the round's outcome. Every worker on the round wrote one too, and the parent
  // reads none of theirs at its last step — which is what reduces that step from a synthesis of
  // three channels to a lookup on one line.
  describe('its NEXT line decides the round and supersedes every worker line', () => {
    it('VALID: template => opens by saying the last line decides, and that it supersedes the workers', () => {
      expect({
        onlySessionThatVerifies: has(
          '**You are the ONLY session that verifies anything on this round.**',
        ),
        whateverYouMissShips: has('Whatever you miss\nships too.'),
        lastLineDecides: has('**Your last line decides the round.**'),
        continueEndsIt: has('`continue`\nends its session'),
        reworkLoopsIt: has('`rework` sends the whole loop round again with your text as the next'),
        supersedes: has('yours SUPERSEDES all of them'),
        youHaveTheFilesOpen: has('you are the session with the files open'),
      }).toStrictEqual({
        onlySessionThatVerifies: true,
        whateverYouMissShips: true,
        lastLineDecides: true,
        continueEndsIt: true,
        reworkLoopsIt: true,
        supersedes: true,
        youHaveTheFilesOpen: true,
      });
    });

    it('VALID: template => defines all three NEXT values and the two ways to lie with the line', () => {
      expect({
        continueMeaning: has("**`continue` ends your parent's session.**"),
        continueCoversAnEmptyRound: has('including on a round that produced nothing\nat all'),
        reworkLoops: has('**`rework` sends the whole loop round again**'),
        inChunkTerms: has("in the plan's own chunk terms"),
        paddingBurnsARound: has('**Padding it burns a round the quest cannot afford.**'),
        budgetOfThree: has('against a budget of three rounds'),
        hidingShipsTheHole: has('**Hiding a real one ships the hole.**'),
        nothingRunsAfterYou: has('Nothing runs after you.'),
        wallHaltsTheQuest: has('**`wall` halts the entire quest**'),
        architecturalIsNotAWall: has(
          'An\narchitectural item, a product decision, a test you could not make bite — none of those is a wall.',
        ),
        notObligedByAWorker: has('A worker that returned `rework` does not oblige you to.'),
        cleanRoundIsWorthMore: has(
          '**A clean round backed by a\nreal reading is worth more than a manufactured finding.**',
        ),
      }).toStrictEqual({
        continueMeaning: true,
        continueCoversAnEmptyRound: true,
        reworkLoops: true,
        inChunkTerms: true,
        paddingBurnsARound: true,
        budgetOfThree: true,
        hidingShipsTheHole: true,
        nothingRunsAfterYou: true,
        wallHaltsTheQuest: true,
        architecturalIsNotAWall: true,
        notObligedByAWorker: true,
        cleanRoundIsWorthMore: true,
      });
    });

    it('VALID: the return block => carries every field, with NEXT last', () => {
      const returnBlock = template.slice(
        template.indexOf('VERDICT: <one line'),
        template.indexOf('Every line carries evidence.'),
      );

      expect({
        verdict: returnBlock.includes('VERDICT:'),
        chunks: returnBlock.includes('CHUNKS:'),
        fixesMade: returnBlock.includes('FIXES MADE:'),
        signoffs: returnBlock.includes('SIGNOFFS:'),
        ward: returnBlock.includes('WARD:'),
        next: returnBlock.includes('NEXT: continue | rework —'),
        wallOnTheContinuationLine: returnBlock.includes('| wall — <what a human must change>'),
        noAdjectives: has('`CHUNKS` entries that say "verified" or "looks correct" are the report'),
        fixNeedsAWitnessedRed: has(
          'A `FIXES MADE` line with no\nwitnessed red is a change, not a fix.',
        ),
      }).toStrictEqual({
        verdict: true,
        chunks: true,
        fixesMade: true,
        signoffs: true,
        ward: true,
        next: true,
        wallOnTheContinuationLine: true,
        noAdjectives: true,
        fixNeedsAWitnessedRed: true,
      });
    });
  });

  // THE ORDERING FIX. `get-blight-checklist` reads COMMITTED history, and the completion gate the
  // parent is held to measures a range that INCLUDES this session's commits. The predecessor said
  // BOTH "commit everything before you enumerate" AND "write each disposition as you finish each
  // file", which cannot both hold — enumerate-last forces every disposition into one batch at the
  // end, exactly what the anti-batch rule forbids. Split into two commits: fixes, then enumerate and
  // disposition, then a verdict commit that touches no implementation file and mints no new unit.
  describe('the method order', () => {
    it('VALID: template => numbers its steps 1 through 11, contiguously', () => {
      expect(Array.from(METHOD.matchAll(/^\d+\. \*\*/gmu)).map((match) => match[0])).toStrictEqual([
        '1. **',
        '2. **',
        '3. **',
        '4. **',
        '5. **',
        '6. **',
        '7. **',
        '8. **',
        '9. **',
        '10. **',
        '11. **',
      ]);
    });

    it('VALID: the method => commits fixes BEFORE it enumerates, and commits the verdict after', () => {
      expect({
        fixCommitBeforeEnumerate:
          METHOD.indexOf('**COMMIT your fixes**') <
          METHOD.indexOf('**ENUMERATE the review units**'),
        enumerateBeforeDispositions:
          METHOD.indexOf('**ENUMERATE the review units**') <
          METHOD.indexOf('**Write a disposition for every unit'),
        dispositionsBeforeVerdictCommit:
          METHOD.indexOf('**Write a disposition for every unit') <
          METHOD.indexOf('**COMMIT your verdict.**'),
        wardBeforeFixing:
          METHOD.indexOf("**Run the round's ward") < METHOD.indexOf('**FIX what you can'),
      }).toStrictEqual({
        fixCommitBeforeEnumerate: true,
        enumerateBeforeDispositions: true,
        dispositionsBeforeVerdictCommit: true,
        wardBeforeFixing: true,
      });
    });

    it('VALID: step 7 => states why the fix commit has to precede the enumeration', () => {
      expect({
        notAPreference: has('**This ordering is not a\n   preference**'),
        readsCommittedHistory: has('step 8 reads COMMITTED history'),
        gateIncludesThisCommit: has(
          "your parent's completion gate measures a range\n   that includes this commit",
        ),
        theCost: has('reaches that gate carrying no disposition'),
        refusesOverYourOwnFiles: has('the files only you touched'),
        allowEmpty: has('`--allow-empty` if you fixed nothing'),
        subject: has('subject\n   `review <n>: fixes`'),
      }).toStrictEqual({
        notAPreference: true,
        readsCommittedHistory: true,
        gateIncludesThisCommit: true,
        theCost: true,
        refusesOverYourOwnFiles: true,
        allowEmpty: true,
        subject: true,
      });
    });

    it('VALID: step 10 => commits the verdict with the return block in the body, minting no new unit', () => {
      expect({
        allowEmpty: has('`git commit --allow-empty` with the subject'),
        subject: has('`review <n>: <continue|rework>`'),
        bodyIsTheReturnBlock: has('your whole return block below in the body, verbatim'),
        mintsNoUnit: has(
          'This\n    commit touches no implementation file, so it mints no review unit',
        ),
        theRoundsRecord: has("**This commit is the round's record.**"),
        parentWritesNone: has('Your parent writes none'),
        nextPlannerReconstructs: has(
          "the next round's planner reconstructs what happened from git",
        ),
        cleanRoundStillCommits: has('A round you fixed nothing in still commits'),
      }).toStrictEqual({
        allowEmpty: true,
        subject: true,
        bodyIsTheReturnBlock: true,
        mintsNoUnit: true,
        theRoundsRecord: true,
        parentWritesNone: true,
        nextPlannerReconstructs: true,
        cleanRoundStillCommits: true,
      });
    });
  });

  // The reviewer owns the round's ward, and it needs no file list: `--staged` is every check type
  // over every source file origin does not have yet, which IS the round because the parent pushes
  // once at the end of each one — the identical boundary `scope: 'unpushed'` measures. One command,
  // one scope, two tools that cannot disagree about what the round was.
  describe('the round ward', () => {
    it('VALID: step 5 => runs --staged, alone, and says why it needs no flags', () => {
      expect({
        command: has("**Run the round's ward: `npm run ward -- --staged`.**"),
        foregroundWithTimeout: has('Foreground, `timeout: 600000`.'),
        noFlagsNoFileList: has('One\n   command, no flags, no file list'),
        everyCheckType: has(
          'it takes every check type over every source file origin does\n   not have yet',
        ),
        wardRejectsNarrowing: has('ward REJECTS it combined with `--only` or a file list'),
        parentRunsNone: has('your parent runs no ward at all'),
        workersProvedTheirOwn: has('each worker only proved its own chunk'),
        oneRerun: has('re-run step 5 ONCE'),
        stillRedIsRework: has('Still red → that is your `NEXT: rework`'),
      }).toStrictEqual({
        command: true,
        foregroundWithTimeout: true,
        noFlagsNoFileList: true,
        everyCheckType: true,
        wardRejectsNarrowing: true,
        parentRunsNone: true,
        workersProvedTheirOwn: true,
        oneRerun: true,
        stillRedIsRework: true,
      });
    });

    // The post-push re-review is dispatched AFTER the parent pushed, so both the `--staged` window
    // and the `unpushed` window are empty. Both exceptions are keyed on a literal the parent writes
    // into the brief, so neither is a judgement this session makes.
    it('VALID: template => carries both post-push brief exceptions, keyed on a literal', () => {
      expect({
        skipWard: has('**Skip this step when your brief says `SKIP WARD`**'),
        skipWardReason: has('the round it would measure is already published'),
        scopeQuest: has('**Unless your brief says `SCOPE: quest`**'),
        scopeQuestReason: has('`unpushed` would come back empty'),
        sameBoundary: has("`unpushed` is the same boundary step 5's `--staged` used"),
        cannotDisagree: has('so the two cannot disagree about what this round was'),
      }).toStrictEqual({
        skipWard: true,
        skipWardReason: true,
        scopeQuest: true,
        scopeQuestReason: true,
        sameBoundary: true,
        cannotDisagree: true,
      });
    });
  });

  // Measured catching real defects in four separate sessions of one quest, each of which returned a
  // green ward and a confident summary.
  it('VALID: step 3 => mandates opening every file and names the four defects it caught', () => {
    expect({
      mandate: has('**OPEN EVERY FILE THE ROUND PRODUCED.**'),
      notTheSummary: has('Do NOT trust the artifact summary alone'),
      notTheCommitMessage: has(
        'do not\n   review a commit message in place of the file it describes',
      ),
      stubSwallowedTheParse: has('so the outer parse never executed'),
      cadenceMeasuredNoSpacing: has(
        'a cadence test that counted frames and measured\n   no spacing',
      ),
      tautologicalAssertion: has("a tautological `getAttribute('data-testid')` assertion"),
      proxyMockedApplicationCode: has('a proxy that mocked\n   application code'),
      allGreenAndConfident: has('**Every one returned a green\n   ward and a confident summary.**'),
      claimNotSubstitute: has(
        "**A worker's return is a CLAIM about that plan, never a\n   substitute for it.**",
      ),
    }).toStrictEqual({
      mandate: true,
      notTheSummary: true,
      notTheCommitMessage: true,
      stubSwallowedTheParse: true,
      cadenceMeasuredNoSpacing: true,
      tautologicalAssertion: true,
      proxyMockedApplicationCode: true,
      allGreenAndConfident: true,
      claimNotSubstitute: true,
    });
  });

  it('VALID: step 9 => writes dispositions one at a time and sign-offs batched', () => {
    expect({
      dispositionsOneAtATime: has(
        'Dispositions go ONE AT A\n   TIME as you finish each concern for each file',
      ),
      whyNotBatched: has(
        'a session that dies at file four otherwise loses\n   every one it earned',
      ),
      signoffsBatched: has('SIGN-OFFS are the opposite: BATCH them into ONE write per round'),
      noAtField: has('**Do NOT\n   write an `at` field**'),
      noReliableClock: has('an LLM has no reliable clock'),
    }).toStrictEqual({
      dispositionsOneAtATime: true,
      whyNotBatched: true,
      signoffsBatched: true,
      noAtField: true,
      noReliableClock: true,
    });
  });

  it('VALID: step 6 => fixes red-first, ripple-checks, and hands architectural work up rather than taking it', () => {
    expect({
      redFirst: has('**FIX what you can, RED-FIRST.**'),
      rippleCheck: has('**ripple-check every other place that value renders or that logic runs**'),
      workerSeesOneChunk: has('a worker\n   sees one chunk; you see the round'),
      neverBendATest: has('Never weaken, skip or delete a test to reach green'),
      falseGreenCorrectedFirst: has(
        'A false green is FIRST corrected until it fails\n   against the broken behaviour',
      ),
      architecturalIsRework: has('Those go in `NEXT: rework`\n   with a named owner.'),
      oneLineFixIsNotRework: has(
        '**A defect you could have closed in a line is not rework; it is a fix you\n   skipped.**',
      ),
    }).toStrictEqual({
      redFirst: true,
      rippleCheck: true,
      workerSeesOneChunk: true,
      neverBendATest: true,
      falseGreenCorrectedFirst: true,
      architecturalIsRework: true,
      oneLineFixIsNotRework: true,
    });
  });

  it('VALID: template => bans the build, destructive git, the Agent tool and any other ward', () => {
    expect({
      build: has('- **`npm run build`** — your parent already built'),
      destructiveGit: has('- **Destructive `git`**'),
      commitsAreRequired: has(
        '**Committing your own fixes and your\n  verdict is NOT on this list**',
      ),
      agentTool: has('- **The `Agent` tool** — you are a LEAF.'),
      noOtherWard: has("- **Any ward but step 5's.**"),
    }).toStrictEqual({
      build: true,
      destructiveGit: true,
      commitsAreRequired: true,
      agentTool: true,
      noOtherWard: true,
    });
  });
});
