import { QuestIdStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { AgentRoleStub } from '../../../contracts/agent-role/agent-role.stub';
import { buildTaskPromptLayerBroker } from './build-task-prompt-layer-broker';
import { buildTaskPromptLayerBrokerProxy } from './build-task-prompt-layer-broker.proxy';

describe('buildTaskPromptLayerBroker', () => {
  it('VALID: {role: codeweaver, workItemId, questId} => interpolates all three into the task prompt', () => {
    buildTaskPromptLayerBrokerProxy();
    const role = AgentRoleStub({ value: 'codeweaver' });
    const workItemId = QuestWorkItemIdStub({
      value: 'aaaaaaaa-1111-4222-9333-444444444444',
    });
    const questId = QuestIdStub({ value: 'quest-prompt' });

    const result = buildTaskPromptLayerBroker({ role, workItemId, questId });

    expect(String(result)).toBe(
      `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete" | "failed",\n  summary: "<one-line>"\n}).`,
    );
  });

  it('VALID: {role: pathseeker} => uses the pathseeker agent name', () => {
    buildTaskPromptLayerBrokerProxy();
    const role = AgentRoleStub({ value: 'pathseeker' });
    const workItemId = QuestWorkItemIdStub({
      value: 'bbbbbbbb-1111-4222-9333-444444444444',
    });
    const questId = QuestIdStub({ value: 'quest-ps-prompt' });

    const result = buildTaskPromptLayerBroker({ role, workItemId, questId });

    expect(String(result)).toBe(
      `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "pathseeker",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete" | "failed",\n  summary: "<one-line>"\n}).`,
    );
  });
});
