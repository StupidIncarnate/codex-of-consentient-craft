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

  it('VALID: template => small-scope skip rule appears in Dispatch section', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(
      /^\*\*Small-scope skip:\*\* If `planningNotes\.scopeClassification\.size === 'small'`, skip minion dispatch entirely\. Audit inline yourself — read `git diff main\.\.\.HEAD` and eyeball for any of the 5 concerns\. Write a single `minion: 'synthesizer'` report summarizing findings \(empty findings is fine for a clean small-scope diff\)\. Proceed to Synthesis\.$/mu,
    );
  });

  it('VALID: template => Dispatch section spawns 5 minions in parallel', () => {
    expect(blightwardenPromptStatics.prompt.template).toMatch(
      /^Spawn all 5 minions in a SINGLE MESSAGE with parallel Agent tool calls\. Use `model: "sonnet"`\. Each minion uses the same prompt shape, only the `agent` name differs:$/mu,
    );
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
});
