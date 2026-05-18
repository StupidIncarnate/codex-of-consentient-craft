import { QuestIdStub, QuestWorkItemIdStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { buildSpawnInstructionLayerBroker } from './build-spawn-instruction-layer-broker';
import { buildSpawnInstructionLayerBrokerProxy } from './build-spawn-instruction-layer-broker.proxy';

const PATHSEEKER_VARIANT_ROLES = [
  'pathseeker-surface',
  'pathseeker-dedup',
  'pathseeker-assertion-correctness',
  'pathseeker-walk',
] as const;

describe('buildSpawnInstructionLayerBroker', () => {
  it('VALID: {questId, codeweaver workItem} => returns a SpawnInstruction with the interpolated taskPrompt', () => {
    buildSpawnInstructionLayerBrokerProxy();
    const questId = QuestIdStub({ value: 'quest-spawn' });
    const workItemId = QuestWorkItemIdStub({
      value: 'aaaaaaaa-1111-4222-9333-444444444444',
    });
    const workItem = WorkItemStub({ id: workItemId, role: 'codeweaver', status: 'pending' });

    const result = buildSpawnInstructionLayerBroker({ questId, workItem });

    expect(result).toStrictEqual({
      questId,
      role: 'codeweaver',
      workItemId,
      taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete" | "failed",\n  summary: "<one-line>"\n}).`,
    });
  });

  it.each(PATHSEEKER_VARIANT_ROLES)(
    'VALID: {questId, %s workItem} => returns a SpawnInstruction with the interpolated taskPrompt',
    (role) => {
      buildSpawnInstructionLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-spawn-pathseeker' });
      const workItemId = QuestWorkItemIdStub({
        value: 'cccccccc-1111-4222-9333-444444444444',
      });
      const workItem = WorkItemStub({ id: workItemId, role, status: 'pending' });

      const result = buildSpawnInstructionLayerBroker({ questId, workItem });

      expect(result).toStrictEqual({
        questId,
        role,
        workItemId,
        taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "${role}",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete" | "failed",\n  summary: "<one-line>"\n}).`,
      });
    },
  );

  it('INVALID: {workItem with non-agent role like ward} => agentRoleContract.parse throws', () => {
    buildSpawnInstructionLayerBrokerProxy();
    const questId = QuestIdStub({ value: 'quest-ward-as-agent' });
    const workItemId = QuestWorkItemIdStub({
      value: 'bbbbbbbb-1111-4222-9333-444444444444',
    });
    const workItem = WorkItemStub({
      id: workItemId,
      role: 'ward',
      status: 'pending',
      spawnerType: 'command',
    });

    expect(() => buildSpawnInstructionLayerBroker({ questId, workItem })).toThrow(
      /Invalid enum value/u,
    );
  });
});
