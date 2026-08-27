import { QuestIdStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { getAgentPromptInputContract } from './get-agent-prompt-input-contract';
import { GetAgentPromptInputStub } from './get-agent-prompt-input.stub';

describe('getAgentPromptInputContract', () => {
  it('VALID: {agent + questId + workItemId} => parses successfully', () => {
    const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
    const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });

    const result = getAgentPromptInputContract.parse({
      agent: 'codeweaver',
      questId,
      workItemId,
    });

    expect(result).toStrictEqual({
      agent: 'codeweaver',
      questId,
      workItemId,
    });
  });

  it('VALID: {default stub} => parses with default agent, questId, workItemId', () => {
    const input = GetAgentPromptInputStub();

    const result = getAgentPromptInputContract.parse(input);

    expect(result).toStrictEqual({
      agent: 'chaoswhisperer-gap-minion',
      questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
      workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
    });
  });

  it('VALID: {agent: "pathseeker-surface"} => parses successfully', () => {
    const input = GetAgentPromptInputStub({ agent: 'pathseeker-surface' });

    const result = getAgentPromptInputContract.parse(input);

    expect(result).toStrictEqual({
      agent: 'pathseeker-surface',
      questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
      workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
    });
  });

  it('INVALID: {agent: ""} => throws validation error', () => {
    expect(() => {
      getAgentPromptInputContract.parse({
        agent: '',
        questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
        workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
      });
    }).toThrow(/too_small/u);
  });

  it('INVALID: {missing agent} => throws validation error', () => {
    expect(() => {
      getAgentPromptInputContract.parse({
        questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
        workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
      });
    }).toThrow(/Required/u);
  });

  it('INVALID: {missing questId} => throws validation error', () => {
    expect(() => {
      getAgentPromptInputContract.parse({
        agent: 'codeweaver',
        workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
      });
    }).toThrow(/Required/u);
  });

  it('VALID: {missing workItemId} => parses (a parent-summoned minion omits it)', () => {
    const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });

    const result = getAgentPromptInputContract.parse({
      agent: 'chaoswhisperer-gap-minion',
      questId,
    });

    expect(result).toStrictEqual({
      agent: 'chaoswhisperer-gap-minion',
      questId,
    });
  });

  it('INVALID: {workItemId: "not-a-uuid"} => throws validation error', () => {
    expect(() => {
      getAgentPromptInputContract.parse({
        agent: 'codeweaver',
        questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
        workItemId: 'not-a-uuid',
      });
    }).toThrow(/Invalid uuid/u);
  });

  it('INVALID: {questId: ""} => throws validation error', () => {
    expect(() => {
      getAgentPromptInputContract.parse({
        agent: 'codeweaver',
        questId: '',
        workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
      });
    }).toThrow(/too_small/u);
  });

  // The fifteen round minions are named for the role that summons them, and the name alone selects
  // the prompt. Each is summoned by its parent rather than dispatched against a work item, so the
  // whole input is the name plus the quest.
  it("VALID: {agent: 'codeweaver-worker-minion', questId} => parses a per-role round minion with no workItemId", () => {
    const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });

    const result = getAgentPromptInputContract.parse({
      agent: 'codeweaver-worker-minion',
      questId,
    });

    expect(result).toStrictEqual({
      agent: 'codeweaver-worker-minion',
      questId,
    });
  });

  // `discipline` chose which of five packs filled a shared template's `$DISCIPLINE` placeholder.
  // Per-role prompts removed the placeholder, the packs and the field together. A stale caller still
  // sending it is NOT refused — the schema is not `.strict()`, so the key is dropped and the
  // orchestrator is handed `{agent, questId}` and nothing else.
  it("VALID: {agent: 'siegemaster-reviewer-minion', discipline: 'manual-qa'} => strips the removed discipline field", () => {
    const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });

    const result = getAgentPromptInputContract.parse({
      agent: 'siegemaster-reviewer-minion',
      questId,
      discipline: 'manual-qa',
    });

    expect(result).toStrictEqual({
      agent: 'siegemaster-reviewer-minion',
      questId,
    });
  });
});
