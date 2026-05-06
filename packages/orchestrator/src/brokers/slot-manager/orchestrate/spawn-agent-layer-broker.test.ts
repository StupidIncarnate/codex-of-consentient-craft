import {
  DependencyStepStub,
  ExitCodeStub,
  FilePathStub,
  GuildIdStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';

import { ContinuationContextStub } from '../../../contracts/continuation-context/continuation-context.stub';
import { CodeweaverWorkUnitStub } from '../../../contracts/work-unit/work-unit.stub';
import { spawnAgentLayerBroker } from './spawn-agent-layer-broker';
import { spawnAgentLayerBrokerProxy } from './spawn-agent-layer-broker.proxy';

describe('spawnAgentLayerBroker', () => {
  describe('successful spawn', () => {
    it('VALID: {workUnit} => returns monitor result from spawn-by-role broker', async () => {
      const proxy = spawnAgentLayerBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ steps: [step] });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await spawnAgentLayerBroker({
        workUnit,
        startPath,
        guildId: GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: null,
        crashed: false,
        capturedOutput: [],
      });
    });
  });

  describe('continuation context', () => {
    it('VALID: {with continuationContext} => forwards continuationContext to spawn-by-role', async () => {
      const proxy = spawnAgentLayerBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ steps: [step] });
      const continuationContext = ContinuationContextStub({ value: 'Resume from gate 3' });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await spawnAgentLayerBroker({
        workUnit,
        startPath,
        guildId: GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
        continuationContext,
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: null,
        crashed: false,
        capturedOutput: [],
      });
    });
  });

  describe('resume session', () => {
    it('VALID: {with resumeSessionId} => forwards resumeSessionId to spawn-by-role', async () => {
      const proxy = spawnAgentLayerBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ steps: [step] });
      const resumeSessionId = SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await spawnAgentLayerBroker({
        workUnit,
        startPath,
        guildId: GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
        resumeSessionId,
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: null,
        crashed: false,
        capturedOutput: [],
      });
    });
  });

  describe('spawn failure', () => {
    it('ERROR: {spawn throws} => returns crashed result', async () => {
      const proxy = spawnAgentLayerBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ steps: [step] });

      proxy.setupSpawnFailure();

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await spawnAgentLayerBroker({
        workUnit,
        startPath,
        guildId: GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
      });

      expect(result).toStrictEqual({
        crashed: true,
        signal: null,
        sessionId: null,
        exitCode: null,
        capturedOutput: [],
      });
    });
  });
});
