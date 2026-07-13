import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';

import { blightwardenPromptStatics } from './blightwarden-prompt-statics';

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

  it('VALID: template => carries the $ARGUMENTS placeholder exactly once, on its own line', () => {
    expect(blightwardenPromptStatics.prompt.template.split('$ARGUMENTS').length - 1).toBe(1);
    expect(blightwardenPromptStatics.prompt.template).toMatch(/^\$ARGUMENTS$/mu);
  });

  it('VALID: title => frames Blightwarden as a cross-cutting audit relay worker', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(
      /^# Blightwarden - Cross-Cutting Audit Relay Worker$/mu,
    );
  });

  it('VALID: template => frames the role as owning ONE operation item on the ledger', () => {
    const needle = "You own ONE operation item on the quest's operations ledger";
    const { template } = blightwardenPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => declares there is no failure and no replan to escalate to', () => {
    const needle =
      '**There is no failure — only moving forward.** You have no failure signal and there is no replan\nto escalate to.';
    const { template } = blightwardenPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => an unresolvable finding is fixed as far as possible, carried, and signaled partial', () => {
    const needle =
      'fix what you can, leave the rest\n`blocking-carry` in `blightReports[]`, commit with a handoff naming it, and signal `partial`';
    const { template } = blightwardenPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => forbids editing the ledger while owning the blightReports surface', () => {
    const forbid = '**You do NOT edit the operations ledger.**';
    const owns = 'The ONE quest surface you DO write is `planningNotes.blightReports[]`';
    const { template } = blightwardenPromptStatics.prompt;
    const foundForbid = template.slice(
      template.indexOf(forbid),
      template.indexOf(forbid) + forbid.length,
    );
    const foundOwns = template.slice(template.indexOf(owns), template.indexOf(owns) + owns.length);

    expect({ foundForbid, foundOwns }).toStrictEqual({ foundForbid: forbid, foundOwns: owns });
  });

  it('VALID: template => has a verify-against-git gate that trusts git over the ledger', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(
      /^## Verify Your Operation Item Against Git \(BLOCKING\)$/mu,
    );

    const needle = '**Trust git over\nthe ledger.**';
    const { template } = blightwardenPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => Resume Protocol section appears before dispatch', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(
      /^## Resume Protocol \(do this before anything else\)$/mu,
    );
  });

  it('VALID: template => Resume Protocol mentions loading blightReports via section filter', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(
      /^2\. Call `get-quest-planning-notes\(\{ questId: "QUEST_ID", section: 'blight' \}\)` to load every prior `blightReports\[\]` entry\.$/mu,
    );
  });

  it('VALID: template => Resume Protocol partitions reports by status', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(
      /^3\. \*\*Partition reports by status:\*\*$/mu,
    );
  });

  it('VALID: template => Summon the Minions section appears (synthesizer summons them as sub-agents)', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(/^## Summon the Minions$/mu);
  });

  it('VALID: template => states the synthesizer summons the minions itself', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(
      /^You summon the minions yourself, as `Agent` sub-agents within your own turn \(see "Summon the Minions" below\)\. They are NOT work items and the orchestrator does not dispatch them — you do, then you read what they wrote\.$/mu,
    );
  });

  it('VALID: template => summons all five report-only minions by name', () => {
    const { template } = blightwardenPromptStatics.prompt;
    const minions = [
      'blightwarden-security-minion',
      'blightwarden-dedup-minion',
      'blightwarden-perf-minion',
      'blightwarden-integrity-minion',
      'blightwarden-dead-code-minion',
    ];
    const found = minions.filter((name) => template.includes(name));

    expect(found).toStrictEqual(minions);
  });

  it('VALID: template => Read Minion Reports section appears', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(/^## Read Minion Reports$/mu);
  });

  it('VALID: template => Minion-Failure Handling section appears', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(/^## Minion-Failure Handling$/mu);
  });

  it('VALID: template => an unaudited concern is carried forward, never escalated', () => {
    const needle = '**Carry it forward if you cannot.**';
    const { template } = blightwardenPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => Synthesis section fixes findings inline, mechanical and semantic', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(
      /^## Synthesis — Fix What the Reports Found$/mu,
    );

    const needle =
      'Then FIX them inline, largest-risk first. You are not routing findings to someone else — there is\nno one else.';
    const { template } = blightwardenPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => semantic fixes land red-test-first with scoped ward', () => {
    const needle =
      "**Semantic fixes** — sanitization at a taint sink, a performance rewrite, a consumer migration — are ALSO yours, but land them with the repo's red-test-first discipline";
    const { template } = blightwardenPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => Docs Update Conventions section references terse bullet style', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(/^## Docs Update Conventions$/mu);
  });

  it('VALID: template => has the commit-before-signal section with the handoff doctrine', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(/^## Committing & Signaling$/mu);

    const needle =
      '**The commit message is the ONLY handoff channel — git carries the context, not the ledger.**';
    const { template } = blightwardenPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => carries the hard DO NOT STASH rule', () => {
    const needle = '**Hard rule — DO NOT STASH.**';
    const { template } = blightwardenPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => signals partial when the pass changed code or findings remain', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(
      /^signal-back\(\{ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'partial' \}\)$/mu,
    );
  });

  it('VALID: template => signals done only when nothing changed and nothing remains', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(
      /^signal-back\(\{ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'done' \}\)$/mu,
    );
  });

  it('VALID: template => states convergence is the verdict (fresh pass that changes and finds nothing)', () => {
    const needle =
      '**Convergence IS the verdict: only a fresh pass that changes nothing and finds nothing proves the\ndiff is clean.**';
    const { template } = blightwardenPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => carries no legacy signal or planning-model references', () => {
    const { template } = blightwardenPromptStatics.prompt;

    expect(template.indexOf('failed-replan')).toBe(-1);
    expect(template.indexOf('PathSeeker')).toBe(-1);
    expect(template.indexOf('pathseeker')).toBe(-1);
    expect(template.indexOf('Spiritmender')).toBe(-1);
    expect(template.indexOf('spiritmender')).toBe(-1);
  });

  it('VALID: template => embeds the shared agent operating rules', () => {
    const rules = agentOperatingRulesStatics.markdown;
    const { template } = blightwardenPromptStatics.prompt;
    const found = template.slice(template.indexOf(rules), template.indexOf(rules) + rules.length);

    expect(found).toBe(rules);
  });

  it('VALID: template => has the Operation Context heading', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(/^## Operation Context$/mu);
  });
});
