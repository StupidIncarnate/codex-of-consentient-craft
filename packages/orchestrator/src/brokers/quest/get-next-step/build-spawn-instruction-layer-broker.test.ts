import {
  QuestIdStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { buildSpawnInstructionLayerBroker } from './build-spawn-instruction-layer-broker';
import { buildSpawnInstructionLayerBrokerProxy } from './build-spawn-instruction-layer-broker.proxy';

describe('buildSpawnInstructionLayerBroker', () => {
  describe('fresh dispatch', () => {
    it('VALID: {questId, codeweaver workItem} => returns a SpawnInstruction with the interpolated fresh taskPrompt and no resume fields', () => {
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
        taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).`,
      });
    });

    it('VALID: {workItem with sessionId but resume NOT set} => no resumeSessionId and no resumePrompt', () => {
      buildSpawnInstructionLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-session-no-resume' });
      const workItemId = QuestWorkItemIdStub({
        value: 'dddddddd-1111-4222-9333-444444444444',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'codeweaver',
        status: 'pending',
        sessionId: SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' }),
      });

      const result = buildSpawnInstructionLayerBroker({ questId, workItem });

      expect(result).toStrictEqual({
        questId,
        role: 'codeweaver',
        workItemId,
        taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).`,
      });
    });

    it('VALID: {workItem with resume: true but NO sessionId} => falls back to fresh spawn with no resume fields', () => {
      buildSpawnInstructionLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-resume-no-session' });
      const workItemId = QuestWorkItemIdStub({
        value: 'eeeeeeee-1111-4222-9333-444444444444',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'pesteater',
        status: 'pending',
        resume: true,
      });

      const result = buildSpawnInstructionLayerBroker({ questId, workItem });

      expect(result).toStrictEqual({
        questId,
        role: 'pesteater',
        workItemId,
        taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "pesteater",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).`,
      });
    });
  });

  describe('resume dispatch', () => {
    it('VALID: {workItem with resume: true AND sessionId} => instruction gains resumeSessionId and the resume-variant resumePrompt; taskPrompt stays fresh', () => {
      buildSpawnInstructionLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-resume' });
      const workItemId = QuestWorkItemIdStub({
        value: 'cccccccc-1111-4222-9333-444444444444',
      });
      const sessionId = SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'codeweaver',
        status: 'pending',
        resume: true,
        sessionId,
      });

      const result = buildSpawnInstructionLayerBroker({ questId, workItem });

      expect(result).toStrictEqual({
        questId,
        role: 'codeweaver',
        workItemId,
        taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).`,
        resumeSessionId: sessionId,
        resumePrompt: `Your previous session for this work item was interrupted — you already have its context above. Verify what you completed (git status + recent commits), finish the remaining scope of your operation item, commit a prose handoff, then call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}). If you no longer have context, call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions.`,
      });
    });
  });

  describe('invalid roles', () => {
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
});
