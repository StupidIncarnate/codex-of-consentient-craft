import {
  AgentIdStub,
  OperationItemIdStub,
  OperationItemStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  RelatedDataItemStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { PromptTextStub } from '../../../contracts/prompt-text/prompt-text.stub';
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

      const result = buildSpawnInstructionLayerBroker({
        quest: QuestStub({ id: questId }),
        workItem,
      });

      expect(result).toStrictEqual({
        questId,
        role: 'codeweaver',
        workItemId,
        taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
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
        role: 'flowrider',
        status: 'pending',
        resume: true,
      });

      const result = buildSpawnInstructionLayerBroker({
        quest: QuestStub({ id: questId }),
        workItem,
      });

      expect(result).toStrictEqual({
        questId,
        role: 'flowrider',
        workItemId,
        taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "flowrider",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
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

      const result = buildSpawnInstructionLayerBroker({
        quest: QuestStub({ id: questId }),
        workItem,
      });

      expect(result).toStrictEqual({
        questId,
        role: 'siegemaster',
        workItemId,
        taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "siegemaster",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
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

      const result = buildSpawnInstructionLayerBroker({
        quest: QuestStub({ id: questId }),
        workItem,
      });

      expect(result).toStrictEqual({
        questId,
        role: 'codeweaver',
        workItemId,
        taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
        resumeSessionId: sessionId,
        resumePrompt: `You were CUT OFF mid-work on this item — your session was killed, not paused cleanly. The context above therefore stops abruptly and your LAST ACTION MAY NEVER HAVE COMPLETED: an edit may not have been written, a command may have died mid-run, a commit may not exist. Do not treat your own context as a record of what landed.\n\nRE-ESTABLISH THE CURRENT STATE FIRST, before doing any new work:\n1. Run \`git status\` and \`git log --oneline -5\` — what is actually committed, and what is still uncommitted?\n2. Re-read the files you believe you edited, and confirm the change is really on disk.\n3. Re-run whatever you were in the middle of verifying (a test, a ward run, a browser step) instead of trusting the remembered result.\n\nOnly once you know the real state: finish the remaining scope of your operation item and commit a prose handoff. Then RECORD what you did through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})\n\nIf you have no usable context above, call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions from the top.`,
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

      const result = buildSpawnInstructionLayerBroker({
        quest: QuestStub({ id: questId }),
        workItem,
      });

      expect(result).toStrictEqual({
        questId,
        role: 'codeweaver',
        workItemId,
        taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
        resumeSessionId: sessionId,
        resumePrompt: `You were CUT OFF mid-work on this item — your session was killed, not paused cleanly. The context above therefore stops abruptly and your LAST ACTION MAY NEVER HAVE COMPLETED: an edit may not have been written, a command may have died mid-run, a commit may not exist. Do not treat your own context as a record of what landed.\n\nRE-ESTABLISH THE CURRENT STATE FIRST, before doing any new work:\n1. Run \`git status\` and \`git log --oneline -5\` — what is actually committed, and what is still uncommitted?\n2. Re-read the files you believe you edited, and confirm the change is really on disk.\n3. Re-run whatever you were in the middle of verifying (a test, a ward run, a browser step) instead of trusting the remembered result.\n\nOnly once you know the real state: finish the remaining scope of your operation item and commit a prose handoff. Then RECORD what you did through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})\n\nIf you have no usable context above, call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions from the top.`,
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
        ['codeweaver', 'flowrider', 'siegemaster', 'spiritmender', 'warpgate'] as const
      ).map((role) => {
        const workItem = WorkItemStub({ id: workItemId, role, status: 'pending', sessionId });
        const instruction = buildSpawnInstructionLayerBroker({
          quest: QuestStub({ id: questId }),
          workItem,
        });
        return { role, resumeSessionId: instruction.resumeSessionId };
      });

      expect(resumedRoles).toStrictEqual([
        { role: 'codeweaver', resumeSessionId: sessionId },
        { role: 'flowrider', resumeSessionId: sessionId },
        { role: 'siegemaster', resumeSessionId: sessionId },
        { role: 'spiritmender', resumeSessionId: sessionId },
        { role: 'warpgate', resumeSessionId: sessionId },
      ]);
    });
  });

  describe('smoketest prompt override', () => {
    it('VALID: {workItem carrying smoketestPromptOverride} => taskPrompt IS the canned script, not the interpolated role prompt', () => {
      buildSpawnInstructionLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-smoketest-override' });
      const workItemId = QuestWorkItemIdStub({
        value: '58a837a1-7e08-41b5-bf02-d32a57122660',
      });
      const override = PromptTextStub({
        value:
          'Do exactly one thing and nothing else: Call "mcp__dungeonmaster__signal-back" with { "signal": "complete", "operationStatus": "done" }. Do not output anything else.',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'codeweaver',
        status: 'pending',
        smoketestPromptOverride: override,
      });

      const result = buildSpawnInstructionLayerBroker({
        quest: QuestStub({ id: questId }),
        workItem,
      });

      expect(result).toStrictEqual({
        questId,
        role: 'codeweaver',
        workItemId,
        taskPrompt: override,
      });
    });

    it('VALID: {workItem carrying smoketestPromptOverride AND a retained sessionId} => the canned script wins on the resume path too', () => {
      buildSpawnInstructionLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-smoketest-override-resume' });
      const workItemId = QuestWorkItemIdStub({
        value: '58a837a1-7e08-41b5-bf02-d32a57122661',
      });
      const sessionId = SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });
      const override = PromptTextStub({
        value:
          'Do exactly one thing and nothing else: Call "mcp__dungeonmaster__signal-back" with { "signal": "complete", "operationStatus": "done" }. Do not output anything else.',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'flowrider',
        status: 'pending',
        sessionId,
        smoketestPromptOverride: override,
      });

      const result = buildSpawnInstructionLayerBroker({
        quest: QuestStub({ id: questId }),
        workItem,
      });

      expect(result).toStrictEqual({
        questId,
        role: 'flowrider',
        workItemId,
        taskPrompt: override,
        resumeSessionId: sessionId,
        resumePrompt: override,
      });
    });
  });

  describe('the step names the role', () => {
    // The defect this covers killed the whole dispatch scan, not one item: `agentRoleContract`
    // threw `Invalid enum value … received 'ward'` from inside the scan, so a quest carrying one
    // undispatchable repair stalled every quest behind it too.
    it('VALID: {ward scope work item at the repair step} => dispatches as spiritmender with the spiritmender task prompt', () => {
      const proxy = buildSpawnInstructionLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-ward-repair' });
      const workItemId = QuestWorkItemIdStub({
        value: 'baaaaaaa-1111-4222-9333-444444444444',
      });
      const operationId = OperationItemIdStub({
        value: 'baaaaaaa-2222-4222-9333-444444444444',
      });
      const operation = OperationItemStub({
        id: operationId,
        role: 'ward',
        text: 'Ward gate (full monorepo)',
        status: 'in_progress',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'ward',
        status: 'pending',
        step: 'repair',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
      });
      const quest = QuestStub({
        id: questId,
        operations: [operation],
        workItems: [workItem],
      });

      const result = buildSpawnInstructionLayerBroker({ quest, workItem });

      expect({
        role: result.role,
        agentLine: String(result.taskPrompt).split('\n')[1],
        declined: proxy.getDeclinedPromptReports(),
      }).toStrictEqual({
        role: 'spiritmender',
        agentLine: '  agent: "spiritmender",',
        declined: [],
      });
    });

    // Claude is spawned as the scope role (codeweaver) and reads the step's prompt (codeweaver-reviewer).
    it('VALID: {codeweaver scope work item at the review step} => dispatches on its scope role with the step prompt in taskPrompt', () => {
      const proxy = buildSpawnInstructionLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-codeweaver-work' });
      const workItemId = QuestWorkItemIdStub({
        value: 'caaaaaaa-1111-4222-9333-444444444444',
      });
      const operationId = OperationItemIdStub({
        value: 'caaaaaaa-2222-4222-9333-444444444444',
      });
      const operation = OperationItemStub({
        id: operationId,
        role: 'codeweaver',
        text: 'core: config load+validate adapter',
        status: 'in_progress',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'codeweaver',
        status: 'pending',
        step: 'review',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
      });
      const quest = QuestStub({
        id: questId,
        operations: [operation],
        workItems: [workItem],
      });

      const result = buildSpawnInstructionLayerBroker({ quest, workItem });

      expect({
        role: result.role,
        agentLine: String(result.taskPrompt).split('\n')[1],
        declined: proxy.getDeclinedPromptReports(),
      }).toStrictEqual({
        role: 'codeweaver',
        agentLine: '  agent: "codeweaver-reviewer",',
        declined: [],
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

      expect(() =>
        buildSpawnInstructionLayerBroker({ quest: QuestStub({ id: questId }), workItem }),
      ).toThrow(/Invalid enum value/u);
    });

    // The other member of `workItemRoleStatics.command`, and the reason
    // computeNextStepFromQuestLayerBroker returns a carve under its own step type before it ever
    // builds a batch: reaching here at all is a crash, not a mis-dispatch.
    it('INVALID: {workItem with role riftcarver} => agentRoleContract.parse throws', () => {
      buildSpawnInstructionLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-riftcarver-as-agent' });
      const workItemId = QuestWorkItemIdStub({
        value: 'cccccccc-1111-4222-9333-444444444444',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'riftcarver',
        status: 'pending',
        spawnerType: 'command',
      });

      expect(() =>
        buildSpawnInstructionLayerBroker({ quest: QuestStub({ id: questId }), workItem }),
      ).toThrow(/Invalid enum value/u);
    });
  });
});
