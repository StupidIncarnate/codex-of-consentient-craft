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
      `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).`,
    );
  });

  it('VALID: {role: flowrider} => uses the flowrider agent name', () => {
    buildTaskPromptLayerBrokerProxy();
    const role = AgentRoleStub({ value: 'flowrider' });
    const workItemId = QuestWorkItemIdStub({
      value: 'bbbbbbbb-1111-4222-9333-444444444444',
    });
    const questId = QuestIdStub({ value: 'quest-fr-prompt' });

    const result = buildTaskPromptLayerBroker({ role, workItemId, questId });

    expect(String(result)).toBe(
      `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "flowrider",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).`,
    );
  });

  it('VALID: {role: siegemaster, resume: true} => returns the resume-session prompt telling the agent to finish and signal back', () => {
    buildTaskPromptLayerBrokerProxy();
    const role = AgentRoleStub({ value: 'siegemaster' });
    const workItemId = QuestWorkItemIdStub({
      value: 'cccccccc-1111-4222-9333-444444444444',
    });
    const questId = QuestIdStub({ value: 'quest-resume-prompt' });

    const result = buildTaskPromptLayerBroker({ role, workItemId, questId, resume: true });

    expect(String(result)).toBe(
      `Your previous session for this work item was interrupted — you already have its context above. Verify what you completed (git status + recent commits), finish the remaining scope of your operation item, commit a prose handoff, then call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}). If you no longer have context, call mcp__dungeonmaster__get-agent-prompt({\n  agent: "siegemaster",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions.`,
    );
  });
});
