import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';

import { codeweaverPromptStatics } from './codeweaver-prompt-statics';

describe('codeweaverPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(codeweaverPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: prompt template => declares unit-tests-only scope (no integration/e2e, no flows/startup)', () => {
    expect(codeweaverPromptStatics.prompt.template).toMatch(
      /^\*\*Unit tests only\.\*\* The slice produces `\.test\.ts` unit tests for its focusFiles — your minions author$/mu,
    );
  });

  it('VALID: prompt template => has the commit-before-signal section', () => {
    expect(codeweaverPromptStatics.prompt.template).toMatch(/^## Committing & Signaling$/mu);
  });

  it('VALID: prompt template => carries the hard DO NOT STASH rule', () => {
    expect(codeweaverPromptStatics.prompt.template).toMatch(
      /^\*\*Hard rule — DO NOT STASH\.\*\*$/mu,
    );
  });

  it('VALID: template => embeds the shared agent operating rules', () => {
    const rules = agentOperatingRulesStatics.markdown;
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(template.indexOf(rules), template.indexOf(rules) + rules.length);

    expect(found).toBe(rules);
  });

  it('VALID: prompt template => has a Tactical Plan & Delegation gate', () => {
    expect(codeweaverPromptStatics.prompt.template).toMatch(
      /^### Gate 4: Tactical Plan & Delegation Partition \(BLOCKING — plan and partition up front\)$/mu,
    );
  });

  it('VALID: prompt template => persists the tactical plan to planningNotes.codeweaverPlans', () => {
    const needle = '**Persist the plan to the quest so it survives a respawn.**';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => partitions the slice into dependency-ordered minion tasks', () => {
    const needle = '**Partition your slice into minion tasks and order them by dependency.**';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => builds the seams by sequencing minions, not parent hand-coding', () => {
    const needle =
      '**This is how the seams get built — by ordering, not by you hand-coding the wiring.**';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => has a Dispatch & Sequence Minions gate', () => {
    expect(codeweaverPromptStatics.prompt.template).toMatch(
      /^### Gate 5: Dispatch & Sequence Minions$/mu,
    );
  });

  it('VALID: prompt template => has a Read & Verify Every Piece gate', () => {
    expect(codeweaverPromptStatics.prompt.template).toMatch(
      /^### Gate 6: Read & Verify Every Piece$/mu,
    );
  });

  it('VALID: prompt template => reserves hand-written code for fixing only', () => {
    expect(codeweaverPromptStatics.prompt.template).toMatch(/^### Gate 7: Fix on Red$/mu);
  });

  it('VALID: prompt template => has a Codeweaver-Minion Delegation Protocol section', () => {
    expect(codeweaverPromptStatics.prompt.template).toMatch(
      /^## Codeweaver-Minion Delegation Protocol$/mu,
    );
  });

  it('VALID: prompt template => summons codeweaver-minions via minion-fetch get-agent-prompt', () => {
    const needle = "get-agent-prompt({ agent: 'codeweaver-minion', questId: 'QUEST_ID' })";
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => minion returns a distilled artifact, not a transcript', () => {
    const needle = '**It returns a distilled artifact, not a transcript**';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });
});
