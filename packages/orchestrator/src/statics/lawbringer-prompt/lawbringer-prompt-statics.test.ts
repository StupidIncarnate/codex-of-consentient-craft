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

  it('VALID: title => frames Lawbringer as a review orchestrator', () => {
    expect(lawbringerPromptStatics.prompt.template).toMatch(
      /^# Lawbringer - Code Review Orchestrator$/mu,
    );
  });

  it('VALID: prompt template => summons lawbringer-minion sub-agents via get-agent-prompt', () => {
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

  it('VALID: prompt template => partitions at the parent discretion, not one minion per pair', () => {
    expect(lawbringerPromptStatics.prompt.template).toMatch(
      /^Do NOT mechanically spawn one minion per pair\.$/mu,
    );
  });

  it('VALID: prompt template => runs one ward across the whole batch (Run Ward & Fix On Red)', () => {
    expect(lawbringerPromptStatics.prompt.template).toMatch(/^### 6\. Run Ward & Fix On Red$/mu);
  });

  it('VALID: focus => defers business-logic to siegemaster and flow-walk coverage to PathSeeker', () => {
    expect(lawbringerPromptStatics.prompt.template).toMatch(
      /^Business-logic correctness is siegemaster's and observable \/ flow-walk coverage is PathSeeker's — don't re-litigate those, but if a minion spots a clear bug it fixes it\.$/mu,
    );
  });

  it('VALID: prompt template => carries the hard DO NOT STASH rule', () => {
    expect(lawbringerPromptStatics.prompt.template).toMatch(
      /^\*\*Hard rule — DO NOT STASH\.\*\*$/mu,
    );
  });

  it('VALID: prompt template => has the commit-before-signal section', () => {
    expect(lawbringerPromptStatics.prompt.template).toMatch(/^## Committing & Signaling$/mu);
  });

  it('VALID: prompt template => documents the whole-diff bug-hunt review mode', () => {
    expect(lawbringerPromptStatics.prompt.template).toMatch(/^## Review Mode$/mu);
  });

  it('VALID: prompt template => does not reference removed verify-minion roles', () => {
    const { template } = lawbringerPromptStatics.prompt;

    expect(template.indexOf('Verify Minion')).toBe(-1);
    expect(template.indexOf('Quest Review Minion')).toBe(-1);
  });

  it('VALID: template => embeds the shared agent operating rules', () => {
    const rules = agentOperatingRulesStatics.markdown;
    const { template } = lawbringerPromptStatics.prompt;
    const found = template.slice(template.indexOf(rules), template.indexOf(rules) + rules.length);

    expect(found).toBe(rules);
  });

  it('VALID: prompt template => forbids pasting a standards digest into the minion brief', () => {
    const needle =
      'Do NOT paste a standards digest into the brief — the minion loads its own standards.';
    const { template } = lawbringerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => pins subagent_type general-purpose on each Agent spawn', () => {
    const needle = 'subagent_type: "general-purpose"';
    const { template } = lawbringerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => recovery play pulls a no-artifact minion edits via git', () => {
    const needle =
      'If a summoned minion returns NO artifact (or comes back stuck waiting on a backgrounded command), do NOT resume or re-summon it.';
    const { template } = lawbringerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => failed signals a code failure a spiritmender fixes, never blocking the quest', () => {
    const needle =
      'Signal `failed` for a **code failure** — a violation or bug you found but could NOT fix within your own scope — so a spiritmender fixes the code and you re-review it; this NEVER blocks the quest.';
    const { template } = lawbringerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => failed-replan signals a plan hole PathSeeker re-plans, never blocking the quest', () => {
    const needle =
      'Signal `failed-replan` for a **plan hole** — the code is structurally wrong against the plan itself, or a missing/incorrect contract or step no in-scope fix can close — so PathSeeker can re-plan; this NEVER blocks the quest either.';
    const { template } = lawbringerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => signal-back examples cover complete, code-failure, and plan-hole outcomes', () => {
    const complete = "signal-back({ signal: 'complete',";
    const failed = "signal-back({ signal: 'failed',";
    const failedReplan = "signal-back({ signal: 'failed-replan',";
    const { template } = lawbringerPromptStatics.prompt;

    expect(template.indexOf(complete)).toBeGreaterThan(-1);
    expect(template.indexOf(failed)).toBeGreaterThan(-1);
    expect(template.indexOf(failedReplan)).toBeGreaterThan(-1);
  });

  it('VALID: prompt template => never describes a signal as blocking the quest', () => {
    const { template } = lawbringerPromptStatics.prompt;

    expect(template.indexOf('BLOCKs the quest')).toBe(-1);
  });
});
