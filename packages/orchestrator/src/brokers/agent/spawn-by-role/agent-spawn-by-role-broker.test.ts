import {
  AssistantTextStreamLineStub,
  DependencyStepStub,
  ExitCodeStub,
  FilePathStub,
  SessionIdStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import { ContinuationContextStub } from '../../../contracts/continuation-context/continuation-context.stub';
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
      const sessionLine = makeSessionIdLine({ sessionId: SESSION_ID });

      proxy.setupSpawnAndMonitor({
        lines: [sessionLine],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await agentSpawnByRoleBroker({ workUnit, startPath });

      expect(result).toStrictEqual({
        sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        exitCode: 0,
        signal: null,
        crashed: false,
        capturedOutput: [],
      });
    });

    it('VALID: {pathseeker workUnit} => resolves pathseeker prompt template with quest ID injected', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const workUnit = PathseekerWorkUnitStub();

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await agentSpawnByRoleBroker({ workUnit, startPath });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: null,
        crashed: false,
        capturedOutput: [],
      });

      const spawnedArgs = proxy.getSpawnedArgs() as unknown[];
      const [, prompt] = spawnedArgs;

      expect(String(prompt)).toMatch(/^Quest ID: add-auth$/mu);
      expect(String(prompt)).toMatch(/^## Phase 1: Orient$/mu);
    });

    it('VALID: {siegemaster workUnit} => resolves siegemaster prompt template', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const workUnit = SiegemasterWorkUnitStub();

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await agentSpawnByRoleBroker({ workUnit, startPath });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: null,
        crashed: false,
        capturedOutput: [],
      });
    });

    it('VALID: {lawbringer workUnit} => resolves lawbringer prompt template', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const workUnit = LawbringerWorkUnitStub();

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await agentSpawnByRoleBroker({ workUnit, startPath });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: null,
        crashed: false,
        capturedOutput: [],
      });
    });

    it('VALID: {spiritmender workUnit} => resolves spiritmender prompt template', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const workUnit = SpiritmenderWorkUnitStub();

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await agentSpawnByRoleBroker({ workUnit, startPath });

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
    it('VALID: {continuationContext provided} => appends continuation context to prompt', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });
      const continuationContext = ContinuationContextStub({ value: 'Resume from gate 3' });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await agentSpawnByRoleBroker({
        workUnit,
        startPath,
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
    it('VALID: {resumeSessionId provided} => passes session ID to spawn', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });
      const resumeSessionId = SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await agentSpawnByRoleBroker({
        workUnit,
        startPath,
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
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });

      proxy.setupSpawnFailure();

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await agentSpawnByRoleBroker({ workUnit, startPath });

      expect(result).toStrictEqual({
        crashed: true,
        capturedOutput: [],
        signal: null,
        sessionId: null,
        exitCode: null,
      });
    });
  });

  describe('crash exit', () => {
    it('VALID: {process exits with code 1} => returns crashed true', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });
      const startPath = FilePathStub({ value: '/project/src' });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 1 }),
      });

      const result = await agentSpawnByRoleBroker({ workUnit, startPath });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 1,
        signal: null,
        crashed: true,
        capturedOutput: [],
      });
    });
  });

  describe('signal extraction', () => {
    it('VALID: {stdout emits signal-back tool use line} => returns signal in result', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });
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

      const result = await agentSpawnByRoleBroker({ workUnit, startPath });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: {
          signal: 'complete',
          summary: 'All done',
        },
        crashed: false,
        capturedOutput: [],
      });
    });
  });

  describe('text capture', () => {
    it('VALID: {stdout emits assistant text line} => returns capturedOutput with text', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });
      const startPath = FilePathStub({ value: '/project/src' });

      const textLine = JSON.stringify(AssistantTextStreamLineStub());

      proxy.setupSpawnAndMonitor({
        lines: [textLine],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const result = await agentSpawnByRoleBroker({ workUnit, startPath });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: null,
        crashed: false,
        capturedOutput: ['Hello, I can help with that.'],
      });
    });
  });

  describe('session-id resolution failure', () => {
    it('ERROR: {onSessionId throws} => writes error to stderr', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });
      const startPath = FilePathStub({ value: '/project/src' });
      const sessionLine = makeSessionIdLine({ sessionId: SESSION_ID });
      const stderrSpy = proxy.setupStderrCapture();

      proxy.setupSpawnAndMonitor({
        lines: [sessionLine],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const onSessionId = (): void => {
        throw new Error('callback exploded');
      };

      await agentSpawnByRoleBroker({ workUnit, startPath, onSessionId });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(stderrSpy.mock.calls.length).toBeGreaterThan(0);
      expect(stderrSpy.mock.calls[0]?.[0]).toMatch(
        /^\[agent-spawn\] session-id resolution failed:.*callback exploded\n$/u,
      );
    });
  });

  describe('onLine forwarding', () => {
    it('VALID: {onLine callback provided, stdout emits lines} => callback receives lines', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ step });
      const startPath = FilePathStub({ value: '/project/src' });
      const onLine = jest.fn();
      const sessionLine = makeSessionIdLine({ sessionId: SESSION_ID });

      proxy.setupSpawnAndMonitor({
        lines: [sessionLine],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await agentSpawnByRoleBroker({ workUnit, startPath, onLine });

      expect(onLine).toHaveBeenCalledTimes(1);
      expect(onLine.mock.calls[0][0]).toStrictEqual({ line: sessionLine });
    });
  });
});
