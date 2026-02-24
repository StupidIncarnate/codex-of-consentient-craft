import { GuildIdStub, SessionIdStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { chatSpawnBroker } from './chat-spawn-broker';
import { chatSpawnBrokerProxy } from './chat-spawn-broker.proxy';

describe('chatSpawnBroker', () => {
  describe('new session', () => {
    it('VALID: {guildId + message, no sessionId} => returns chatProcessId', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();

      proxy.setupNewSession({ exitCode: ExitCodeStub({ value: 0 }) });

      const onLine = jest.fn();
      const onComplete = jest.fn();
      const registerProcess = jest.fn();

      const result = await chatSpawnBroker({
        guildId,
        message: 'Help me build auth',
        onLine,
        onComplete,
        registerProcess,
      });

      expect(result.chatProcessId).toMatch(/^chat-/u);
    });

    it('VALID: {new session} => calls registerProcess with kill function', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();

      proxy.setupNewSession({ exitCode: ExitCodeStub({ value: 0 }) });

      const onLine = jest.fn();
      const onComplete = jest.fn();
      const registerProcess = jest.fn();

      await chatSpawnBroker({
        guildId,
        message: 'Help me build auth',
        onLine,
        onComplete,
        registerProcess,
      });

      expect(registerProcess).toHaveBeenCalledTimes(1);
      expect(typeof registerProcess.mock.calls[0][0].processId).toBe('string');
      expect(typeof registerProcess.mock.calls[0][0].kill).toBe('function');
    });
  });

  describe('resume session', () => {
    it('VALID: {guildId + message + sessionId} => returns chatProcessId', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const sessionId = SessionIdStub({ value: 'existing-session-123' });

      proxy.setupResumeSession({ exitCode: ExitCodeStub({ value: 0 }) });

      const onLine = jest.fn();
      const onComplete = jest.fn();
      const registerProcess = jest.fn();

      const result = await chatSpawnBroker({
        guildId,
        message: 'Continue working',
        sessionId,
        onLine,
        onComplete,
        registerProcess,
      });

      expect(result.chatProcessId).toMatch(/^chat-/u);
    });

    it('VALID: {resume session} => calls registerProcess with kill function', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const sessionId = SessionIdStub({ value: 'existing-session-456' });

      proxy.setupResumeSession({ exitCode: ExitCodeStub({ value: 0 }) });

      const onLine = jest.fn();
      const onComplete = jest.fn();
      const registerProcess = jest.fn();

      await chatSpawnBroker({
        guildId,
        message: 'Continue working',
        sessionId,
        onLine,
        onComplete,
        registerProcess,
      });

      expect(registerProcess).toHaveBeenCalledTimes(1);
      expect(typeof registerProcess.mock.calls[0][0].kill).toBe('function');
    });
  });

  describe('line emission', () => {
    it('VALID: {line emitted during new session} => calls onLine callback', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();

      proxy.setupNewSession({ exitCode: ExitCodeStub({ value: 0 }) });

      const onLine = jest.fn();
      const onComplete = jest.fn();
      const registerProcess = jest.fn();

      await chatSpawnBroker({
        guildId,
        message: 'Help me',
        onLine,
        onComplete,
        registerProcess,
      });

      proxy.emitLines({ lines: ['{"type":"init"}'] });

      expect(onLine).toHaveBeenCalledTimes(1);
      expect(onLine.mock.calls[0][0].line).toBe('{"type":"init"}');
      expect(onLine.mock.calls[0][0].chatProcessId).toMatch(/^chat-/u);
    });
  });
});
