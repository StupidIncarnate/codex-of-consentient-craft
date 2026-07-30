import { QuestIdStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { AgentRoleStub } from '../../contracts/agent-role/agent-role.stub';
import { agentTaskPromptTransformer } from './agent-task-prompt-transformer';

describe('agentTaskPromptTransformer', () => {
  describe('fresh dispatch prompt', () => {
    it('VALID: {role: codeweaver, workItemId, questId} => interpolates all three into the task prompt', () => {
      const role = AgentRoleStub({ value: 'codeweaver' });
      const workItemId = QuestWorkItemIdStub({
        value: 'aaaaaaaa-1111-4222-9333-444444444444',
      });
      const questId = QuestIdStub({ value: 'quest-prompt' });

      const result = agentTaskPromptTransformer({ role, workItemId, questId });

      expect(String(result)).toBe(
        `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).`,
      );
    });

    it('VALID: {role: flowrider} => uses the flowrider agent name', () => {
      const role = AgentRoleStub({ value: 'flowrider' });
      const workItemId = QuestWorkItemIdStub({
        value: 'bbbbbbbb-1111-4222-9333-444444444444',
      });
      const questId = QuestIdStub({ value: 'quest-fr-prompt' });

      const result = agentTaskPromptTransformer({ role, workItemId, questId });

      expect(String(result)).toBe(
        `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "flowrider",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).`,
      );
    });

    it('VALID: {resume: false} => returns the fresh prompt, not the resume variant', () => {
      const role = AgentRoleStub({ value: 'lawbringer' });
      const workItemId = QuestWorkItemIdStub({
        value: 'dddddddd-1111-4222-9333-444444444444',
      });
      const questId = QuestIdStub({ value: 'quest-fresh-explicit' });

      const result = agentTaskPromptTransformer({ role, workItemId, questId, resume: false });

      expect(String(result)).toBe(
        `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "lawbringer",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).`,
      );
    });
  });

  describe('resume prompt', () => {
    it('VALID: {role: siegemaster, resume: true} => returns the resume-session prompt telling the agent to finish and signal back', () => {
      const role = AgentRoleStub({ value: 'siegemaster' });
      const workItemId = QuestWorkItemIdStub({
        value: 'cccccccc-1111-4222-9333-444444444444',
      });
      const questId = QuestIdStub({ value: 'quest-resume-prompt' });

      const result = agentTaskPromptTransformer({ role, workItemId, questId, resume: true });

      expect(String(result)).toBe(
        `You were CUT OFF mid-work on this item — your session was killed, not paused cleanly. The context above therefore stops abruptly and your LAST ACTION MAY NEVER HAVE COMPLETED: an edit may not have been written, a command may have died mid-run, a commit may not exist. Do not treat your own context as a record of what landed.\n\nRE-ESTABLISH THE CURRENT STATE FIRST, before doing any new work:\n1. Run \`git status\` and \`git log --oneline -5\` — what is actually committed, and what is still uncommitted?\n2. Re-read the files you believe you edited, and confirm the change is really on disk.\n3. Re-run whatever you were in the middle of verifying (a test, a ward run, a browser step) instead of trusting the remembered result.\n\nOnly once you know the real state: finish the remaining scope of your operation item, commit a prose handoff, then call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).\n\nIf you have no usable context above, call mcp__dungeonmaster__get-agent-prompt({\n  agent: "siegemaster",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions from the top.`,
      );
    });
  });
});
