import {
  AdapterResultStub,
  RepoRootCwdStub,
  SessionIdStub,
  WorkItemStatusStub,
} from '@dungeonmaster/shared/contracts';

import { PromptTextStub } from '../../../contracts/prompt-text/prompt-text.stub';
import { SpawnInstructionStub } from '../../../contracts/spawn-instruction/spawn-instruction.stub';
import { apiOverloadRetryStatics } from '../../../statics/api-overload-retry/api-overload-retry-statics';
import { spawnOneAgentLayerBroker } from './spawn-one-agent-layer-broker';
import { spawnOneAgentLayerBrokerProxy } from './spawn-one-agent-layer-broker.proxy';

const SESSION_ID = '9c4d8f1c-3e38-48c9-bdec-22b61883b473';
const CWD = RepoRootCwdStub({ value: '/home/user/my-project' });

describe('spawnOneAgentLayerBroker', () => {
  describe('single attempt', () => {
    it('VALID: {child emits session then exits 0} => stamps sessionId and does not respawn', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupModifySucceeds({ times: 1 });
      proxy.setupSpawnEmitsSessionThenExits({ sessionId: SESSION_ID, exitCode: 0 });

      const result = await spawnOneAgentLayerBroker({ instruction, cwd: CWD });

      expect(result).toStrictEqual(AdapterResultStub());
      expect(proxy.getModifyCallInputs()).toStrictEqual([
        {
          questId: instruction.questId,
          workItems: [{ id: instruction.workItemId, sessionId: SESSION_ID }],
        },
      ]);
      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        [
          '-p',
          instruction.taskPrompt,
          '--output-format',
          'stream-json',
          '--verbose',
          '--model',
          'opus',
          '--chrome',
          '--settings',
          '{"hooks":{}}',
        ],
      ]);
    });

    it('VALID: {child exits 1 with NO overload marker} => hands off to orphan recovery without respawning', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupModifySucceeds({ times: 1 });
      proxy.setupSpawnEmitsSessionThenExits({ sessionId: SESSION_ID, exitCode: 1 });

      const result = await spawnOneAgentLayerBroker({ instruction, cwd: CWD });

      expect(result).toStrictEqual(AdapterResultStub());
      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        [
          '-p',
          instruction.taskPrompt,
          '--output-format',
          'stream-json',
          '--verbose',
          '--model',
          'opus',
          '--chrome',
          '--settings',
          '{"hooks":{}}',
        ],
      ]);
      expect(proxy.getStderrLines()).toStrictEqual([
        `[node-dispatch] codeweaver child for work item ${instruction.workItemId} exited with code 1 — terminal status is owned by signal-back / orphan recovery\n`,
      ]);
    });

    it('VALID: {child prints an overload marker but exits 0} => success, no retry (marker alone is not a failure)', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupModifySucceeds({ times: 1 });
      proxy.setupSpawnEmitsApiOverloadThenExits({ sessionId: SESSION_ID, exitCode: 0 });

      const result = await spawnOneAgentLayerBroker({ instruction, cwd: CWD });

      expect(result).toStrictEqual(AdapterResultStub());
      expect(proxy.getLastBackoffDelay()).toBe(undefined);
      expect(proxy.getStderrLines()).toStrictEqual([]);
    });

    it('EDGE: {child exits with a null code} => treated as a clean exit, no retry', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupModifySucceeds({ times: 1 });
      proxy.setupSpawnEmitsSessionThenExits({ sessionId: SESSION_ID, exitCode: null as never });

      const result = await spawnOneAgentLayerBroker({ instruction, cwd: CWD });

      expect(result).toStrictEqual(AdapterResultStub());
      expect(proxy.getLastBackoffDelay()).toBe(undefined);
    });
  });

  describe('api overload retry', () => {
    it('VALID: {overload death then a clean run} => respawns once after the fast-tier delay', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupModifySucceeds({ times: 2 });
      proxy.setupSpawnEmitsApiOverloadThenExits({ sessionId: SESSION_ID, exitCode: 1 });
      proxy.setupSpawnEmitsSessionThenExits({ sessionId: SESSION_ID, exitCode: 0 });

      const result = await spawnOneAgentLayerBroker({ instruction, cwd: CWD });

      expect(result).toStrictEqual(AdapterResultStub());
      expect(proxy.getLastBackoffDelay()).toBe(apiOverloadRetryStatics.fastDelayMs);
      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        [
          '-p',
          instruction.taskPrompt,
          '--output-format',
          'stream-json',
          '--verbose',
          '--model',
          'opus',
          '--chrome',
          '--settings',
          '{"hooks":{}}',
        ],
        [
          '-p',
          `You were CUT OFF mid-work on this item — your session was killed, not paused cleanly. The context above therefore stops abruptly and your LAST ACTION MAY NEVER HAVE COMPLETED: an edit may not have been written, a command may have died mid-run, a commit may not exist. Do not treat your own context as a record of what landed.\n\nRE-ESTABLISH THE CURRENT STATE FIRST, before doing any new work:\n1. Run \`git status\` and \`git log --oneline -5\` — what is actually committed, and what is still uncommitted?\n2. Re-read the files you believe you edited, and confirm the change is really on disk.\n3. Re-run whatever you were in the middle of verifying (a test, a ward run, a browser step) instead of trusting the remembered result.\n\nOnly once you know the real state: finish the remaining scope of your operation item, commit a prose handoff, then call mcp__dungeonmaster__signal-back({\n  questId: "${instruction.questId}",\n  workItemId: "${instruction.workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial" | "blocked"\n}).\n\nIf you have no usable context above, call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${instruction.workItemId}",\n  questId: "${instruction.questId}"\n}) and follow its instructions from the top.`,
          '--output-format',
          'stream-json',
          '--verbose',
          '--model',
          'opus',
          '--chrome',
          '--settings',
          '{"hooks":{}}',
          '--resume',
          SESSION_ID,
        ],
      ]);
    });

    it('VALID: {overload death BEFORE any session line} => respawns fresh with no --resume', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      // Neither attempt reaches its init line, so nothing is ever captured to resume — the
      // retry has to fall back to a fresh spawn from taskPrompt.
      proxy.setupSpawnEmitsApiOverloadThenExits({ exitCode: 1 });
      proxy.setupSpawnExitsWithoutSession({ exitCode: 0 });

      const result = await spawnOneAgentLayerBroker({ instruction, cwd: CWD });

      expect(result).toStrictEqual(AdapterResultStub());
      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        [
          '-p',
          instruction.taskPrompt,
          '--output-format',
          'stream-json',
          '--verbose',
          '--model',
          'opus',
          '--chrome',
          '--settings',
          '{"hooks":{}}',
        ],
        [
          '-p',
          instruction.taskPrompt,
          '--output-format',
          'stream-json',
          '--verbose',
          '--model',
          'opus',
          '--chrome',
          '--settings',
          '{"hooks":{}}',
        ],
      ]);
    });

    it('VALID: {overload on a resume-marked instruction} => keeps resuming the orphan-retained session', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const resumeSessionId = SessionIdStub({ value: '1a2b3c4d-3e38-48c9-bdec-22b61883b473' });
      const resumePrompt = PromptTextStub({ value: 'Finish and signal back.' });
      const instruction = SpawnInstructionStub({ resumeSessionId, resumePrompt });
      proxy.setupSpawnEmitsApiOverloadThenExits({ exitCode: 1 });
      proxy.setupSpawnExitsWithoutSession({ exitCode: 0 });

      const result = await spawnOneAgentLayerBroker({ instruction, cwd: CWD });

      expect(result).toStrictEqual(AdapterResultStub());
      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        [
          '-p',
          resumePrompt,
          '--output-format',
          'stream-json',
          '--verbose',
          '--model',
          'opus',
          '--chrome',
          '--settings',
          '{"hooks":{}}',
          '--resume',
          resumeSessionId,
        ],
        [
          '-p',
          resumePrompt,
          '--output-format',
          'stream-json',
          '--verbose',
          '--model',
          'opus',
          '--chrome',
          '--settings',
          '{"hooks":{}}',
          '--resume',
          resumeSessionId,
        ],
      ]);
    });

    it('VALID: {overload on retry 10 then again} => crosses into the slow tier on retry 11', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupSpawnEmitsApiOverloadThenExits({ exitCode: 1 });
      proxy.setupSpawnExitsWithoutSession({ exitCode: 0 });

      await spawnOneAgentLayerBroker({
        instruction,
        cwd: CWD,
        overloadAttempt: apiOverloadRetryStatics.fastAttempts,
      });

      expect(proxy.getLastBackoffDelay()).toBe(apiOverloadRetryStatics.slowDelayMs);
    });

    it('VALID: {overload with the schedule already spent} => no respawn, hands off to orphan recovery', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupSpawnEmitsApiOverloadThenExits({ exitCode: 1 });
      const spentAttempts =
        apiOverloadRetryStatics.fastAttempts + apiOverloadRetryStatics.slowAttempts;

      const result = await spawnOneAgentLayerBroker({
        instruction,
        cwd: CWD,
        overloadAttempt: spentAttempts,
      });

      expect(result).toStrictEqual(AdapterResultStub());
      expect(proxy.getLastBackoffDelay()).toBe(undefined);
      expect(proxy.getStderrLines()).toStrictEqual([
        `[node-dispatch] codeweaver work item ${instruction.workItemId} still hitting API overload after 30 retries — schedule spent, handing off to orphan recovery\n`,
      ]);
    });
  });

  describe('retry abandonment', () => {
    it('VALID: {dispatch already paused when the overload lands} => no backoff, no respawn', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupSpawnEmitsApiOverloadThenExits({ exitCode: 1 });
      const isPlaying = jest.fn().mockReturnValue(false);

      const result = await spawnOneAgentLayerBroker({ instruction, cwd: CWD, isPlaying });

      expect(result).toStrictEqual(AdapterResultStub());
      expect(proxy.getLastBackoffDelay()).toBe(undefined);
      expect(proxy.getStderrLines()).toStrictEqual([
        `[node-dispatch] codeweaver work item ${instruction.workItemId} hit API overload but dispatch is paused — abandoning retry\n`,
      ]);
    });

    it('VALID: {dispatch paused DURING the backoff} => waits, then abandons without respawning', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupSpawnEmitsApiOverloadThenExits({ exitCode: 1 });
      const isPlaying = jest.fn().mockReturnValueOnce(true).mockReturnValue(false);

      const result = await spawnOneAgentLayerBroker({ instruction, cwd: CWD, isPlaying });

      expect(result).toStrictEqual(AdapterResultStub());
      expect(proxy.getLastBackoffDelay()).toBe(apiOverloadRetryStatics.fastDelayMs);
      expect(proxy.getStderrLines()).toStrictEqual([
        `[node-dispatch] codeweaver work item ${instruction.workItemId} died on API overload — retry 1 in 60000ms\n`,
        `[node-dispatch] dispatch paused during API-overload backoff — abandoning retry for work item ${instruction.workItemId}\n`,
      ]);
    });

    it('VALID: {work item went terminal during the backoff} => no respawn (it signalled back before dying)', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupSpawnEmitsApiOverloadThenExits({ exitCode: 1 });
      proxy.setupWorkItemStatusOnReread({
        workItemId: instruction.workItemId,
        status: WorkItemStatusStub({ value: 'complete' }),
      });

      const result = await spawnOneAgentLayerBroker({ instruction, cwd: CWD });

      expect(result).toStrictEqual(AdapterResultStub());
      expect(proxy.getStderrLines()).toStrictEqual([
        `[node-dispatch] codeweaver work item ${instruction.workItemId} died on API overload — retry 1 in 60000ms\n`,
        `[node-dispatch] work item ${instruction.workItemId} went terminal during API-overload backoff — no retry needed\n`,
      ]);
    });

    it('VALID: {work item still in_progress during the backoff} => respawns', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupSpawnEmitsApiOverloadThenExits({ exitCode: 1 });
      proxy.setupSpawnExitsWithoutSession({ exitCode: 0 });
      proxy.setupWorkItemStatusOnReread({
        workItemId: instruction.workItemId,
        status: WorkItemStatusStub({ value: 'in_progress' }),
      });

      await spawnOneAgentLayerBroker({ instruction, cwd: CWD });

      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        [
          '-p',
          instruction.taskPrompt,
          '--output-format',
          'stream-json',
          '--verbose',
          '--model',
          'opus',
          '--chrome',
          '--settings',
          '{"hooks":{}}',
        ],
        [
          '-p',
          instruction.taskPrompt,
          '--output-format',
          'stream-json',
          '--verbose',
          '--model',
          'opus',
          '--chrome',
          '--settings',
          '{"hooks":{}}',
        ],
      ]);
    });
  });

  describe('process registration', () => {
    it('VALID: {registerProcess provided} => registers the child with processId and kill handle', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupModifySucceeds({ times: 1 });
      proxy.setupSpawnEmitsSessionThenExits({ sessionId: SESSION_ID, exitCode: 0 });
      const registerProcess = jest.fn();

      await spawnOneAgentLayerBroker({ instruction, cwd: CWD, registerProcess });

      expect(registerProcess.mock.calls).toStrictEqual([
        [
          {
            processId: 'node-dispatch-00000000-0000-4000-8000-00000000d15b',
            questId: instruction.questId,
            questWorkItemId: instruction.workItemId,
            kill: expect.any(Function),
          },
        ],
      ]);
    });

    it('VALID: {unregisterProcess provided} => drops the registry entry once the child exits', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupModifySucceeds({ times: 1 });
      proxy.setupSpawnEmitsSessionThenExits({ sessionId: SESSION_ID, exitCode: 0 });
      const unregisterProcess = jest.fn();

      await spawnOneAgentLayerBroker({ instruction, cwd: CWD, unregisterProcess });

      expect(unregisterProcess.mock.calls).toStrictEqual([
        [{ processId: 'node-dispatch-00000000-0000-4000-8000-00000000d15b' }],
      ]);
    });

    it('VALID: {overload retry with unregisterProcess} => each dead attempt is unregistered, so the watchdog never sees a pile', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupSpawnEmitsApiOverloadThenExits({ exitCode: 1 });
      proxy.setupSpawnExitsWithoutSession({ exitCode: 0 });
      const unregisterProcess = jest.fn();

      await spawnOneAgentLayerBroker({ instruction, cwd: CWD, unregisterProcess });

      expect(unregisterProcess.mock.calls).toStrictEqual([
        [{ processId: 'node-dispatch-00000000-0000-4000-8000-00000000d15b' }],
        [{ processId: 'node-dispatch-00000000-0000-4000-8000-00000000d15b' }],
      ]);
    });

    it('VALID: {overload retry with registerProcess} => registers each attempt separately', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupSpawnEmitsApiOverloadThenExits({ exitCode: 1 });
      proxy.setupSpawnExitsWithoutSession({ exitCode: 0 });
      const registerProcess = jest.fn();

      await spawnOneAgentLayerBroker({ instruction, cwd: CWD, registerProcess });

      expect(registerProcess.mock.calls).toStrictEqual([
        [
          {
            processId: 'node-dispatch-00000000-0000-4000-8000-00000000d15b',
            questId: instruction.questId,
            questWorkItemId: instruction.workItemId,
            kill: expect.any(Function),
          },
        ],
        [
          {
            processId: 'node-dispatch-00000000-0000-4000-8000-00000000d15b',
            questId: instruction.questId,
            questWorkItemId: instruction.workItemId,
            kill: expect.any(Function),
          },
        ],
      ]);
    });
  });
});
