import {
  AssistantTextStreamLineStub,
  DependencyStepStub,
  ExitCodeStub,
  FilePathStub,
  SessionIdStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

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
    it('VALID: {codeweaver workUnit} => returns result with session ID', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const sessionLine = makeSessionIdLine({ sessionId: SESSION_ID });

      proxy.setupSpawnAndMonitor({
        lines: [sessionLine],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await agentSpawnByRoleBroker({ workUnit, timeoutMs, startPath });

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

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await agentSpawnByRoleBroker({ workUnit, timeoutMs, startPath });

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

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await agentSpawnByRoleBroker({ workUnit, timeoutMs, startPath });

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

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await agentSpawnByRoleBroker({ workUnit, timeoutMs, startPath });

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

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await agentSpawnByRoleBroker({ workUnit, timeoutMs, startPath });

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

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await agentSpawnByRoleBroker({
        workUnit,
        timeoutMs,
        startPath,
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
    it('VALID: {resumeSessionId provided} => passes session ID to spawn', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const resumeSessionId = SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await agentSpawnByRoleBroker({
        workUnit,
        timeoutMs,
        startPath,
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

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await agentSpawnByRoleBroker({ workUnit, timeoutMs, startPath });

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

  describe('timeout', () => {
    it('VALID: {very small timeoutMs} => returns timedOut true', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });
      const timeoutMs = TimeoutMsStub({ value: 1 });
      const startPath = FilePathStub({ value: '/project/src' });

      proxy.setupSpawnExitOnKill({ lines: [], exitCode: null });

      const result = await agentSpawnByRoleBroker({ workUnit, timeoutMs, startPath });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: null,
        signal: null,
        crashed: false,
        timedOut: true,
        capturedOutput: [],
      });
    });
  });

  describe('crash exit', () => {
    it('VALID: {process exits with code 1} => returns crashed true', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const startPath = FilePathStub({ value: '/project/src' });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 1 }),
      });

      const result = await agentSpawnByRoleBroker({ workUnit, timeoutMs, startPath });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 1,
        signal: null,
        crashed: true,
        timedOut: false,
        capturedOutput: [],
      });
    });
  });

  describe('signal extraction', () => {
    it('VALID: {stdout emits signal-back tool use line} => returns signal in result', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const startPath = FilePathStub({ value: '/project/src' });
      const stepId = StepIdStub();

      const signalLine = JSON.stringify({
        type: 'assistant',
        message: {
          content: [
            {
              type: 'tool_use',
              name: 'mcp__dungeonmaster__signal-back',
              input: {
                signal: 'complete',
                stepId,
                summary: 'All done',
              },
            },
          ],
        },
      });

      proxy.setupSpawnAndMonitor({
        lines: [signalLine],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const result = await agentSpawnByRoleBroker({ workUnit, timeoutMs, startPath });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: {
          signal: 'complete',
          summary: 'All done',
        },
        crashed: false,
        timedOut: false,
        capturedOutput: [],
      });
    });
  });

  describe('text capture', () => {
    it('VALID: {stdout emits assistant text line} => returns capturedOutput with text', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const startPath = FilePathStub({ value: '/project/src' });

      const textLine = JSON.stringify(AssistantTextStreamLineStub());

      proxy.setupSpawnAndMonitor({
        lines: [textLine],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const result = await agentSpawnByRoleBroker({ workUnit, timeoutMs, startPath });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: null,
        crashed: false,
        timedOut: false,
        capturedOutput: ['Hello, I can help with that.'],
      });
    });
  });

  describe('onLine forwarding', () => {
    it('VALID: {onLine callback provided, stdout emits lines} => callback receives lines', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const startPath = FilePathStub({ value: '/project/src' });
      const onLine = jest.fn();
      const sessionLine = makeSessionIdLine({ sessionId: SESSION_ID });

      proxy.setupSpawnAndMonitor({
        lines: [sessionLine],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await agentSpawnByRoleBroker({ workUnit, timeoutMs, startPath, onLine });

      expect(onLine).toHaveBeenCalledTimes(1);
      expect(onLine.mock.calls[0][0]).toStrictEqual({ line: sessionLine });
    });
  });
});
