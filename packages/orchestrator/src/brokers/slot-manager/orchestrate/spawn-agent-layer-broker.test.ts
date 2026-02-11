import { DependencyStepStub, ExitCodeStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { ContinuationContextStub } from '../../../contracts/continuation-context/continuation-context.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';
import { CodeweaverWorkUnitStub } from '../../../contracts/work-unit/work-unit.stub';
import { spawnAgentLayerBroker } from './spawn-agent-layer-broker';
import { spawnAgentLayerBrokerProxy } from './spawn-agent-layer-broker.proxy';

describe('spawnAgentLayerBroker', () => {
  describe('successful spawn', () => {
    it('VALID: {workUnit, timeoutMs} => returns monitor result from spawn-by-role broker', async () => {
      const proxy = spawnAgentLayerBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });
      const timeoutMs = TimeoutMsStub({ value: 60000 });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const result = await spawnAgentLayerBroker({
        workUnit,
        timeoutMs,
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: null,
        crashed: false,
        timedOut: false,
      });
    });
  });

  describe('continuation context', () => {
    it('VALID: {with continuationContext} => forwards continuationContext to spawn-by-role', async () => {
      const proxy = spawnAgentLayerBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const continuationContext = ContinuationContextStub({ value: 'Resume from gate 3' });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const result = await spawnAgentLayerBroker({
        workUnit,
        timeoutMs,
        continuationContext,
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: null,
        crashed: false,
        timedOut: false,
      });
    });
  });

  describe('resume session', () => {
    it('VALID: {with resumeSessionId} => forwards resumeSessionId to spawn-by-role', async () => {
      const proxy = spawnAgentLayerBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const resumeSessionId = SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const result = await spawnAgentLayerBroker({
        workUnit,
        timeoutMs,
        resumeSessionId,
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: null,
        crashed: false,
        timedOut: false,
      });
    });
  });

  describe('spawn failure', () => {
    it('ERROR: {spawn throws} => returns crashed result', async () => {
      const proxy = spawnAgentLayerBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });
      const timeoutMs = TimeoutMsStub({ value: 60000 });

      proxy.setupSpawnFailure();

      const result = await spawnAgentLayerBroker({
        workUnit,
        timeoutMs,
      });

      expect(result).toStrictEqual({
        crashed: true,
        timedOut: false,
        signal: null,
        sessionId: null,
        exitCode: null,
      });
    });
  });
});
