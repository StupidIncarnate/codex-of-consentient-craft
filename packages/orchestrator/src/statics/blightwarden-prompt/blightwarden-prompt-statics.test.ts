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

  it('VALID: template => Read Minion Reports section appears', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(/^## Read Minion Reports$/mu);
  });

  it('VALID: template => states the synthesizer summons the minions itself', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(
      /^You summon the minions yourself, as `Agent` sub-agents within your own turn \(see "Summon the Minions" below\)\. They are NOT work items and the orchestrator does not dispatch them — you do, then you read what they wrote\.$/mu,
    );
  });

  it('VALID: template => Minion-Failure Handling section appears', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(/^## Minion-Failure Handling$/mu);
  });

  it('VALID: template => Synthesis section combines carry-over and fresh findings', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(
      /^## Synthesis — Combine Carry-Over \+ Fresh$/mu,
    );
  });

  it('VALID: template => Inline-Fix Rules section lists mechanical-scope boundary', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(
      /^## Inline-Fix Rules \(Mechanical Scope\)$/mu,
    );
  });

  it('VALID: template => Docs Update Conventions section references terse bullet style', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(/^## Docs Update Conventions$/mu);
  });

  it('VALID: template => Final Verdict section appears with decision matrix', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(/^## Final Verdict$/mu);
  });

  it('VALID: template => Signal-Back section covers failed-replan literal', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(/^ {2}signal: 'failed-replan',$/mu);
  });

  it('VALID: template => Spiritmender exclusion noted', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(
      /^\*\*Spiritmender is NOT on your routing map\.\*\* Spiritmender handles ward\/lint\/type\/test errors only\.$/mu,
    );
  });

  it('VALID: template => has the commit-inline-fixes section', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(/^## Committing Inline Fixes$/mu);
  });

  it('VALID: template => carries the hard DO NOT STASH rule', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(
      /^\*\*Hard rule — DO NOT STASH\.\*\*$/mu,
    );
  });

  it('VALID: template => embeds the shared agent operating rules', () => {
    const rules = agentOperatingRulesStatics.markdown;
    const { template } = blightwardenPromptStatics.prompt;
    const found = template.slice(template.indexOf(rules), template.indexOf(rules) + rules.length);

    expect(found).toBe(rules);
  });
});
