import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';
import { blightPartitionStatics } from '../blight-partition/blight-partition-statics';

import { blightwardenPromptStatics } from './blightwarden-prompt-statics';

const has = (needle: string): boolean => blightwardenPromptStatics.prompt.template.includes(needle);

describe('blightwardenPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(blightwardenPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => length exceeds 3000 characters', () => {
    expect(blightwardenPromptStatics.prompt.template.length).toBeGreaterThan(3000);
  });

  it('VALID: template => length stays under the MCP verbatim-delivery ceiling', () => {
    expect(blightwardenPromptStatics.prompt.template.length).toBeLessThan(
      mcpToolResultStatics.maxVerbatimChars,
    );
  });

  it('VALID: template => carries the $ARGUMENTS placeholder exactly once, under the Operation Context heading', () => {
    const { template } = blightwardenPromptStatics.prompt;

    expect({
      count: template.split('$ARGUMENTS').length - 1,
      ownLine: /^\$ARGUMENTS$/mu.test(template),
      heading: /^## Operation Context$/mu.test(template),
      underTheHeading: has('## Operation Context\n\n$ARGUMENTS'),
    }).toStrictEqual({ count: 1, ownLine: true, heading: true, underTheHeading: true });
  });

  it('VALID: template => titles the role a whole-diff audit operator, not assigned to a file or flow', () => {
    expect({
      title: /^# Blightwarden - Whole-Diff Audit Operator$/mu.test(
        blightwardenPromptStatics.prompt.template,
      ),
      ownsOneItem: has("You own ONE operation item on the quest's operations ledger"),
      notFixpoint: has('**You are an operator, not a fixpoint pass.**'),
    }).toStrictEqual({ title: true, ownsOneItem: true, notFixpoint: true });
  });

  it('VALID: template => embeds the shared operating rules verbatim', () => {
    expect(has(agentOperatingRulesStatics.markdown)).toBe(true);
  });

  it('VALID: template => forbids editing the ledger while owning the blightLedger surface', () => {
    expect({
      forbidsLedgerEdit: has('**You do NOT edit the operations ledger.**'),
      ownsBlightLedger: has(
        'The ONE quest surface you DO write is `quest.planningNotes.blightLedger`',
      ),
    }).toStrictEqual({ forbidsLedgerEdit: true, ownsBlightLedger: true });
  });

  it('VALID: template => explains why scope must come from baseRef, not a hand-rolled diff against the default branch', () => {
    expect({
      measureRule: has("**Measure your diff from the quest's pinned `baseRef`, never by hand.**"),
      forbidsHandDiff: has('git diff <main-or-master>...HEAD'),
      returned30: has('returned 30 changed files'),
      touched173: has('the quest had actually touched 173'),
    }).toStrictEqual({
      measureRule: true,
      forbidsHandDiff: true,
      returned30: true,
      touched173: true,
    });
  });

  it('VALID: template => states completion is computed, decomposing the diff into file x concern units', () => {
    expect({
      heading: /^## Completion is COMPUTED, not remembered$/mu.test(
        blightwardenPromptStatics.prompt.template,
      ),
      fourConcerns: has('every changed impl file crossed with each of four concerns'),
      concernList: has('`craft`, `perf`, `dedup`,\n`integrity`'),
      derivedIds: has('The ids are DERIVED'),
    }).toStrictEqual({
      heading: true,
      fourConcerns: true,
      concernList: true,
      derivedIds: true,
    });
  });

  it('VALID: template => excludes dead code from the per-file concerns and routes it to its own whole-diff wave', () => {
    expect({
      notAConcern: has('Dead code is NOT one of them, deliberately:'),
      why: has(
        'whether an export has a consumer is a property of the\nwhole import graph, and no per-file unit can answer it',
      ),
      ownsNoUnit: has('whose findings you fix and report but which owns no checklist unit.'),
      coverageCut: blightwardenPromptStatics.prompt.template.indexOf('`coverage`'),
      securityCut: blightwardenPromptStatics.prompt.template.indexOf('`security`'),
    }).toStrictEqual({
      notAConcern: true,
      why: true,
      ownsNoUnit: true,
      coverageCut: -1,
      securityCut: -1,
    });
  });

  it('VALID: template => lists every disposition and says all of them clear a unit', () => {
    expect({
      reviewed: has('| `reviewed` |'),
      fixed: has('| `fixed` |'),
      routed: has('| `routed` |'),
      recorded: has('| `recorded` |'),
      gap: has('| `gap` |'),
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

  it('VALID: template => signal-back throws on done while any unit carries no disposition', () => {
    expect({
      throws: has("THROWS on `operationStatus: 'done'` while any unit on"),
      askTheTool: has('Ask the tool what is left; do not consult your memory of what you'),
    }).toStrictEqual({ throws: true, askTheTool: true });
  });

  it('VALID: template => calls get-blight-checklist rather than reading the spec or hand-rolling a diff', () => {
    expect({
      gate: /^### Gate 2: Get the Checklist \(BLOCKING\)$/mu.test(
        blightwardenPromptStatics.prompt.template,
      ),
      toolCall: has("get-blight-checklist({ questId: 'QUEST_ID' })"),
      doNotRederive: has('**Do not re-derive its pass**'),
      realState: has('A quest with no pinned `baseRef`, or an empty diff, is a real state'),
    }).toStrictEqual({ gate: true, toolCall: true, doNotRederive: true, realState: true });
  });

  it('VALID: template => cuts groups by package first and dispatches blightwarden-group-minion in parallel', () => {
    expect({
      gate: /^### Gate 3: Partition & Dispatch blightwarden-group-minion \(BLOCKING\)$/mu.test(
        blightwardenPromptStatics.prompt.template,
      ),
      packageFirst: has('**Groups are cut by PACKAGE first.**'),
      neverSpans: has('**A group NEVER spans two sections.**'),
      byConstruction: has(
        'That is what makes the groups disjoint by construction rather\nthan by your care',
      ),
      phantomFailures: has(
        'minions editing the same file produce phantom typecheck failures that get misdiagnosed as stale\ndist',
      ),
      colocatedTestFree: has(
        'An implementation file and its colocated test land\nin the same group for free',
      ),
      singleMessage: has(
        'Summon one `blightwarden-group-minion` per group, ALL in a SINGLE message with multiple `Agent` tool calls',
      ),
      minionFetch: has(
        "get-agent-prompt({ agent: 'blightwarden-group-minion', questId: 'QUEST_ID' })",
      ),
      mustNeverCall: has('must never call'),
      noStandardsDigest: has('**Do NOT paste a standards digest into its brief**'),
    }).toStrictEqual({
      gate: true,
      packageFirst: true,
      neverSpans: true,
      byConstruction: true,
      phantomFailures: true,
      colocatedTestFree: true,
      singleMessage: true,
      minionFetch: true,
      mustNeverCall: true,
      noStandardsDigest: true,
    });
  });

  it('VALID: template => gives the files under no declared package their own trailing section rather than a neighbour', () => {
    expect({
      section: has('**`NO DECLARED PACKAGE` is a real section, and it is the last one.**'),
      ownGroups: has('they get\ntheir own groups, cut to the same size'),
      notAdjacent: has(
        'Do not fold\nthem into a neighbouring package because the path looks adjacent',
      ),
      pathIsNotEvidence: has('a path is not evidence of ownership.'),
    }).toStrictEqual({
      section: true,
      ownGroups: true,
      notAdjacent: true,
      pathIsNotEvidence: true,
    });
  });

  it('VALID: template => sizes groups and caps the wave from blightPartitionStatics, not from prose', () => {
    expect({
      target: has(
        `**at most ${blightPartitionStatics.targetFilesPerGroup} changed files per group**`,
      ),
      cap: has(
        `**never more than ${blightPartitionStatics.maxConcurrentMinions} minions in flight at once**`,
      ),
      nextWave: has('dispatch the cap, wait for that wave to return, then dispatch the next.'),
      rulesRecap: has(
        `3. **One package per group, at most ${blightPartitionStatics.targetFilesPerGroup} files each, at most ${blightPartitionStatics.maxConcurrentMinions} in flight**`,
      ),
    }).toStrictEqual({ target: true, cap: true, nextWave: true, rulesRecap: true });
  });

  it('VALID: template => dispatches ONE blightwarden-crosscut-minion alone over the whole diff', () => {
    expect({
      gate: /^### Gate 4: Second Wave — blightwarden-crosscut-minion, ALONE \(BLOCKING\)$/mu.test(
        blightwardenPromptStatics.prompt.template,
      ),
      summonsOne: has('summon ONE `blightwarden-crosscut-minion`,'),
      alone: has('ALONE, over the WHOLE diff — never split this wave across more than one.'),
    }).toStrictEqual({ gate: true, summonsOne: true, alone: true });
  });

  it('VALID: template => dispatches ONE blightwarden-deadcode-minion alone, third, over the whole diff', () => {
    expect({
      gate: /^### Gate 5: Third Wave — blightwarden-deadcode-minion, ALONE \(BLOCKING\)$/mu.test(
        blightwardenPromptStatics.prompt.template,
      ),
      summonsOne: has('summon ONE `blightwarden-deadcode-minion`, ALONE, over the'),
      neverSplit: has('WHOLE diff — never split this wave either.'),
      whyWholeGraph: has(
        '**a file cannot tell you whether its own export has a consumer**, so orphan detection\nneeds the whole import graph at once.',
      ),
      ownsNoUnit: has('and why it owns no checklist unit.'),
      whyThird: has(
        'It runs THIRD, not second, because every fix the earlier waves landed can itself orphan something',
      ),
      showsItsWork: has('a claimed orphan with no search behind it is not evidence.'),
      rulesRecap: has(
        '4. **Both whole-diff waves run ALONE, after the groups: crosscut, then dead code**',
      ),
    }).toStrictEqual({
      gate: true,
      summonsOne: true,
      neverSplit: true,
      whyWholeGraph: true,
      ownsNoUnit: true,
      whyThird: true,
      showsItsWork: true,
      rulesRecap: true,
    });
  });

  it('VALID: template => makes verifying every artifact the core job, never trusting a summary alone', () => {
    expect({
      gate: /^### Gate 6: Verify Every Artifact \(THIS IS YOUR CORE JOB\)$/mu.test(
        blightwardenPromptStatics.prompt.template,
      ),
      artifactIsClaim: has('An artifact is a claim.'),
      openFiles: has('changed — never trust a summary alone.**'),
    }).toStrictEqual({ gate: true, artifactIsClaim: true, openFiles: true });
  });

  it('VALID: template => records dispositions as it goes rather than batching to the end', () => {
    expect({
      gate: /^### Gate 7: Record Dispositions As You Go \(do NOT batch to the end\)$/mu.test(
        blightwardenPromptStatics.prompt.template,
      ),
      ledgerWrite: has("modify-quest({ questId: 'QUEST_ID', planningNotes: { blightLedger: ["),
      writeAsYouGo: has('**Write them as you go, not at the end.**'),
      askUserQuestionCaveat: has('does NOT apply to you.**'),
    }).toStrictEqual({
      gate: true,
      ledgerWrite: true,
      writeAsYouGo: true,
      askUserQuestionCaveat: true,
    });
  });

  it('VALID: template => runs one scoped ward over every file touched, never a bare directory', () => {
    expect({
      gate: /^### Gate 8: Ward \(BLOCKING\)$/mu.test(blightwardenPromptStatics.prompt.template),
      wardCommand: has('npm run ward -- -- <the files changed>'),
      neverBareDirectory: has('paths, never a bare directory:'),
    }).toStrictEqual({ gate: true, wardCommand: true, neverBareDirectory: true });
  });

  it('VALID: template => owns the single commit, forbids minions from git, and carries the DO NOT STASH rule', () => {
    expect({
      gate: /^### Gate 9: Commit and Signal \(BLOCKING — do not end your turn before this\)$/mu.test(
        blightwardenPromptStatics.prompt.template,
      ),
      ownsCommit: has("**You own the session's single commit.**"),
      noStash: has('**Hard rule — DO NOT STASH.**'),
    }).toStrictEqual({ gate: true, ownsCommit: true, noStash: true });
  });

  it('VALID: template => ends by recalling the checklist and letting the remaining count decide the signal', () => {
    expect({
      oneLastTime: has('Call `get-blight-checklist` ONE LAST TIME'),
      numberDecides: has('not your recollection, decides your signal.'),
    }).toStrictEqual({ oneLastTime: true, numberDecides: true });
  });

  it('VALID: template => signals done with the exact operator call shape', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(
      /^signal-back\(\{ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'done' \}\)$/mu,
    );
  });

  it('VALID: template => signals partial with the exact operator call shape', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(
      /^signal-back\(\{ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'partial' \}\)$/mu,
    );
  });

  it('VALID: template => fixing something is the job, and a refused done means read the named units', () => {
    expect({
      fixingIsTheJob: has('**Fixing something is the job, not a reason to hand yourself back.**'),
      gateRefuses: has('will refuse and name them'),
      gateIsNotABug: has('gate doing its job, not a bug to work around.'),
      noFailureSignal: has('**There is no failure signal for work you could have done.**'),
    }).toStrictEqual({
      fixingIsTheJob: true,
      gateRefuses: true,
      gateIsNotABug: true,
      noFailureSignal: true,
    });
  });

  it('VALID: template => briefs minions with a minion-fetch carrying no workItemId, and names both minions', () => {
    expect({
      protocol: /^## Minion Delegation Protocol$/mu.test(blightwardenPromptStatics.prompt.template),
      minionFetch: has("get-agent-prompt({ agent: '<minion-name>', questId: 'QUEST_ID' })"),
      onlyContext: has('**Your spawn message is the ONLY quest context it gets.**'),
      wholeDiffBrief: has(
        "For the two whole-diff minions — `blightwarden-crosscut-minion` and\n   `blightwarden-deadcode-minion` — replace `YOUR GROUP` / `UNITS TO REVIEW` with the whole\n   diff's file list.",
      ),
      minionName: has('blightwarden-group-minion'),
      crosscutMinionName: has('blightwarden-crosscut-minion'),
      deadcodeMinionName: has('blightwarden-deadcode-minion'),
    }).toStrictEqual({
      protocol: true,
      minionFetch: true,
      onlyContext: true,
      wholeDiffBrief: true,
      minionName: true,
      crosscutMinionName: true,
      deadcodeMinionName: true,
    });
  });

  it('VALID: template => keeps the Docs Update Conventions section and the closing Rules recap', () => {
    expect({
      docsHeading: /^## Docs Update Conventions$/mu.test(blightwardenPromptStatics.prompt.template),
      rulesHeading: /^## Rules$/mu.test(blightwardenPromptStatics.prompt.template),
      askTheToolRule: has(
        '1. **Ask the tool, do not enumerate** — `get-blight-checklist` is the definition of done',
      ),
      signalRule: has('7. **Your signal is what the checklist says, not what you remember**'),
    }).toStrictEqual({
      docsHeading: true,
      rulesHeading: true,
      askTheToolRule: true,
      signalRule: true,
    });
  });

  it('VALID: template => carries no trace of the fixpoint model or the old blightReports/lawbringer surfaces', () => {
    const { template } = blightwardenPromptStatics.prompt;

    expect({
      convergence: template.indexOf('Convergence IS the verdict'),
      changedNothing: template.indexOf('changed NOTHING'),
      blightReports: template.indexOf('blightReports'),
      lawbringerLower: template.indexOf('lawbringer'),
      lawbringerUpper: template.indexOf('Lawbringer'),
      failedReplan: template.indexOf('failed-replan'),
      pathSeeker: template.indexOf('PathSeeker'),
    }).toStrictEqual({
      convergence: -1,
      changedNothing: -1,
      blightReports: -1,
      lawbringerLower: -1,
      lawbringerUpper: -1,
      failedReplan: -1,
      pathSeeker: -1,
    });
  });
});
