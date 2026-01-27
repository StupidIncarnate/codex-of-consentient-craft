import { DependencyStepStub, ExitCodeStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { AgentSpawnStreamingResultStub } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';
import { CodeweaverWorkUnitStub } from '../../../contracts/work-unit/work-unit.stub';
import { spawnAgentLayerBroker } from './spawn-agent-layer-broker';
import { spawnAgentLayerBrokerProxy } from './spawn-agent-layer-broker.proxy';

describe('spawnAgentLayerBroker', () => {
  describe('successful spawn without resumeSessionId', () => {
    it('VALID: {workUnit, timeoutMs} => spawns agent and returns result', async () => {
      const proxy = spawnAgentLayerBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const exitCode = ExitCodeStub({ value: 0 });

      proxy.agentSpawnByRoleProxy.setupCodeweaverSuccess({ exitCode });

      const result = await spawnAgentLayerBroker({
        workUnit,
        timeoutMs,
      });

      expect(result).toStrictEqual(
        AgentSpawnStreamingResultStub({
          sessionId: null,
          exitCode,
          signal: null,
          crashed: false as never,
          timedOut: false as never,
        }),
      );
    });
  });

  describe('successful spawn with resumeSessionId', () => {
    it('VALID: {workUnit, timeoutMs, resumeSessionId} => passes resumeSessionId to agent spawn', async () => {
      const proxy = spawnAgentLayerBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const exitCode = ExitCodeStub({ value: 0 });
      const resumeSessionId = SessionIdStub({ value: 'resume-session-456' });

      proxy.agentSpawnByRoleProxy.setupCodeweaverSuccess({ exitCode });

      const result = await spawnAgentLayerBroker({
        workUnit,
        timeoutMs,
        resumeSessionId,
      });

      expect(result).toStrictEqual(
        AgentSpawnStreamingResultStub({
          sessionId: null,
          exitCode,
          signal: null,
          crashed: false as never,
          timedOut: false as never,
        }),
      );
    });
  });
});
