import {
  AgentIdStub,
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

    it('VALID: {workItem with sessionId AND agentId} => fresh spawn, because that sessionId is the MCP parent loop session', () => {
      buildSpawnInstructionLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-mcp-dispatched' });
      const workItemId = QuestWorkItemIdStub({
        value: 'ffffffff-1111-4222-9333-444444444444',
      });
      // get-agent-prompt stamps sessionId + agentId TOGETHER on the MCP/Task path, where sessionId
      // is the user's /dumpster-launch loop session. Resuming it would hand a headless child the
      // user's own interactive session.
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'siegemaster',
        status: 'pending',
        resume: true,
        sessionId: SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' }),
        agentId: AgentIdStub({ value: 'a0a7f82d9619a1800' }),
      });

      const result = buildSpawnInstructionLayerBroker({ questId, workItem });

      expect(result).toStrictEqual({
        questId,
        role: 'siegemaster',
        workItemId,
        taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "siegemaster",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).`,
      });
    });
  });

  describe('resume dispatch', () => {
    it('VALID: {workItem with sessionId and NO resume marker} => still resumes, because a retained session is never clobbered', () => {
      buildSpawnInstructionLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-session-no-marker' });
      const workItemId = QuestWorkItemIdStub({
        value: 'dddddddd-1111-4222-9333-444444444444',
      });
      const sessionId = SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'codeweaver',
        status: 'pending',
        sessionId,
      });

      const result = buildSpawnInstructionLayerBroker({ questId, workItem });

      expect(result).toStrictEqual({
        questId,
        role: 'codeweaver',
        workItemId,
        taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).`,
        resumeSessionId: sessionId,
        resumePrompt: `You were CUT OFF mid-work on this item — your session was killed, not paused cleanly. The context above therefore stops abruptly and your LAST ACTION MAY NEVER HAVE COMPLETED: an edit may not have been written, a command may have died mid-run, a commit may not exist. Do not treat your own context as a record of what landed.\n\nRE-ESTABLISH THE CURRENT STATE FIRST, before doing any new work:\n1. Run \`git status\` and \`git log --oneline -5\` — what is actually committed, and what is still uncommitted?\n2. Re-read the files you believe you edited, and confirm the change is really on disk.\n3. Re-run whatever you were in the middle of verifying (a test, a ward run, a browser step) instead of trusting the remembered result.\n\nOnly once you know the real state: finish the remaining scope of your operation item, commit a prose handoff, then call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).\n\nIf you have no usable context above, call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions from the top.`,
      });
    });

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
        resumePrompt: `You were CUT OFF mid-work on this item — your session was killed, not paused cleanly. The context above therefore stops abruptly and your LAST ACTION MAY NEVER HAVE COMPLETED: an edit may not have been written, a command may have died mid-run, a commit may not exist. Do not treat your own context as a record of what landed.\n\nRE-ESTABLISH THE CURRENT STATE FIRST, before doing any new work:\n1. Run \`git status\` and \`git log --oneline -5\` — what is actually committed, and what is still uncommitted?\n2. Re-read the files you believe you edited, and confirm the change is really on disk.\n3. Re-run whatever you were in the middle of verifying (a test, a ward run, a browser step) instead of trusting the remembered result.\n\nOnly once you know the real state: finish the remaining scope of your operation item, commit a prose handoff, then call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).\n\nIf you have no usable context above, call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions from the top.`,
      });
    });

    it('VALID: {each dispatchable agent role carrying a sessionId} => resumes regardless of worker type', () => {
      buildSpawnInstructionLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-every-role' });
      const workItemId = QuestWorkItemIdStub({
        value: 'abababab-1111-4222-9333-444444444444',
      });
      const sessionId = SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });

      const resumedRoles = (
        [
          'codeweaver',
          'flowrider',
          'siegemaster',
          'blightwarden',
          'spiritmender',
          'pesteater',
        ] as const
      ).map((role) => {
        const workItem = WorkItemStub({ id: workItemId, role, status: 'pending', sessionId });
        const instruction = buildSpawnInstructionLayerBroker({ questId, workItem });
        return { role, resumeSessionId: instruction.resumeSessionId };
      });

      expect(resumedRoles).toStrictEqual([
        { role: 'codeweaver', resumeSessionId: sessionId },
        { role: 'flowrider', resumeSessionId: sessionId },
        { role: 'siegemaster', resumeSessionId: sessionId },
        { role: 'blightwarden', resumeSessionId: sessionId },
        { role: 'spiritmender', resumeSessionId: sessionId },
        { role: 'pesteater', resumeSessionId: sessionId },
      ]);
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
