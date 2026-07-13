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

  it('VALID: prompt template => declares unit-tests-only scope for the files it builds', () => {
    const needle = '**Unit tests only** for the files you';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => has the commit-before-signal section', () => {
    expect(codeweaverPromptStatics.prompt.template).toMatch(/^## Committing & Signaling$/mu);
  });

  it('VALID: prompt template => carries the hard DO NOT STASH rule', () => {
    const needle = '**Hard rule — DO NOT STASH.**';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
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

  it('VALID: prompt template => forbids editing the operations ledger', () => {
    const needle = '**You do NOT edit the operations ledger.**';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => partitions the work into dependency-ordered minion tasks', () => {
    const needle = '**Partition into minion tasks and order them by dependency.**';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => builds the seams by sequencing dependent pieces', () => {
    const needle = '**Sequence the seams** — dependent pieces in order, one owner per seam';
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

  it('VALID: prompt template => reserves hand-written code for fixing and integrating', () => {
    expect(codeweaverPromptStatics.prompt.template).toMatch(/^### Gate 7: Fix & Integrate$/mu);
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

  it('VALID: prompt template => the minion loads its own project standards', () => {
    const needle = 'then load the project standards itself';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => pins subagent_type general-purpose on each Agent spawn', () => {
    const needle = 'subagent_type: "general-purpose"';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => recovery play pulls a struggling minion edits via git', () => {
    const needle = 'If a minion returns no artifact, pull its';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => verifies by reading files, not trusting the artifact summary', () => {
    const needle = 'do NOT trust the artifact summary alone';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => grants authority over interior implementation decisions', () => {
    const needle =
      'implementation decision, local approach choice, and interior discovery (a dependency that won';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => forbids rewriting unrelated areas of the codebase', () => {
    const needle = 'Do not rewrite unrelated areas of the';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => declares there is no failure, only moving forward', () => {
    const needle = '**There is no failure — only moving forward.**';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => signals complete with operationStatus done when scope is finished', () => {
    const needle =
      "signal-back({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'done' })";
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => signals complete with operationStatus partial when work remains', () => {
    const needle =
      "signal-back({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'partial' })";
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => rule 9 forbids ledger writes and failure signals', () => {
    const needle =
      '**No ledger writes, no failure signals** — outcome rides on signal-back as done|partial';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });
});
