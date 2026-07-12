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

  it('VALID: template => failed routes to a spiritmender via the orchestrator, not summoned directly', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(
      /^\*\*You never summon Spiritmender yourself\.\*\* A `failed` signal \(you cannot run at all, or an inline fix broke the build and you cannot resolve it\) tells the orchestrator to splice a spiritmender that fixes the code, then re-run you — it is not one of the five minions and you never call it directly\. Semantic findings still route through `failed-replan` to PathSeeker, never to Spiritmender\.$/mu,
    );
  });

  it('VALID: template => Signal-Back Rules distinguish CODE FAILURE (failed) from PLAN HOLE (failed-replan)', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(
      /^Use `failed` for a CODE FAILURE — you cannot run at all \(tool access, contradictory quest state\), or an inline fix you applied broke the build and you cannot resolve it; the orchestrator splices a spiritmender to fix the code and re-runs you\. Semantic findings, or a concern you could not audit, are a PLAN HOLE — signal `failed-replan` instead, which routes to PathSeeker\. Neither signal blocks the quest\.$/mu,
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
