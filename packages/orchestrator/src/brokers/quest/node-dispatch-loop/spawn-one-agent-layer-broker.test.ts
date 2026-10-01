import { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';

import { SpawnInstructionStub } from '../../../contracts/spawn-instruction/spawn-instruction.stub';
import { apiOverloadRetryStatics } from '../../../statics/api-overload-retry/api-overload-retry-statics';
import { spawnOneAgentLayerBroker } from './spawn-one-agent-layer-broker';
import { spawnOneAgentLayerBrokerProxy } from './spawn-one-agent-layer-broker.proxy';
import { roleToModelStatics } from '../../../statics/role-to-model/role-to-model-statics';
import { agentUnsignalledExitPromptTransformer } from '../../../transformers/agent-unsignalled-exit-prompt/agent-unsignalled-exit-prompt-transformer';

const SESSION_ID = '9c4d8f1c-3e38-48c9-bdec-22b61883b473';
const CWD = '/home/user/my-project';

describe('spawnOneAgentLayerBroker', () => {
  describe('single attempt', () => {
    it('VALID: {child emits session then exits 0} => stamps sessionId and does not respawn', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupModifySucceeds({ times: 1 });
      proxy.setupSpawnEmitsSessionThenExits({ sessionId: SESSION_ID, exitCode: 0 });

      await expect(spawnOneAgentLayerBroker({ instruction, cwd: CWD })).resolves.toBe(undefined);

      expect(proxy.getModifyCallInputs()).toStrictEqual([
        {
          questId: instruction.questId,
          workItems: [
            {
              id: instruction.workItemId,
              sessionId: SESSION_ID,
              assignedUnitIds: [],
              attempt: 0,
              dependsOn: [],
              maxAttempts: 1,
              observations: [],
              relatedDataItems: [],
              retryCount: 0,
            },
          ],
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
          roleToModelStatics.codeweaver,
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

      await expect(spawnOneAgentLayerBroker({ instruction, cwd: CWD })).resolves.toBe(undefined);

      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        [
          '-p',
          instruction.taskPrompt,
          '--output-format',
          'stream-json',
          '--verbose',
          '--model',
          roleToModelStatics.codeweaver,
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
      proxy.setupSpawnEmitsApiOverloadThenExits({
        instruction,
        sessionId: SESSION_ID,
        exitCode: 0,
      });

      await expect(spawnOneAgentLayerBroker({ instruction, cwd: CWD })).resolves.toBe(undefined);

      expect(proxy.getLastBackoffDelay()).toBe(undefined);
      expect(proxy.getStderrLines()).toStrictEqual([]);
    });

    it('EDGE: {child exits with a null code} => treated as a clean exit, no retry', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupModifySucceeds({ times: 1 });
      proxy.setupSpawnEmitsSessionThenExits({ sessionId: SESSION_ID, exitCode: null as never });

      await expect(spawnOneAgentLayerBroker({ instruction, cwd: CWD })).resolves.toBe(undefined);

      expect(proxy.getLastBackoffDelay()).toBe(undefined);
    });
  });

  describe('a session cut off from quest-work', () => {
    const MCP_FAILED_REASON =
      "the dungeonmaster MCP server did not connect in this session (status: failed), so it had no get-agent-prompt, quest-work or signal-back tool — run the server's command from .mcp.json by hand in this session's working directory to see why it fails";

    it('VALID: {init line reports dungeonmaster failed} => records the wall, names it on stderr, and never respawns', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub({ role: 'spiritmender' });
      proxy.setupModifySucceeds({ times: 1 });
      proxy.setupSpawnEmitsLinesThenExits({
        lines: [
          JSON.stringify({
            type: 'system',
            subtype: 'init',
            session_id: SESSION_ID,
            mcp_servers: [{ name: 'dungeonmaster', status: 'failed', source: 'project' }],
          }),
        ],
        exitCode: 0,
      });

      await expect(spawnOneAgentLayerBroker({ instruction, cwd: CWD })).resolves.toBe(undefined);

      expect({
        walls: proxy.getWallRecordInputs(),
        spawns: proxy.getAllSpawnedArgs().length,
        stderr: proxy.getStderrLines(),
      }).toStrictEqual({
        walls: [
          {
            questId: instruction.questId,
            workItemId: instruction.workItemId,
            reason: MCP_FAILED_REASON,
          },
        ],
        spawns: 1,
        stderr: [
          `[node-dispatch] spiritmender work item ${instruction.workItemId} hit a wall it could not report: ${MCP_FAILED_REASON}\n`,
        ],
      });
    });

    it('VALID: {final result line names DUNGEONMASTER-WALL} => records the wall with the session own reason', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub({ role: 'spiritmender' });
      proxy.setupModifySucceeds({ times: 1 });
      proxy.setupSpawnEmitsLinesThenExits({
        lines: [
          JSON.stringify({ session_id: SESSION_ID }),
          JSON.stringify({
            type: 'result',
            subtype: 'success',
            result:
              'I cannot reach the tools.\nDUNGEONMASTER-WALL: dungeonmaster MCP server CONNECTION_CLOSED',
          }),
        ],
        exitCode: 0,
      });

      await expect(spawnOneAgentLayerBroker({ instruction, cwd: CWD })).resolves.toBe(undefined);

      expect(proxy.getWallRecordInputs()).toStrictEqual([
        {
          questId: instruction.questId,
          workItemId: instruction.workItemId,
          reason: 'dungeonmaster MCP server CONNECTION_CLOSED',
        },
      ]);
    });

    it('VALID: {init line reports dungeonmaster connected} => records no wall', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupModifySucceeds({ times: 1 });
      proxy.setupSpawnEmitsLinesThenExits({
        lines: [
          JSON.stringify({
            type: 'system',
            subtype: 'init',
            session_id: SESSION_ID,
            mcp_servers: [{ name: 'dungeonmaster', status: 'connected' }],
          }),
        ],
        exitCode: 0,
      });

      await expect(spawnOneAgentLayerBroker({ instruction, cwd: CWD })).resolves.toBe(undefined);

      expect(proxy.getWallRecordInputs()).toStrictEqual([]);
    });
  });

  describe('a clean exit without a signal', () => {
    it('VALID: {exits 0 twice, item still in_progress} => resumes once with the unsignalled-exit prompt, then records a wall', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub({ role: 'spiritmender' });
      proxy.setupModifySucceeds({ times: 2 });
      proxy.setupWorkItemStatusOnReread({
        questId: instruction.questId,
        workItemId: instruction.workItemId,
        status: 'in_progress',
      });
      proxy.setupSpawnEmitsSessionThenExits({ sessionId: SESSION_ID, exitCode: 0 });
      proxy.setupSpawnEmitsSessionThenExits({ sessionId: SESSION_ID, exitCode: 0 });

      await expect(spawnOneAgentLayerBroker({ instruction, cwd: CWD })).resolves.toBe(undefined);

      const nudgePrompt = agentUnsignalledExitPromptTransformer({
        agent: 'spiritmender',
        workItemId: instruction.workItemId,
        questId: instruction.questId,
      });

      expect({
        spawns: proxy.getAllSpawnedArgs(),
        walls: proxy.getWallRecordInputs(),
      }).toStrictEqual({
        spawns: [
          [
            '-p',
            instruction.taskPrompt,
            '--output-format',
            'stream-json',
            '--verbose',
            '--model',
            roleToModelStatics.spiritmender,
            '--settings',
            '{"hooks":{}}',
          ],
          [
            '-p',
            nudgePrompt,
            '--output-format',
            'stream-json',
            '--verbose',
            '--model',
            roleToModelStatics.spiritmender,
            '--settings',
            '{"hooks":{}}',
            '--resume',
            SESSION_ID,
          ],
        ],
        walls: [
          {
            questId: instruction.questId,
            workItemId: instruction.workItemId,
            reason: `the spiritmender session ended 2 turns without signalling or naming a wall, including one after it was told it had not signalled — read its transcript (session ${SESSION_ID}) for why it stopped`,
          },
        ],
      });
    });

    it('VALID: {exits 0 and the item went complete} => neither resumes nor records a wall', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupModifySucceeds({ times: 1 });
      proxy.setupWorkItemStatusOnReread({
        questId: instruction.questId,
        workItemId: instruction.workItemId,
        status: 'complete',
      });
      proxy.setupSpawnEmitsSessionThenExits({ sessionId: SESSION_ID, exitCode: 0 });

      await expect(spawnOneAgentLayerBroker({ instruction, cwd: CWD })).resolves.toBe(undefined);

      expect({
        spawns: proxy.getAllSpawnedArgs().length,
        walls: proxy.getWallRecordInputs(),
      }).toStrictEqual({ spawns: 1, walls: [] });
    });
  });

  describe('api overload retry', () => {
    it('VALID: {overload death then a clean run} => respawns once after the fast-tier delay', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupModifySucceeds({ times: 2 });
      proxy.setupSpawnEmitsApiOverloadThenExits({
        instruction,
        sessionId: SESSION_ID,
        exitCode: 1,
      });
      proxy.setupSpawnEmitsSessionThenExits({ sessionId: SESSION_ID, exitCode: 0 });

      await expect(spawnOneAgentLayerBroker({ instruction, cwd: CWD })).resolves.toBe(undefined);

      expect(proxy.getLastBackoffDelay()).toBe(apiOverloadRetryStatics.fastDelayMs);
      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        [
          '-p',
          instruction.taskPrompt,
          '--output-format',
          'stream-json',
          '--verbose',
          '--model',
          roleToModelStatics.codeweaver,
          '--settings',
          '{"hooks":{}}',
        ],
        [
          '-p',
          `You were CUT OFF mid-work on this item — your session was killed, not paused cleanly. The context above therefore stops abruptly and your LAST ACTION MAY NEVER HAVE COMPLETED: an edit may not have been written, a command may have died mid-run, a commit may not exist. Do not treat your own context as a record of what landed.\n\nRE-ESTABLISH THE CURRENT STATE FIRST, before doing any new work:\n1. Run \`git status\` and \`git log --oneline -5\` — what is actually committed, and what is still uncommitted?\n2. Re-read the files you believe you edited, and confirm the change is really on disk.\n3. Re-run whatever you were in the middle of verifying (a test, a ward run, a browser step) instead of trusting the remembered result.\n\nOnly once you know the real state: finish the remaining scope of your operation item and commit a prose handoff. Then RECORD what you did through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${instruction.questId}",\n  workItemId: "${instruction.workItemId}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${instruction.questId}",\n  workItemId: "${instruction.workItemId}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${instruction.questId}",\n  workItemId: "${instruction.workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})\n\nIf you have no usable context above, call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${instruction.workItemId}",\n  questId: "${instruction.questId}"\n}) and follow its instructions from the top.\n\nIf the mcp__dungeonmaster__ tools are missing from this session, or something outside your control leaves quest-work unreachable, you cannot record a wall through quest-work. End your turn instead with a final line that reads exactly:\nDUNGEONMASTER-WALL: <what stopped you, and the error you saw>\nThe orchestrator reads that line and halts the quest for a human. Invent no outcome and no marks.`,
          '--output-format',
          'stream-json',
          '--verbose',
          '--model',
          roleToModelStatics.codeweaver,
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
      proxy.setupSpawnEmitsApiOverloadThenExits({ instruction, exitCode: 1 });
      proxy.setupSpawnExitsWithoutSession({ exitCode: 0 });

      await expect(spawnOneAgentLayerBroker({ instruction, cwd: CWD })).resolves.toBe(undefined);

      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        [
          '-p',
          instruction.taskPrompt,
          '--output-format',
          'stream-json',
          '--verbose',
          '--model',
          roleToModelStatics.codeweaver,
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
          roleToModelStatics.codeweaver,
          '--settings',
          '{"hooks":{}}',
        ],
      ]);
    });

    it('VALID: {overload on a resume-marked instruction} => keeps resuming the orphan-retained session', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const resumeSessionId = SessionIdStub({ value: '1a2b3c4d-3e38-48c9-bdec-22b61883b473' });
      const resumePrompt = 'Finish and signal back.';
      const instruction = SpawnInstructionStub({ resumeSessionId, resumePrompt });
      proxy.setupSpawnEmitsApiOverloadThenExits({ instruction, exitCode: 1 });
      proxy.setupSpawnExitsWithoutSession({ exitCode: 0 });

      await expect(spawnOneAgentLayerBroker({ instruction, cwd: CWD })).resolves.toBe(undefined);

      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        [
          '-p',
          resumePrompt,
          '--output-format',
          'stream-json',
          '--verbose',
          '--model',
          roleToModelStatics.codeweaver,
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
          roleToModelStatics.codeweaver,
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
      proxy.setupSpawnEmitsApiOverloadThenExits({ instruction, exitCode: 1 });
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
      proxy.setupSpawnEmitsApiOverloadThenExits({ instruction, exitCode: 1 });
      const spentAttempts =
        apiOverloadRetryStatics.fastAttempts + apiOverloadRetryStatics.slowAttempts;

      await expect(
        spawnOneAgentLayerBroker({
          instruction,
          cwd: CWD,
          overloadAttempt: spentAttempts,
        }),
      ).resolves.toBe(undefined);

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
      proxy.setupSpawnEmitsApiOverloadThenExits({ instruction, exitCode: 1 });
      const isPlaying = jest.fn().mockReturnValue(false);

      await expect(spawnOneAgentLayerBroker({ instruction, cwd: CWD, isPlaying })).resolves.toBe(
        undefined,
      );

      expect(proxy.getLastBackoffDelay()).toBe(undefined);
      expect(proxy.getStderrLines()).toStrictEqual([
        `[node-dispatch] codeweaver work item ${instruction.workItemId} hit API overload but dispatch is paused — abandoning retry\n`,
      ]);
    });

    it('VALID: {dispatch paused DURING the backoff} => waits, then abandons without respawning', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupSpawnEmitsApiOverloadThenExits({ instruction, exitCode: 1 });
      const isPlaying = jest.fn().mockReturnValueOnce(true).mockReturnValue(false);

      await expect(spawnOneAgentLayerBroker({ instruction, cwd: CWD, isPlaying })).resolves.toBe(
        undefined,
      );

      expect(proxy.getLastBackoffDelay()).toBe(apiOverloadRetryStatics.fastDelayMs);
      expect(proxy.getStderrLines()).toStrictEqual([
        `[node-dispatch] codeweaver work item ${instruction.workItemId} died on API overload — retry 1 in 60000ms\n`,
        `[node-dispatch] dispatch paused during API-overload backoff — abandoning retry for work item ${instruction.workItemId}\n`,
      ]);
    });

    it('VALID: {work item went terminal during the backoff} => no respawn (it signalled back before dying)', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupSpawnEmitsApiOverloadThenExits({ instruction, exitCode: 1 });
      proxy.setupWorkItemStatusOnReread({
        questId: instruction.questId,
        workItemId: instruction.workItemId,
        status: 'complete',
      });

      await expect(spawnOneAgentLayerBroker({ instruction, cwd: CWD })).resolves.toBe(undefined);

      expect(proxy.getStderrLines()).toStrictEqual([
        `[node-dispatch] codeweaver work item ${instruction.workItemId} died on API overload — retry 1 in 60000ms\n`,
        `[node-dispatch] work item ${instruction.workItemId} went terminal during API-overload backoff — no retry needed\n`,
      ]);
    });

    it('VALID: {work item still in_progress during the backoff} => respawns', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupSpawnEmitsApiOverloadThenExits({ instruction, exitCode: 1 });
      proxy.setupSpawnExitsWithoutSession({ exitCode: 0 });
      proxy.setupWorkItemStatusOnReread({
        questId: instruction.questId,
        workItemId: instruction.workItemId,
        status: 'in_progress',
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
          roleToModelStatics.codeweaver,
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
          roleToModelStatics.codeweaver,
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
      proxy.setupSpawnEmitsApiOverloadThenExits({ instruction, exitCode: 1 });
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
      proxy.setupSpawnEmitsApiOverloadThenExits({ instruction, exitCode: 1 });
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

  describe('quota refusal (429)', () => {
    it('VALID: {child prints a weekly-limit refusal then exits 1} => does NOT respawn', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupSpawnEmitsRateLimitRefusalThenExits({ exitCode: 1 });

      await expect(spawnOneAgentLayerBroker({ instruction, cwd: CWD })).resolves.toBe(undefined);

      // ONE spawn. The overload path would have respawned here; a refusal must not, because the
      // quota does not refill on its schedule and every respawn earns another 429.
      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        [
          '-p',
          instruction.taskPrompt,
          '--output-format',
          'stream-json',
          '--verbose',
          '--model',
          roleToModelStatics.codeweaver,
          '--settings',
          '{"hooks":{}}',
        ],
      ]);
    });

    it('VALID: {a refusal} => hands the refusal line itself to the hold, so the window is readable off it', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupSpawnEmitsRateLimitRefusalThenExits({ exitCode: 1 });

      await spawnOneAgentLayerBroker({ instruction, cwd: CWD });

      expect(proxy.getRejectCallInputs()).toStrictEqual([
        {
          line: JSON.stringify({
            type: 'assistant',
            isApiErrorMessage: true,
            apiErrorStatus: 429,
            error: 'rate_limit',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'text',
                  text: "You've hit your weekly limit · resets Sep 12, 11pm (America/Los_Angeles)",
                },
              ],
            },
          }),
          nowMs: 1789274969242,
        },
      ]);
    });

    it('VALID: {a refusal} => names the resume time on stderr rather than reporting a crash', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupSpawnEmitsRateLimitRefusalThenExits({ exitCode: 1 });

      await spawnOneAgentLayerBroker({ instruction, cwd: CWD });

      expect(proxy.getStderrLines()).toStrictEqual([
        `[node-dispatch] codeweaver work item ${instruction.workItemId} died on a rate-limit refusal — dispatch holds until 2026-09-13T05:19:29.242Z\n`,
      ]);
    });

    it('EDGE: {a refusal printed by a child that exited 0} => is ignored, because only a dead child proves it landed', async () => {
      const proxy = spawnOneAgentLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupSpawnEmitsRateLimitRefusalThenExits({ exitCode: 0 });

      await spawnOneAgentLayerBroker({ instruction, cwd: CWD });

      expect(proxy.getRejectCallInputs()).toStrictEqual([]);
    });
  });
});
