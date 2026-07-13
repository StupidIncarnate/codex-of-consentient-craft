import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';

import { lawbringerPromptStatics } from './lawbringer-prompt-statics';

describe('lawbringerPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(lawbringerPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => carries the $ARGUMENTS placeholder exactly once, on its own line', () => {
    expect(lawbringerPromptStatics.prompt.template.split('$ARGUMENTS').length - 1).toBe(1);
    expect(lawbringerPromptStatics.prompt.template).toMatch(/^\$ARGUMENTS$/mu);
  });

  it('VALID: title => frames Lawbringer as a standards review relay worker', () => {
    expect(lawbringerPromptStatics.prompt.template).toMatch(
      /^# Lawbringer - Standards Review Relay Worker$/mu,
    );
  });

  it('VALID: template => frames the role as owning ONE operation item on the ledger', () => {
    const needle = "You own ONE operation item on the quest's operations ledger";
    const { template } = lawbringerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => scopes the review to the whole quest diff, self-scoped from git', () => {
    const needle =
      'Your scope is the **WHOLE quest diff** — every changed file\non the branch, self-scoped by you from git; there is no per-package or per-file dispatch.';
    const { template } = lawbringerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => declares there is no failure, only moving forward', () => {
    const needle = '**There is no failure — only moving forward.** You have no failure signal.';
    const { template } = lawbringerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => forbids editing the operations ledger', () => {
    const needle = '**You do NOT edit the operations ledger.**';
    const { template } = lawbringerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => has a verify-against-git step that trusts git over the ledger', () => {
    expect(lawbringerPromptStatics.prompt.template).toMatch(
      /^### 1\. Verify Your Operation Item Against Git \(BLOCKING\)$/mu,
    );

    const needle = '**Trust git over\nthe ledger.**';
    const { template } = lawbringerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => reads the whole diff against the default branch as pairs', () => {
    expect(lawbringerPromptStatics.prompt.template).toMatch(/^### 3\. Read the Whole Diff$/mu);

    const needle = 'Treat every changed non-test file + its colocated test as a pair.';
    const { template } = lawbringerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => summons lawbringer-minion sub-agents via get-agent-prompt', () => {
    const { template } = lawbringerPromptStatics.prompt;

    const minion = "agent: 'lawbringer-minion'";

    expect(template.slice(template.indexOf(minion), template.indexOf(minion) + minion.length)).toBe(
      minion,
    );

    const fetch = 'mcp__dungeonmaster__get-agent-prompt';

    expect(template.slice(template.indexOf(fetch), template.indexOf(fetch) + fetch.length)).toBe(
      fetch,
    );
  });

  it('VALID: template => partitions at the parent discretion, not one minion per pair', () => {
    expect(lawbringerPromptStatics.prompt.template).toMatch(
      /^Do NOT mechanically spawn one minion per pair\.$/mu,
    );
  });

  it('VALID: template => runs one ward across the whole batch (Run Ward & Fix On Red)', () => {
    expect(lawbringerPromptStatics.prompt.template).toMatch(/^### 7\. Run Ward & Fix On Red$/mu);
  });

  it('VALID: focus => defers running the system to Siegemaster and flow coverage to Flowrider', () => {
    expect(lawbringerPromptStatics.prompt.template).toMatch(
      /^Running the system for real is Siegemaster's job and flow-level test coverage is Flowrider's — don't re-litigate those, but if a minion spots a clear bug it fixes it\.$/mu,
    );
  });

  it('VALID: template => carries the hard DO NOT STASH rule', () => {
    const needle = '**Hard rule — DO NOT STASH.**';
    const { template } = lawbringerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => has the commit-before-signal section with the handoff doctrine', () => {
    expect(lawbringerPromptStatics.prompt.template).toMatch(/^## Committing & Signaling$/mu);

    const needle =
      '**The commit message is the ONLY handoff channel — git carries the context, not the ledger.**';
    const { template } = lawbringerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => embeds the shared agent operating rules', () => {
    const rules = agentOperatingRulesStatics.markdown;
    const { template } = lawbringerPromptStatics.prompt;
    const found = template.slice(template.indexOf(rules), template.indexOf(rules) + rules.length);

    expect(found).toBe(rules);
  });

  it('VALID: template => forbids pasting a standards digest into the minion brief', () => {
    const needle =
      'Do NOT paste a standards digest into the brief — the minion loads its own standards.';
    const { template } = lawbringerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => pins subagent_type general-purpose on each Agent spawn', () => {
    const needle = 'subagent_type: "general-purpose"';
    const { template } = lawbringerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => recovery play pulls a no-artifact minion edits via git', () => {
    const needle =
      'If a summoned minion returns NO artifact (or comes back stuck waiting on a backgrounded command), do NOT resume or re-summon it.';
    const { template } = lawbringerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => signals partial when the pass changed code (fresh session re-reviews)', () => {
    expect(lawbringerPromptStatics.prompt.template).toMatch(
      /^signal-back\(\{ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'partial' \}\)$/mu,
    );
  });

  it('VALID: template => signals done when the pass changed nothing', () => {
    expect(lawbringerPromptStatics.prompt.template).toMatch(
      /^signal-back\(\{ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'done' \}\)$/mu,
    );
  });

  it('VALID: template => states convergence is the verdict (fresh pass that changes nothing)', () => {
    const needle =
      '**Convergence IS the verdict: only a fresh pass that changes nothing proves the diff meets\nstandards.**';
    const { template } = lawbringerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => carries no legacy signal or planning-model references', () => {
    const { template } = lawbringerPromptStatics.prompt;
    const legacyNeedles = [
      'failed-replan',
      "'failed'",
      'PathSeeker',
      'spiritmender',
      'Review Mode',
      'replan',
    ];
    const legacyHits = legacyNeedles.filter((needle) => template.includes(needle));

    expect(legacyHits.join(', ')).toBe('');
  });

  it('VALID: template => has the Operation Context heading', () => {
    expect(lawbringerPromptStatics.prompt.template).toMatch(/^## Operation Context$/mu);
  });
});
