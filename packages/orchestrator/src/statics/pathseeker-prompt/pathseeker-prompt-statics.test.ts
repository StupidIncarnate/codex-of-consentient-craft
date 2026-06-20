import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';

import { pathseekerPromptStatics } from './pathseeker-prompt-statics';

describe('pathseekerPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(pathseekerPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => embeds the shared agent operating rules', () => {
    const rules = agentOperatingRulesStatics.markdown;
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(template.indexOf(rules), template.indexOf(rules) + rules.length);

    expect(found).toBe(rules);
  });

  it('VALID: prompt template => has a "How you summon a minion" section', () => {
    expect(pathseekerPromptStatics.prompt.template).toMatch(/^## How you summon a minion$/mu);
  });

  it('VALID: prompt template => summons minions via minion-fetch with no workItemId', () => {
    const needle = 'because a summoned minion has none';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => minions return a final message and do not signal-back', () => {
    const needle = 'returns a short summary as its final message';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => has the Wave A surface-minion summon section', () => {
    expect(pathseekerPromptStatics.prompt.template).toMatch(
      /^### Wave A — Surface minions \(parallel, one per slice\)$/mu,
    );
  });

  it('VALID: prompt template => has the Wave B cleanup-minion summon section', () => {
    expect(pathseekerPromptStatics.prompt.template).toMatch(
      /^### Wave B — Cleanup minions \(parallel, AFTER Wave A is fully complete\)$/mu,
    );
  });

  it('VALID: prompt template => runs the architect-review walk itself', () => {
    expect(pathseekerPromptStatics.prompt.template).toMatch(
      /^## Phase 3: Architect-Review Walk \(you run this yourself — warm\)$/mu,
    );
  });

  it('VALID: prompt template => carries the shared-state lifecycle reconciliation check', () => {
    const needle = '(e) Shared-state lifecycle reconciliation.';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => mandates isolate:true prototype steps for novelty', () => {
    const needle = 'isolate: true';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => promotes cross-step state constraints to assertions', () => {
    const needle = '**Promote cross-step state constraints to assertions, not mechanics.**';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => forbids authoring a ward / quality-gate step', () => {
    const needle = '**Do NOT author a step whose job is to run ward or any quality gate.**';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => the walk deletes ward-run steps', () => {
    const needle = '- **Ward-run step.**';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => the walk consolidates scattered verification steps', () => {
    const needle = '- **Scattered verification steps.**';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => does NOT revive the seek_scope status', () => {
    expect(pathseekerPromptStatics.prompt.template.indexOf('seek_scope')).toBe(-1);
  });

  it('VALID: prompt template => does NOT revive the seek_synth status', () => {
    expect(pathseekerPromptStatics.prompt.template.indexOf('seek_synth')).toBe(-1);
  });

  it('VALID: prompt template => does NOT revive the seek_walk status', () => {
    expect(pathseekerPromptStatics.prompt.template.indexOf('seek_walk')).toBe(-1);
  });
});
