import { DependencyStepStub, ExitCodeStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { ContinuationContextStub } from '../../../contracts/continuation-context/continuation-context.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';
import {
  CodeweaverWorkUnitStub,
  LawbringerWorkUnitStub,
  PathseekerWorkUnitStub,
  SiegemasterWorkUnitStub,
  SpiritmenderWorkUnitStub,
} from '../../../contracts/work-unit/work-unit.stub';
import { agentSpawnByRoleBroker } from './agent-spawn-by-role-broker';
import { agentSpawnByRoleBrokerProxy } from './agent-spawn-by-role-broker.proxy';

type SessionId = ReturnType<typeof SessionIdStub>;

const SESSION_ID = SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });

const makeSessionIdLine = ({ sessionId }: { sessionId: SessionId }) =>
  JSON.stringify({ session_id: sessionId });

describe('agentSpawnByRoleBroker', () => {
  describe('successful spawn', () => {
    it('VALID: {codeweaver workUnit} => returns monitor result with session ID', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const sessionLine = makeSessionIdLine({ sessionId: SESSION_ID });

      proxy.setupSpawnAndMonitor({
        lines: [sessionLine],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const result = await agentSpawnByRoleBroker({ workUnit, timeoutMs });

      expect(result).toStrictEqual({
        sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        exitCode: 0,
        signal: null,
        crashed: false,
        timedOut: false,
        capturedOutput: [],
      });
    });

    it('VALID: {pathseeker workUnit} => resolves pathseeker prompt template', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const workUnit = PathseekerWorkUnitStub();
      const timeoutMs = TimeoutMsStub({ value: 60000 });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const result = await agentSpawnByRoleBroker({ workUnit, timeoutMs });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: null,
        crashed: false,
        timedOut: false,
        capturedOutput: [],
      });
    });

    it('VALID: {siegemaster workUnit} => resolves siegemaster prompt template', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const workUnit = SiegemasterWorkUnitStub();
      const timeoutMs = TimeoutMsStub({ value: 60000 });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const result = await agentSpawnByRoleBroker({ workUnit, timeoutMs });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: null,
        crashed: false,
        timedOut: false,
        capturedOutput: [],
      });
    });

    it('VALID: {lawbringer workUnit} => resolves lawbringer prompt template', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const workUnit = LawbringerWorkUnitStub();
      const timeoutMs = TimeoutMsStub({ value: 60000 });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const result = await agentSpawnByRoleBroker({ workUnit, timeoutMs });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: null,
        crashed: false,
        timedOut: false,
        capturedOutput: [],
      });
    });

    it('VALID: {spiritmender workUnit} => resolves spiritmender prompt template', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const workUnit = SpiritmenderWorkUnitStub();
      const timeoutMs = TimeoutMsStub({ value: 60000 });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const result = await agentSpawnByRoleBroker({ workUnit, timeoutMs });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: null,
        crashed: false,
        timedOut: false,
        capturedOutput: [],
      });
    });
  });

  describe('continuation context', () => {
    it('VALID: {continuationContext provided} => appends continuation context to prompt', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const continuationContext = ContinuationContextStub({ value: 'Resume from gate 3' });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const result = await agentSpawnByRoleBroker({
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
        capturedOutput: [],
      });
    });
  });

  describe('resume session', () => {
    it('VALID: {resumeSessionId provided} => passes session ID to spawn adapter', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const resumeSessionId = SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const result = await agentSpawnByRoleBroker({
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
        capturedOutput: [],
      });
    });
  });

  describe('spawn failure', () => {
    it('ERROR: {spawn throws} => returns crashed result', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });
      const timeoutMs = TimeoutMsStub({ value: 60000 });

      proxy.setupSpawnFailure();

      const result = await agentSpawnByRoleBroker({ workUnit, timeoutMs });

      expect(result).toStrictEqual({
        crashed: true,
        timedOut: false,
        capturedOutput: [],
        signal: null,
        sessionId: null,
        exitCode: null,
      });
    });
  });
});
