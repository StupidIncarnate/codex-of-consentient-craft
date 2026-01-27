import { ExitCodeStub, SessionIdStub, StepIdStub } from '@dungeonmaster/shared/contracts';

import { AgentSpawnStreamingResultStub } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result.stub';
import { PromptTextStub } from '../../../contracts/prompt-text/prompt-text.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';
import { spawnAgentLayerBroker } from './spawn-agent-layer-broker';
import { spawnAgentLayerBrokerProxy } from './spawn-agent-layer-broker.proxy';

describe('spawnAgentLayerBroker', () => {
  describe('successful spawn without resumeSessionId', () => {
    it('VALID: {prompt, stepId, timeoutMs} => spawns agent and returns result', async () => {
      const proxy = spawnAgentLayerBrokerProxy();
      const stepId = StepIdStub();
      const prompt = PromptTextStub({ value: 'Execute step' });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const exitCode = ExitCodeStub({ value: 0 });

      proxy.agentSpawnProxy.setupSuccessNoSignal({ exitCode });

      const result = await spawnAgentLayerBroker({
        prompt,
        stepId,
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
      expect(proxy.agentSpawnProxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        'Execute step',
        '--output-format',
        'stream-json',
        '--verbose',
      ]);
    });
  });

  describe('successful spawn with resumeSessionId', () => {
    it('VALID: {prompt, stepId, timeoutMs, resumeSessionId} => passes resumeSessionId to agent spawn', async () => {
      const proxy = spawnAgentLayerBrokerProxy();
      const stepId = StepIdStub();
      const prompt = PromptTextStub({ value: 'Continue task' });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const exitCode = ExitCodeStub({ value: 0 });
      const resumeSessionId = SessionIdStub({ value: 'resume-session-456' });

      proxy.agentSpawnProxy.setupSuccessNoSignal({ exitCode });

      const result = await spawnAgentLayerBroker({
        prompt,
        stepId,
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
      expect(proxy.agentSpawnProxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        'Continue task',
        '--output-format',
        'stream-json',
        '--verbose',
        '--resume',
        'resume-session-456',
      ]);
    });
  });
});
