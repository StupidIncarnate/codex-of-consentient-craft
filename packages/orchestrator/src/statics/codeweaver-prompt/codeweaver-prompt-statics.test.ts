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

  it('VALID: prompt template => forbids pasting a standards digest into the minion brief', () => {
    const needle =
      'Do NOT paste a standards digest into the brief — the minion loads its own standards.';
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
    const needle =
      'If a minion returns no artifact or is stuck on a backgrounded command, do NOT resume it';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => cautions against offloading verification to an Explore agent', () => {
    const needle =
      'an `Explore` agent finds files and usages but does NOT reliably audit line-level semantics';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => grants in-slice planning authority', () => {
    const needle = '**You have authority over your own slice.**';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => forbids touching other slices', () => {
    const needle = '**Stay inside your slice.**';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => distinguishes the failed vs failed-replan escape hatches by kind of wall', () => {
    const needle =
      "A cross-slice contract mismatch or an architectural gap no in-slice decision can close is `signal-back({ signal: 'failed-replan', ... })`; it routes to PathSeeker, which fixes the quest's plan.";
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => Codeweaver emits three signals', () => {
    const needle = '**Codeweaver emits three signals: `complete`, `failed`, or `failed-replan`.**';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => failed never blocks the quest, spiritmender fixes and re-runs', () => {
    const needle =
      '`failed` is an in-slice code failure you could not fix — a spiritmender fixes it, ward re-verifies, then you re-run to continue; it NEVER blocks the quest.';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => failed-replan never blocks the quest, PathSeeker re-plans', () => {
    const needle =
      "`failed-replan` is a plan hole you could not reconcile in-slice — PathSeeker fixes the quest's plan; it NEVER blocks the quest either.";
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });
});
