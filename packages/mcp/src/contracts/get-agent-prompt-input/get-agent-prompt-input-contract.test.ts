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

  // A minion has no workItemId to derive a discipline from, so the discipline that parameterizes
  // its shared planner/worker/reviewer prompt template must arrive as an explicit field instead.
  it("VALID: {agent: 'worker-minion', discipline: 'implementation'} => parses without a workItemId", () => {
    const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });

    const result = getAgentPromptInputContract.parse({
      agent: 'worker-minion',
      questId,
      discipline: 'implementation',
    });

    expect(result).toStrictEqual({
      agent: 'worker-minion',
      questId,
      discipline: 'implementation',
    });
  });

  it("INVALID: {discipline: 'browser-visual'} => throws, that discipline pack does not exist", () => {
    expect(() => {
      getAgentPromptInputContract.parse({
        agent: 'worker-minion',
        questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
        discipline: 'browser-visual',
      });
    }).toThrow(/Invalid enum value/u);
  });
});
