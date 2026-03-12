import { AbsoluteFilePathStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { PromptTextStub } from '../../../contracts/prompt-text/prompt-text.stub';

import { agentSpawnUnifiedBroker } from './agent-spawn-unified-broker';
import { agentSpawnUnifiedBrokerProxy } from './agent-spawn-unified-broker.proxy';

const SESSION_ID = '9c4d8f1c-3e38-48c9-bdec-22b61883b473';
const ALT_SESSION_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const makeSessionIdLine = ({
  sessionId,
}: {
  sessionId: typeof SESSION_ID | typeof ALT_SESSION_ID;
}) => JSON.stringify({ session_id: sessionId });

const waitForExit = async (): Promise<void> => {
  // The proxy uses nested setImmediate: first for lines, second for exit
  await new Promise<undefined>((resolve) => {
    setImmediate(() => {
      resolve(undefined);
    });
  });
  await new Promise<undefined>((resolve) => {
    setImmediate(() => {
      resolve(undefined);
    });
  });
  await new Promise<undefined>((resolve) => {
    setImmediate(() => {
      resolve(undefined);
    });
  });
};

describe('agentSpawnUnifiedBroker', () => {
  describe('happy path', () => {
    it('VALID: {spawn, emit lines, exit 0} => onComplete called with exitCode 0 and sessionId', async () => {
      const proxy = agentSpawnUnifiedBrokerProxy();
      const onLine = jest.fn();
      const onComplete = jest.fn();
      const sessionLine = makeSessionIdLine({ sessionId: SESSION_ID });

      proxy.setupSpawnAndEmitLines({
        lines: [sessionLine],
        exitCode: 0,
      });

      const { sessionId$ } = agentSpawnUnifiedBroker({
        prompt: PromptTextStub(),
        cwd: AbsoluteFilePathStub({ value: '/test' }),
        onLine,
        onComplete,
      });

      await waitForExit();

      const resolvedSessionId = await sessionId$;

      expect(onLine).toHaveBeenCalledTimes(1);
      expect(onLine).toHaveBeenCalledWith({ line: sessionLine });
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith({ exitCode: 0, sessionId: SESSION_ID });
      expect(resolvedSessionId).toBe(SESSION_ID);
    });
  });

  describe('error handling', () => {
    it('ERROR: {process emits error} => onError called', async () => {
      const proxy = agentSpawnUnifiedBrokerProxy();
      const onLine = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();
      const testError = new Error('spawn failed');

      proxy.setupSpawnAndEmitLinesWithError({
        lines: [],
        error: testError,
        exitCode: 1,
      });

      agentSpawnUnifiedBroker({
        prompt: PromptTextStub(),
        cwd: AbsoluteFilePathStub({ value: '/test' }),
        onLine,
        onError,
        onComplete,
      });

      await waitForExit();

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith({ error: testError });
    });

    it('ERROR: {onError not provided, process emits error} => no crash', async () => {
      const proxy = agentSpawnUnifiedBrokerProxy();
      const onLine = jest.fn();
      const onComplete = jest.fn();
      const testError = new Error('spawn failed');

      proxy.setupSpawnAndEmitLinesWithError({
        lines: [],
        error: testError,
        exitCode: 1,
      });

      agentSpawnUnifiedBroker({
        prompt: PromptTextStub(),
        cwd: AbsoluteFilePathStub({ value: '/test' }),
        onLine,
        onComplete,
      });

      await waitForExit();

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('session ID extraction', () => {
    it('EMPTY: {exit without session ID} => onComplete called with null sessionId', async () => {
      const proxy = agentSpawnUnifiedBrokerProxy();
      const onLine = jest.fn();
      const onComplete = jest.fn();

      proxy.setupSpawnAndEmitLines({
        lines: ['not a session line'],
        exitCode: 0,
      });

      const { sessionId$ } = agentSpawnUnifiedBroker({
        prompt: PromptTextStub(),
        cwd: AbsoluteFilePathStub({ value: '/test' }),
        onLine,
        onComplete,
      });

      await waitForExit();

      const resolvedSessionId = await sessionId$;

      expect(onComplete).toHaveBeenCalledWith({ exitCode: 0, sessionId: null });
      expect(resolvedSessionId).toBeNull();
    });

    it('VALID: {two session ID lines} => extracts first sessionId only', async () => {
      const proxy = agentSpawnUnifiedBrokerProxy();
      const onLine = jest.fn();
      const onComplete = jest.fn();
      const sessionLine1 = makeSessionIdLine({ sessionId: SESSION_ID });
      const sessionLine2 = makeSessionIdLine({ sessionId: ALT_SESSION_ID });

      proxy.setupSpawnAndEmitLines({
        lines: [sessionLine1, sessionLine2],
        exitCode: 0,
      });

      const { sessionId$ } = agentSpawnUnifiedBroker({
        prompt: PromptTextStub(),
        cwd: AbsoluteFilePathStub({ value: '/test' }),
        onLine,
        onComplete,
      });

      await waitForExit();

      const resolvedSessionId = await sessionId$;

      expect(onComplete).toHaveBeenCalledWith({ exitCode: 0, sessionId: SESSION_ID });
      expect(resolvedSessionId).toBe(SESSION_ID);
    });

    it('VALID: {sessionId$ with no session ID before exit} => resolves null', async () => {
      const proxy = agentSpawnUnifiedBrokerProxy();
      const onLine = jest.fn();
      const onComplete = jest.fn();

      proxy.setupSpawnAndEmitLines({
        lines: [],
        exitCode: 0,
      });

      const { sessionId$ } = agentSpawnUnifiedBroker({
        prompt: PromptTextStub(),
        cwd: AbsoluteFilePathStub({ value: '/test' }),
        onLine,
        onComplete,
      });

      await waitForExit();

      const resolvedSessionId = await sessionId$;

      expect(resolvedSessionId).toBeNull();
    });
  });

  describe('line forwarding', () => {
    it('VALID: {multiple lines} => each forwarded to onLine', async () => {
      const proxy = agentSpawnUnifiedBrokerProxy();
      const onLine = jest.fn();
      const onComplete = jest.fn();
      const line1 = 'first line';
      const line2 = 'second line';
      const line3 = 'third line';

      proxy.setupSpawnAndEmitLines({
        lines: [line1, line2, line3],
        exitCode: 0,
      });

      agentSpawnUnifiedBroker({
        prompt: PromptTextStub(),
        cwd: AbsoluteFilePathStub({ value: '/test' }),
        onLine,
        onComplete,
      });

      await waitForExit();

      expect(onLine).toHaveBeenCalledTimes(3);
      expect(onLine).toHaveBeenNthCalledWith(1, { line: line1 });
      expect(onLine).toHaveBeenNthCalledWith(2, { line: line2 });
      expect(onLine).toHaveBeenNthCalledWith(3, { line: line3 });
    });
  });

  describe('kill handle', () => {
    it('VALID: {calling kill()} => kills child process', async () => {
      const proxy = agentSpawnUnifiedBrokerProxy();
      const onLine = jest.fn();
      const onComplete = jest.fn();

      const { mockProcess } = proxy.setupSpawnExitOnKill({
        lines: [],
        exitCode: null,
      });

      const { kill, sessionId$ } = agentSpawnUnifiedBroker({
        prompt: PromptTextStub(),
        cwd: AbsoluteFilePathStub({ value: '/test' }),
        onLine,
        onComplete,
      });

      kill();

      await waitForExit();

      expect(mockProcess.kill).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith({ exitCode: null, sessionId: null });
      await expect(sessionId$).resolves.toBeNull();
    });
  });

  describe('exit codes', () => {
    it('VALID: {exit with non-zero code} => exitCode forwarded correctly', async () => {
      const proxy = agentSpawnUnifiedBrokerProxy();
      const onLine = jest.fn();
      const onComplete = jest.fn();

      proxy.setupSpawnAndEmitLines({
        lines: [],
        exitCode: 130,
      });

      agentSpawnUnifiedBroker({
        prompt: PromptTextStub(),
        cwd: AbsoluteFilePathStub({ value: '/test' }),
        onLine,
        onComplete,
      });

      await waitForExit();

      expect(onComplete).toHaveBeenCalledWith({ exitCode: 130, sessionId: null });
    });
  });

  describe('resume session', () => {
    it('VALID: {resumeSessionId provided} => passed through to adapter', async () => {
      const proxy = agentSpawnUnifiedBrokerProxy();
      const onLine = jest.fn();
      const onComplete = jest.fn();
      const resumeSessionId = SessionIdStub({ value: SESSION_ID });

      proxy.setupSpawnAndEmitLines({
        lines: [],
        exitCode: 0,
      });

      agentSpawnUnifiedBroker({
        prompt: PromptTextStub(),
        cwd: AbsoluteFilePathStub({ value: '/test' }),
        resumeSessionId,
        onLine,
        onComplete,
      });

      await waitForExit();

      const spawnedArgs = proxy.getSpawnedArgs();

      expect(spawnedArgs).toStrictEqual([
        '-p',
        PromptTextStub(),
        '--output-format',
        'stream-json',
        '--verbose',
        '--resume',
        SESSION_ID,
      ]);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });
});
