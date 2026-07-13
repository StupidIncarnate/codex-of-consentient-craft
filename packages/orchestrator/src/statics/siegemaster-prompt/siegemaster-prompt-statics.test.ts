import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';

import { siegemasterPromptStatics } from './siegemaster-prompt-statics';

describe('siegemasterPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(siegemasterPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => length exceeds 2000 characters', () => {
    expect(siegemasterPromptStatics.prompt.template.length).toBeGreaterThan(2000);
  });

  it('VALID: template => carries the $ARGUMENTS placeholder exactly once, on its own line', () => {
    expect(siegemasterPromptStatics.prompt.template.split('$ARGUMENTS').length - 1).toBe(1);
    expect(siegemasterPromptStatics.prompt.template).toMatch(/^\$ARGUMENTS$/mu);
  });

  it('VALID: template => titles the role a manual QA relay worker', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^# Siegemaster - Manual QA Relay Worker$/mu,
    );
  });

  it('VALID: template => frames the role as owning ONE operation item on the ledger', () => {
    const needle = "You own ONE operation item on the quest's operations ledger";
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => declares there is no failure, only moving forward', () => {
    const needle = '**There is no failure — only moving forward.** You have no failure signal.';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => forbids editing the operations ledger', () => {
    const needle = '**You do NOT edit the operations ledger.**';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => fixes what it finds, TDD-first, instead of reporting', () => {
    const needle = '**You fix what you find, TDD-first.**';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => demands observation over inspection (a green suite is not an observation)', () => {
    const principle = '**Verification means OBSERVATION, not inspection.**';
    const claimVsObservation =
      'a green test suite is a claim about the system, not an observation of it';
    const { template } = siegemasterPromptStatics.prompt;
    const foundPrinciple = template.slice(
      template.indexOf(principle),
      template.indexOf(principle) + principle.length,
    );
    const foundClaim = template.slice(
      template.indexOf(claimVsObservation),
      template.indexOf(claimVsObservation) + claimVsObservation.length,
    );

    expect({ foundPrinciple, foundClaim }).toStrictEqual({
      foundPrinciple: principle,
      foundClaim: claimVsObservation,
    });
  });

  it('VALID: template => frames every spine flow as a map to walk', () => {
    const needle = '**Each flow on the spine is a map.**';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => declares observables are not just I/O (custom = behavioral invariant)', () => {
    const notJustIo = '**Observables hang off the nodes — and they are NOT just I/O.**';
    const customInvariant = 'is a behavioral invariant, not an I/O surface';
    const { template } = siegemasterPromptStatics.prompt;
    const foundNotJustIo = template.slice(
      template.indexOf(notJustIo),
      template.indexOf(notJustIo) + notJustIo.length,
    );
    const foundCustom = template.slice(
      template.indexOf(customInvariant),
      template.indexOf(customInvariant) + customInvariant.length,
    );

    expect({ foundNotJustIo, foundCustom }).toStrictEqual({
      foundNotJustIo: notJustIo,
      foundCustom: customInvariant,
    });
  });

  it('VALID: template => opens the gate block with the Manual QA Gates header', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(/^## Manual QA Gates$/mu);
  });

  it('VALID: template => declares gates are sequential with exit criteria and no skipping', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^Gates are sequential\. Each has exit criteria\. Do not skip\.$/mu,
    );
  });

  it('VALID: template => carries exactly one Exit Criteria per gate (eight gates)', () => {
    const exitCriteriaCount =
      siegemasterPromptStatics.prompt.template.split('**Exit Criteria:**').length - 1;

    expect(exitCriteriaCount).toBe(8);
  });

  it('VALID: template => Gate 1 loads standards, verifies against git, and maps every flow', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^### Gate 1: Load Standards, Verify Against Git & Map Every Flow \(MCP — BLOCKING, do this FIRST\)$/mu,
    );
  });

  it('VALID: template => Gate 1 trusts git over the ledger and loads the immutable spine', () => {
    const gitOverLedger = '**Trust git\nover the ledger.**';
    const spine =
      'Load the quest spine: `get-quest` (stage `spec`) for the flows (nodes, edges, observables),\ncontracts, and design decisions. The spine is immutable — it is your acceptance target.';
    const { template } = siegemasterPromptStatics.prompt;
    const foundGit = template.slice(
      template.indexOf(gitOverLedger),
      template.indexOf(gitOverLedger) + gitOverLedger.length,
    );
    const foundSpine = template.slice(
      template.indexOf(spine),
      template.indexOf(spine) + spine.length,
    );

    expect({ foundGit, foundSpine }).toStrictEqual({ foundGit: gitOverLedger, foundSpine: spine });
  });

  it('VALID: template => Gate 2 stands up the real system and picks the verification surface', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^### Gate 2: Stand Up the Real System & Pick Your Surface$/mu,
    );
  });

  it('VALID: template => a backend (API/CLI/queue) flow is driven by curl, not a browser', () => {
    const needle =
      'That IS the manual QA for a backend flow, NOT a fallback — do not open a browser for it.';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => resets state between branch walks (established Gate 2, applied before every walk)', () => {
    const establish = '**Establish how you RESET state between walks — before you start walking.**';
    const apply =
      "**Each branch walk owns its state — reset to the path's precondition before EVERY walk (happy, sad, or off-map).**";
    const { template } = siegemasterPromptStatics.prompt;
    const foundEstablish = template.slice(
      template.indexOf(establish),
      template.indexOf(establish) + establish.length,
    );
    const foundApply = template.slice(
      template.indexOf(apply),
      template.indexOf(apply) + apply.length,
    );

    expect({ foundEstablish, foundApply }).toStrictEqual({
      foundEstablish: establish,
      foundApply: apply,
    });
  });

  it('VALID: template => Gate 3 walks the happy paths for real', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^### Gate 3: Walk the Happy Paths \(run it for real\)$/mu,
    );
  });

  it('VALID: template => confirms the happy path first before trying to break anything', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^This is your first active phase — exploration the automated tests are blind to\. \*\*Confirm the happy path works BEFORE you try to break anything\.\*\*$/mu,
    );
  });

  it('VALID: template => defines manual QA as driving the real browser via the Claude-in-Chrome MCP', () => {
    const needle = 'drive the actual browser via the **Claude-in-Chrome MCP**';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => Gate 4 walks the sad paths and requires every terminal reached for real', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^### Gate 4: Walk the Sad Paths \(every drawn error\/skip branch\)$/mu,
    );

    const needle = 'Every terminal on every map, success or error, must be reached for real.';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => checks out-of-band artifacts (db/disk/logs) outside the browser, including sad-path side-effects', () => {
    const outsideBrowser = 'the browser cannot show you a database write or a file on disk.';
    const noUnwantedWrite = 'confirm the failure left NO unwanted side-effect';
    const { template } = siegemasterPromptStatics.prompt;
    const foundOutside = template.slice(
      template.indexOf(outsideBrowser),
      template.indexOf(outsideBrowser) + outsideBrowser.length,
    );
    const foundNoWrite = template.slice(
      template.indexOf(noUnwantedWrite),
      template.indexOf(noUnwantedWrite) + noUnwantedWrite.length,
    );

    expect({ foundOutside, foundNoWrite }).toStrictEqual({
      foundOutside: outsideBrowser,
      foundNoWrite: noUnwantedWrite,
    });
  });

  it('VALID: template => Gate 5 goes off the map for missed paths and breakage pockets', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^### Gate 5: Go Off the Map — Missed Paths & Breakage Pockets$/mu,
    );
  });

  it('VALID: template => Gate 6 audits the suite for false-positive greens', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^### Gate 6: Audit the Suite for False-Positive Greens$/mu,
    );
  });

  it('VALID: template => audits the existing suite scoped, path-agnostic (no hardcoded package)', () => {
    const needle = 'npm run ward -- --only e2e,integration -- <ui-package>/src/flows/<route>';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => Gate 7 TDD-fixes findings with a failing test first', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^### Gate 7: TDD-Fix What You Found$/mu,
    );

    const needle = '**Failing test FIRST.** For each break, write (or strengthen) a test';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => Gate 8 commits and signals via the verify fixpoint', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(/^### Gate 8: Commit & Signal$/mu);
  });

  it('VALID: template => declares the commit message the only handoff channel', () => {
    const needle =
      '**The commit message is the ONLY handoff channel — git carries the context, not the ledger.**';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => carries the hard DO NOT STASH rule', () => {
    const needle = '**Hard rule — DO NOT STASH.**';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => signals partial when the pass changed code (fresh session re-walks)', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^signal-back\(\{ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'partial' \}\)$/mu,
    );
  });

  it('VALID: template => signals done when the pass changed nothing', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^signal-back\(\{ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'done' \}\)$/mu,
    );
  });

  it('VALID: template => states convergence is the verdict (fresh pass that changes nothing)', () => {
    const needle =
      '**Convergence IS the verdict: only a fresh pass that changes nothing proves the flows hold.**';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => carries no legacy signal or planning-model references', () => {
    const { template } = siegemasterPromptStatics.prompt;
    const legacyNeedles = [
      'failed-replan',
      "'failed'",
      'PathSeeker',
      'Spiritmender',
      'You change NO files',
      'FAILED OBSERVABLES',
      'replan',
    ];
    const legacyHits = legacyNeedles.filter((needle) => template.includes(needle));

    expect(legacyHits.join(', ')).toBe('');
  });

  it('VALID: template => leads with operating rules read first', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^## Operating Rules — READ FIRST \(ignoring these wedges the whole quest\)$/mu,
    );
  });

  it('VALID: template => embeds the shared agent operating rules', () => {
    const rules = agentOperatingRulesStatics.markdown;
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(template.indexOf(rules), template.indexOf(rules) + rules.length);

    expect(found).toBe(rules);
  });

  it('VALID: template => hardcodes no UI package path and carries no .spec.ts references', () => {
    expect(siegemasterPromptStatics.prompt.template.indexOf('packages/web')).toBe(-1);
    expect(siegemasterPromptStatics.prompt.template.indexOf('.spec.ts')).toBe(-1);
  });

  it('VALID: template => has the Operation Context heading', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(/^## Operation Context$/mu);
  });
});
