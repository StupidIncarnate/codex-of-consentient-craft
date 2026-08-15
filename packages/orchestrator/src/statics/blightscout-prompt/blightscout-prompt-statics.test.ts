import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';

import { blightscoutPromptStatics } from './blightscout-prompt-statics';

const has = (needle: string): boolean => blightscoutPromptStatics.prompt.template.includes(needle);

describe('blightscoutPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(blightscoutPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => carries the $ARGUMENTS placeholder exactly once, on its own line under Operation Context', () => {
    const { template } = blightscoutPromptStatics.prompt;

    expect({
      count: template.split('$ARGUMENTS').length - 1,
      ownLine: /^\$ARGUMENTS$/mu.test(template),
      heading: /^## Operation Context$/mu.test(template),
    }).toStrictEqual({ count: 1, ownLine: true, heading: true });
  });

  it('VALID: template => embeds the shared agent operating rules', () => {
    const rules = agentOperatingRulesStatics.markdown;
    const { template } = blightscoutPromptStatics.prompt;
    const found = template.slice(template.indexOf(rules), template.indexOf(rules) + rules.length);

    expect(found).toBe(rules);
  });

  it('VALID: template => opens on the LAST COMMIT as the whole surface, not the branch', () => {
    const needle =
      "You own ONE operation item on the quest's operations ledger: review the LAST COMMIT on this branch —\nthe commit the session before you just made — against five review concerns, and fix what you find.";
    const { template } = blightscoutPromptStatics.prompt;
    const foundIndex = template.indexOf(needle);

    expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
  });

  it('VALID: template => states the one-commit scope and forbids ledger writes', () => {
    expect({
      oneCommit: has('**Your scope is one commit, not the quest.**'),
      notAuditingTheBranch: has('You are not auditing the branch'),
      noLedgerWrites: has('**You do NOT edit the operations ledger.**'),
      writesTheBlightLedger: has(
        '`quest.planningNotes.blightLedger` —\nthe per-unit disposition record',
      ),
    }).toStrictEqual({
      oneCommit: true,
      notAuditingTheBranch: true,
      noLedgerWrites: true,
      writesTheBlightLedger: true,
    });
  });

  // Blightwarden's three-minion fan-out existed only because a whole-quest diff had to be
  // partitioned. One commit is one session's output, so a delegating scout would no longer be the
  // session that read the code it signs for.
  it('VALID: template => summons nothing, and names no minion or spawn mechanism at all', () => {
    const { template } = blightscoutPromptStatics.prompt;

    expect({
      summonsNothing: has('**You summon nothing.**'),
      noWavesOrPartition: has('No minions, no waves, no partition.'),
      readsItItself: has('the\nsession that reads the code is the session that signs for it'),
      // No minion NAME (every one in agentPromptClassificationStatics ends `-minion`), no Agent
      // spawn, and no trace of the role this one replaced.
      namesAMinion: template.indexOf('-minion'),
      spawnsAnAgent: template.indexOf('subagent_type'),
      namesBlightwarden: template.indexOf('blightwarden'),
    }).toStrictEqual({
      summonsNothing: true,
      noWavesOrPartition: true,
      readsItItself: true,
      namesAMinion: -1,
      spawnsAnAgent: -1,
      namesBlightwarden: -1,
    });
  });

  // Omitting `scope` reads the WHOLE quest diff from baseRef — the exact surface blightscout
  // replaced blightwarden to get away from — so the parameter is spelled out at every call site.
  it('VALID: template => pins scope: commit on the checklist call and says never to omit it', () => {
    expect({
      neverOmit: has("**Pass `scope: 'commit'`, never omit it.**"),
      whatOmittingCosts: has('Omitting it returns the WHOLE quest diff measured from\n`baseRef`'),
      gate2Call: has("get-blight-checklist({ questId: 'QUEST_ID', scope: 'commit' })"),
      finalRecount: has(
        "call `get-blight-checklist({ questId, scope: 'commit' })` ONE LAST TIME and read the remaining\ncount",
      ),
      ruleOne: has(
        "1. **Ask the tool, do not enumerate** — `get-blight-checklist({ scope: 'commit' })` is the definition\n   of done",
      ),
      noHandRolledDiff: has('**Do NOT hand-roll a `git diff` to find your scope.**'),
    }).toStrictEqual({
      neverOmit: true,
      whatOmittingCosts: true,
      gate2Call: true,
      finalRecount: true,
      ruleOne: true,
      noHandRolledDiff: true,
    });
  });

  it('VALID: template => the five review concern sections run in checklist order', () => {
    const { template } = blightscoutPromptStatics.prompt;

    expect({
      craftPresent: template.includes('\n### craft\n'),
      perfAfterCraft: template.indexOf('\n### perf\n') > template.indexOf('\n### craft\n'),
      dedupAfterPerf: template.indexOf('\n### dedup\n') > template.indexOf('\n### perf\n'),
      integrityAfterDedup:
        template.indexOf('\n### integrity\n') > template.indexOf('\n### dedup\n'),
      testCasesAfterIntegrity:
        template.indexOf('\n### test-cases\n') > template.indexOf('\n### integrity\n'),
      deadCodeAfterTestCases:
        template.indexOf('### Dead code is NOT one of your concerns') >
        template.indexOf('\n### test-cases\n'),
    }).toStrictEqual({
      craftPresent: true,
      perfAfterCraft: true,
      dedupAfterPerf: true,
      integrityAfterDedup: true,
      testCasesAfterIntegrity: true,
      deadCodeAfterTestCases: true,
    });
  });

  it('VALID: template => each of the five concern headings is present under the five-concerns section', () => {
    const { template } = blightscoutPromptStatics.prompt;

    expect({
      section: /^## The five concerns$/mu.test(template),
      craft: /^### craft$/mu.test(template),
      perf: /^### perf$/mu.test(template),
      dedup: /^### dedup$/mu.test(template),
      integrity: /^### integrity$/mu.test(template),
      testCases: /^### test-cases$/mu.test(template),
      sectionPrecedesCraft:
        template.indexOf('## The five concerns') < template.indexOf('\n### craft\n'),
    }).toStrictEqual({
      section: true,
      craft: true,
      perf: true,
      dedup: true,
      integrity: true,
      testCases: true,
      sectionPrecedesCraft: true,
    });
  });

  // The crosscut minion's job survives as a repo-wide search rather than a second pass: every
  // earlier commit on the branch is already on disk, so the later of a duplicate pair sees the
  // earlier one.
  it('VALID: template => sends dedup and integrity repo-wide, which is what replaces the deleted crosscut pass', () => {
    expect({
      repoWide: has('**Search REPO-WIDE, never within the commit alone.**'),
      whyItWorks: has('every earlier commit\non this branch is already on disk'),
      duplicateDetectorIsNotEvidence: has('duplicate **string and regex literals ONLY**'),
      showYourWork: has('name both implementations and state what you compared'),
      integrityTypechecksAndStillDiffers: has('**Semantic change behind an unchanged signature**'),
    }).toStrictEqual({
      repoWide: true,
      whyItWorks: true,
      duplicateDetectorIsNotEvidence: true,
      showYourWork: true,
      integrityTypechecksAndStillDiffers: true,
    });
  });

  // Deadcode is not subsumed, it is dropped: whether an export still has a consumer is a property
  // of the whole post-fix import graph, which no single-commit pass can answer.
  it('VALID: template => declares dead code out of scope and tells the scout not to hunt orphans', () => {
    expect({
      heading: has('### Dead code is NOT one of your concerns'),
      reason: has(
        'a property of the whole import graph AFTER every later commit\nlands, which no single-commit pass can answer',
      ),
      doNotHunt: has('Do not go hunting orphans.'),
      notAUnitYouOwe: has('it is not a unit you owe a disposition on'),
    }).toStrictEqual({ heading: true, reason: true, doNotHunt: true, notAUnitYouOwe: true });
  });

  it('VALID: template => defines exactly the five dispositions, all of which clear a unit', () => {
    expect({
      reviewed: has('| `reviewed` | the concern was checked against this unit and holds |'),
      fixed: has('| `fixed` | a real defect was found here and corrected in place |'),
      routed: has(
        '| `routed` | a real user-visible defect needing a product decision; asked via `ask-user-question` |',
      ),
      recorded: has(
        '| `recorded` | a real finding handed to a named owner, not closed this session |',
      ),
      gap: has('| `gap` | the concern cannot be assessed at this layer — say precisely why |'),
      allClear: has('**Every one of these clears a unit.**'),
      refusesAbsence: has('What it refuses is a unit with NO entry at all.'),
    }).toStrictEqual({
      reviewed: true,
      fixed: true,
      routed: true,
      recorded: true,
      gap: true,
      allClear: true,
      refusesAbsence: true,
    });
  });

  it('VALID: template => says the completion gate is recomputed by signal-back and throws on an undispositioned unit', () => {
    expect({
      heading: /^## Completion is COMPUTED, not remembered$/mu.test(
        blightscoutPromptStatics.prompt.template,
      ),
      throwsOnDone: has(
        "**THROWS on `operationStatus: 'done'` while any unit in your range\ncarries no disposition**",
      ),
      nothingPersisted: has('Nothing is persisted on refusal'),
      signalIsWhatTheChecklistSays: has(
        '7. **Your signal is what the checklist says, not what you remember**',
      ),
    }).toStrictEqual({
      heading: true,
      throwsOnDone: true,
      nothingPersisted: true,
      signalIsWhatTheChecklistSays: true,
    });
  });

  // A scout that waits after ask-user-question ends its turn with no signal-back and wedges every
  // role behind it.
  it('VALID: template => overrides the ask-user-question wait instruction for this non-interactive role', () => {
    expect({
      override: has(
        '**`ask-user-question` replies "do NOT continue generating — wait for the session to resume". That\ninstruction is for interactive chat sessions and does NOT apply to you.**',
      ),
      consequence: has('wedges every role behind you'),
      whatToDoInstead: has('Fire the question,\ndisposition the unit `routed`, carry on.'),
      recordAsYouGo: has('### Gate 5: Record Dispositions As You Go (do NOT batch to the end)'),
      whyNotBatch: has(
        'A session that dies at file four otherwise loses every disposition it earned.',
      ),
    }).toStrictEqual({
      override: true,
      consequence: true,
      whatToDoInstead: true,
      recordAsYouGo: true,
      whyNotBatch: true,
    });
  });

  it('VALID: template => runs seven gates in order and has no eighth', () => {
    const { template } = blightscoutPromptStatics.prompt;

    expect({
      gate1: template.indexOf('### Gate 1: Load Standards (BLOCKING, FIRST)'),
      gate2AfterGate1:
        template.indexOf("### Gate 2: Get Your Commit's Checklist (BLOCKING)") >
        template.indexOf('### Gate 1: Load Standards (BLOCKING, FIRST)'),
      gate3AfterGate2:
        template.indexOf('### Gate 3: Review Every Unit (THIS IS YOUR CORE JOB)') >
        template.indexOf("### Gate 2: Get Your Commit's Checklist (BLOCKING)"),
      gate4AfterGate3:
        template.indexOf('### Gate 4: Fix What You Found, In Place') >
        template.indexOf('### Gate 3: Review Every Unit (THIS IS YOUR CORE JOB)'),
      gate5AfterGate4:
        template.indexOf('### Gate 5: Record Dispositions As You Go (do NOT batch to the end)') >
        template.indexOf('### Gate 4: Fix What You Found, In Place'),
      gate6AfterGate5:
        template.indexOf('### Gate 6: Ward (BLOCKING)') >
        template.indexOf('### Gate 5: Record Dispositions As You Go (do NOT batch to the end)'),
      gate7AfterGate6:
        template.indexOf(
          '### Gate 7: Commit and Signal (BLOCKING — do not end your turn before this)',
        ) > template.indexOf('### Gate 6: Ward (BLOCKING)'),
      gate8: template.indexOf('### Gate 8'),
    }).toStrictEqual({
      gate1: template.indexOf('### Gate 1: Load Standards (BLOCKING, FIRST)'),
      gate2AfterGate1: true,
      gate3AfterGate2: true,
      gate4AfterGate3: true,
      gate5AfterGate4: true,
      gate6AfterGate5: true,
      gate7AfterGate6: true,
      gate8: -1,
    });
  });

  it('VALID: template => Gate 1 loads the three standards tools before any judgement is made', () => {
    expect({
      allThree: has('Call `get-architecture`, `get-syntax-rules` and `get-testing-patterns`.'),
      trainingIsWrong: has('your training defaults are wrong for it'),
      oneToolSearchBatch: has('in the SAME first `ToolSearch` batch'),
    }).toStrictEqual({ allThree: true, trainingIsWrong: true, oneToolSearchBatch: true });
  });

  it('VALID: template => Gate 6 builds unpiped first, then runs ONE scoped foreground ward', () => {
    expect({
      buildFirst: has('`npm run build` FIRST, as its own command, and confirm it exits 0'),
      neverPipe: has('never pipe it, because piping\ndiscards the exit code'),
      scopedRun: has('npm run ward -- -- <the files you changed>'),
      neverBareFullWard: has(
        "never run the bare full `npm run ward`\n— that is the orchestrator's own ward operation item",
      ),
    }).toStrictEqual({
      buildFirst: true,
      neverPipe: true,
      scopedRun: true,
      neverBareFullWard: true,
    });
  });

  it('VALID: template => carries the hard DO NOT STASH rule', () => {
    const needle = '**Hard rule — DO NOT STASH.**';
    const { template } = blightscoutPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => signals complete with operationStatus done, and reserves blocked for an environment wall', () => {
    expect({
      doneCall: has(
        "signal-back({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'done' })",
      ),
      partialHandsOverNamedRemainder: has(
        'signal\n`partial`, which hands the NAMED remainder to a fresh session of your role and costs one pt-chain\nattempt',
      ),
      fixingIsTheJob: has('**Fixing something is the job, not a reason to hand yourself back.**'),
      noFailureSignal: has('**There is no failure signal for work you could have done.**'),
      exitlineExactlyOneSignal: has('exactly one accepted `signal-back` as your final action'),
    }).toStrictEqual({
      doneCall: true,
      partialHandsOverNamedRemainder: true,
      fixingIsTheJob: true,
      noFailureSignal: true,
      exitlineExactlyOneSignal: true,
    });
  });

  it('VALID: template => grants fix authority including writing the missing test case, red-first for semantic fixes', () => {
    expect({
      section: /^## What you may change$/mu.test(blightscoutPromptStatics.prompt.template),
      missingTests: has('**Missing test cases** — write them.'),
      redFirst: has(
        "**Semantic fixes** — land with the repo's red-first discipline: write or strengthen the test that\n  pins the corrected behaviour, watch it fail, then fix.",
      ),
      closeTheHole: has('**Close the hole; do not rebuild the feature.**'),
      tooLargeIsNotAWall: has('**A fix too large for this session is not a wall.**'),
    }).toStrictEqual({
      section: true,
      missingTests: true,
      redFirst: true,
      closeTheHole: true,
      tooLargeIsNotAWall: true,
    });
  });

  it('VALID: template => skips every mechanical rule lint already owns', () => {
    expect({
      skipAll: has('Skip ALL of it.'),
      lintOwnsMechanics: has('Lint already enforces every mechanical rule'),
      whatIsLeft: has('What is left is the judgement a linter cannot make.'),
      purposeHeaderTruth: has('Lint checks the header EXISTS, never that it is TRUE'),
    }).toStrictEqual({
      skipAll: true,
      lintOwnsMechanics: true,
      whatIsLeft: true,
      purposeHeaderTruth: true,
    });
  });
});
