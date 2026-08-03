import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';

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
      sevenConcerns: has('every changed impl file crossed with each of seven concerns'),
      derivedIds: has('The ids are DERIVED'),
    }).toStrictEqual({ heading: true, sevenConcerns: true, derivedIds: true });
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

  it('VALID: template => partitions remaining units into disjoint file groups and dispatches blightwarden-minion in parallel', () => {
    expect({
      gate: /^### Gate 3: Partition & Dispatch blightwarden-minion \(BLOCKING\)$/mu.test(
        blightwardenPromptStatics.prompt.template,
      ),
      disjointRule: has('**Groups MUST be disjoint by file**'),
      phantomFailures: has('typecheck failures that get misdiagnosed as stale dist.'),
      singleMessage: has(
        'Summon one `blightwarden-minion` per group, ALL in a SINGLE message with multiple `Agent` tool calls',
      ),
      minionFetch: has("get-agent-prompt({ agent: 'blightwarden-minion', questId: 'QUEST_ID' })"),
      mustNeverCall: has('must never call'),
      noStandardsDigest: has('**Do NOT paste a standards digest into its brief**'),
    }).toStrictEqual({
      gate: true,
      disjointRule: true,
      phantomFailures: true,
      singleMessage: true,
      minionFetch: true,
      mustNeverCall: true,
      noStandardsDigest: true,
    });
  });

  it('VALID: template => dispatches ONE blightwarden-crosscut-minion alone over the whole diff', () => {
    expect({
      gate: /^### Gate 4: Second Wave — blightwarden-crosscut-minion \(BLOCKING\)$/mu.test(
        blightwardenPromptStatics.prompt.template,
      ),
      summonsOne: has('summon ONE `blightwarden-crosscut-minion`,'),
      alone: has('ALONE, over the WHOLE diff — never split this wave across more than one.'),
    }).toStrictEqual({ gate: true, summonsOne: true, alone: true });
  });

  it('VALID: template => makes verifying every artifact the core job, never trusting a summary alone', () => {
    expect({
      gate: /^### Gate 5: Verify Every Artifact \(THIS IS YOUR CORE JOB\)$/mu.test(
        blightwardenPromptStatics.prompt.template,
      ),
      artifactIsClaim: has('An artifact is a claim.'),
      openFiles: has('changed — never trust a summary alone.**'),
    }).toStrictEqual({ gate: true, artifactIsClaim: true, openFiles: true });
  });

  it('VALID: template => records dispositions as it goes rather than batching to the end', () => {
    expect({
      gate: /^### Gate 6: Record Dispositions As You Go \(do NOT batch to the end\)$/mu.test(
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
      gate: /^### Gate 7: Ward \(BLOCKING\)$/mu.test(blightwardenPromptStatics.prompt.template),
      wardCommand: has('npm run ward -- -- <the files changed>'),
      neverBareDirectory: has('paths, never a bare directory:'),
    }).toStrictEqual({ gate: true, wardCommand: true, neverBareDirectory: true });
  });

  it('VALID: template => owns the single commit, forbids minions from git, and carries the DO NOT STASH rule', () => {
    expect({
      gate: /^### Gate 8: Commit and Signal \(BLOCKING — do not end your turn before this\)$/mu.test(
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
      crosscutBrief: has(
        'For `blightwarden-crosscut-minion`, replace `YOUR GROUP` / `UNITS TO REVIEW` with the whole',
      ),
      minionName: has('blightwarden-minion'),
      crosscutMinionName: has('blightwarden-crosscut-minion'),
    }).toStrictEqual({
      protocol: true,
      minionFetch: true,
      onlyContext: true,
      crosscutBrief: true,
      minionName: true,
      crosscutMinionName: true,
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
