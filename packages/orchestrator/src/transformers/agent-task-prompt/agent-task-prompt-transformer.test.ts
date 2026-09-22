import { QuestIdStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { AgentPromptNameStub } from '../../contracts/agent-prompt-name/agent-prompt-name.stub';
import { AgentRoleStub } from '../../contracts/agent-role/agent-role.stub';
import { agentTaskPromptTransformer } from './agent-task-prompt-transformer';

describe('agentTaskPromptTransformer', () => {
  describe('fresh dispatch prompt', () => {
    it('VALID: {agent: codeweaver-worker, workItemId, questId} => interpolates all three, routes the marks and the outcome through quest-work, and signals with no outcome key', () => {
      const agent = AgentPromptNameStub({ value: 'codeweaver-worker' });
      const workItemId = QuestWorkItemIdStub({
        value: 'aaaaaaaa-1111-4222-9333-444444444444',
      });
      const questId = QuestIdStub({ value: 'quest-prompt' });

      const result = agentTaskPromptTransformer({ agent, workItemId, questId });

      expect(String(result)).toBe(
        `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver-worker",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
      );
    });

    it('VALID: {agent: flowrider-worker} => uses the flowrider agent name', () => {
      const agent = AgentPromptNameStub({ value: 'flowrider-worker' });
      const workItemId = QuestWorkItemIdStub({
        value: 'bbbbbbbb-1111-4222-9333-444444444444',
      });
      const questId = QuestIdStub({ value: 'quest-fr-prompt' });

      const result = agentTaskPromptTransformer({ agent, workItemId, questId });

      expect(String(result)).toBe(
        `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "flowrider-worker",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
      );
    });

    it('VALID: {role: spiritmender, resume: false} => returns the fresh prompt, not the resume variant', () => {
      const role = AgentRoleStub({ value: 'spiritmender' });
      const workItemId = QuestWorkItemIdStub({
        value: 'dddddddd-1111-4222-9333-444444444444',
      });
      const questId = QuestIdStub({ value: 'quest-fresh-explicit' });

      const result = agentTaskPromptTransformer({ role, workItemId, questId, resume: false });

      expect(String(result)).toBe(
        `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "spiritmender",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
      );
    });
  });

  describe('resume prompt', () => {
    it('VALID: {agent: siege-planner, resume: true} => returns the resume-session prompt telling the agent to finish, record through quest-work, then signal back', () => {
      const agent = AgentPromptNameStub({ value: 'siege-planner' });
      const workItemId = QuestWorkItemIdStub({
        value: 'cccccccc-1111-4222-9333-444444444444',
      });
      const questId = QuestIdStub({ value: 'quest-resume-prompt' });

      const result = agentTaskPromptTransformer({ agent, workItemId, questId, resume: true });

      expect(String(result)).toBe(
        `You were CUT OFF mid-work on this item — your session was killed, not paused cleanly. The context above therefore stops abruptly and your LAST ACTION MAY NEVER HAVE COMPLETED: an edit may not have been written, a command may have died mid-run, a commit may not exist. Do not treat your own context as a record of what landed.\n\nRE-ESTABLISH THE CURRENT STATE FIRST, before doing any new work:\n1. Run \`git status\` and \`git log --oneline -5\` — what is actually committed, and what is still uncommitted?\n2. Re-read the files you believe you edited, and confirm the change is really on disk.\n3. Re-run whatever you were in the middle of verifying (a test, a ward run, a browser step) instead of trusting the remembered result.\n\nOnly once you know the real state: finish the remaining scope of your operation item and commit a prose handoff. Then RECORD what you did through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})\n\nIf you have no usable context above, call mcp__dungeonmaster__get-agent-prompt({\n  agent: "siege-planner",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions from the top.`,
      );
    });
  });
});
