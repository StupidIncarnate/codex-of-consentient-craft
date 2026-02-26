import { GuildIdStub, SessionIdStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { chatLineProcessTransformer } from '../../../transformers/chat-line-process/chat-line-process-transformer';
import { chatSpawnBroker } from './chat-spawn-broker';
import { chatSpawnBrokerProxy } from './chat-spawn-broker.proxy';

describe('chatSpawnBroker', () => {
  describe('new session', () => {
    it('VALID: {guildId + message, no sessionId} => returns chatProcessId', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();

      proxy.setupNewSession({ exitCode: ExitCodeStub({ value: 0 }) });

      const onEntry = jest.fn();
      const onPatch = jest.fn();
      const onAgentDetected = jest.fn();
      const onComplete = jest.fn();
      const registerProcess = jest.fn();

      const result = await chatSpawnBroker({
        guildId,
        message: 'Help me build auth',
        processor: chatLineProcessTransformer(),
        onEntry,
        onPatch,
        onAgentDetected,
        onComplete,
        registerProcess,
      });

      expect(result.chatProcessId).toMatch(/^chat-/u);
    });

    it('VALID: {new session} => calls registerProcess with kill function', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();

      proxy.setupNewSession({ exitCode: ExitCodeStub({ value: 0 }) });

      const onEntry = jest.fn();
      const onPatch = jest.fn();
      const onAgentDetected = jest.fn();
      const onComplete = jest.fn();
      const registerProcess = jest.fn();

      await chatSpawnBroker({
        guildId,
        message: 'Help me build auth',
        processor: chatLineProcessTransformer(),
        onEntry,
        onPatch,
        onAgentDetected,
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

      const onEntry = jest.fn();
      const onPatch = jest.fn();
      const onAgentDetected = jest.fn();
      const onComplete = jest.fn();
      const registerProcess = jest.fn();

      const result = await chatSpawnBroker({
        guildId,
        message: 'Continue working',
        sessionId,
        processor: chatLineProcessTransformer(),
        onEntry,
        onPatch,
        onAgentDetected,
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

      const onEntry = jest.fn();
      const onPatch = jest.fn();
      const onAgentDetected = jest.fn();
      const onComplete = jest.fn();
      const registerProcess = jest.fn();

      await chatSpawnBroker({
        guildId,
        message: 'Continue working',
        sessionId,
        processor: chatLineProcessTransformer(),
        onEntry,
        onPatch,
        onAgentDetected,
        onComplete,
        registerProcess,
      });

      expect(registerProcess).toHaveBeenCalledTimes(1);
      expect(typeof registerProcess.mock.calls[0][0].kill).toBe('function');
    });
  });

  describe('line emission', () => {
    it('VALID: {assistant line emitted during new session} => calls onEntry callback', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();

      proxy.setupNewSession({ exitCode: ExitCodeStub({ value: 0 }) });

      const onEntry = jest.fn();
      const onPatch = jest.fn();
      const onAgentDetected = jest.fn();
      const onComplete = jest.fn();
      const registerProcess = jest.fn();

      await chatSpawnBroker({
        guildId,
        message: 'Help me',
        processor: chatLineProcessTransformer(),
        onEntry,
        onPatch,
        onAgentDetected,
        onComplete,
        registerProcess,
      });

      proxy.emitLines({
        lines: ['{"type":"assistant","message":{"content":[{"type":"text","text":"hello"}]}}'],
      });

      expect(onEntry).toHaveBeenCalledTimes(1);
      expect(onEntry.mock.calls[0][0].entry).toStrictEqual({
        type: 'assistant',
        message: { content: [{ type: 'text', text: 'hello' }] },
        source: 'session',
      });
      expect(onEntry.mock.calls[0][0].chatProcessId).toMatch(/^chat-/u);
    });

    it('VALID: {non-parseable line emitted} => does not call onEntry', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();

      proxy.setupNewSession({ exitCode: ExitCodeStub({ value: 0 }) });

      const onEntry = jest.fn();
      const onPatch = jest.fn();
      const onAgentDetected = jest.fn();
      const onComplete = jest.fn();
      const registerProcess = jest.fn();

      await chatSpawnBroker({
        guildId,
        message: 'Help me build auth',
        processor: chatLineProcessTransformer(),
        onEntry,
        onPatch,
        onAgentDetected,
        onComplete,
        registerProcess,
      });

      proxy.emitLines({ lines: ['not-json'] });

      expect(onEntry).toHaveBeenCalledTimes(0);
    });

    it('VALID: {system/init line emitted} => does not call onEntry', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();

      proxy.setupNewSession({ exitCode: ExitCodeStub({ value: 0 }) });

      const onEntry = jest.fn();
      const onPatch = jest.fn();
      const onAgentDetected = jest.fn();
      const onComplete = jest.fn();
      const registerProcess = jest.fn();

      await chatSpawnBroker({
        guildId,
        message: 'Help me build auth',
        processor: chatLineProcessTransformer(),
        onEntry,
        onPatch,
        onAgentDetected,
        onComplete,
        registerProcess,
      });

      proxy.emitLines({ lines: ['{"type":"init","session_id":"abc-123"}'] });

      expect(onEntry).toHaveBeenCalledTimes(0);
    });
  });

  describe('process completion', () => {
    it('VALID: {process exits} => calls onComplete with chatProcessId, exitCode, and sessionId', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();

      proxy.setupNewSession({ exitCode: ExitCodeStub({ value: 0 }) });

      const onEntry = jest.fn();
      const onPatch = jest.fn();
      const onAgentDetected = jest.fn();
      const onComplete = jest.fn();
      const registerProcess = jest.fn();

      const { chatProcessId } = await chatSpawnBroker({
        guildId,
        message: 'Help me build auth',
        processor: chatLineProcessTransformer(),
        onEntry,
        onPatch,
        onAgentDetected,
        onComplete,
        registerProcess,
      });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete.mock.calls[0][0]).toStrictEqual({
        chatProcessId,
        exitCode: 0,
        sessionId: null,
      });
    });

    it('VALID: {resume session exits} => calls onComplete with provided sessionId', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const sessionId = SessionIdStub({ value: 'resume-session-789' });

      proxy.setupResumeSession({ exitCode: ExitCodeStub({ value: 0 }) });

      const onEntry = jest.fn();
      const onPatch = jest.fn();
      const onAgentDetected = jest.fn();
      const onComplete = jest.fn();
      const registerProcess = jest.fn();

      const { chatProcessId } = await chatSpawnBroker({
        guildId,
        message: 'Continue working',
        sessionId,
        processor: chatLineProcessTransformer(),
        onEntry,
        onPatch,
        onAgentDetected,
        onComplete,
        registerProcess,
      });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete.mock.calls[0][0]).toStrictEqual({
        chatProcessId,
        exitCode: 0,
        sessionId,
      });
    });
  });

  describe('quest id uniqueness', () => {
    it('VALID: {new session} => prompt contains UUID quest ID, not kebab-case', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();

      proxy.setupNewSession({ exitCode: ExitCodeStub({ value: 0 }) });

      const onEntry = jest.fn();
      const onPatch = jest.fn();
      const onAgentDetected = jest.fn();
      const onComplete = jest.fn();
      const registerProcess = jest.fn();

      await chatSpawnBroker({
        guildId,
        message: 'Help me build auth',
        processor: chatLineProcessTransformer(),
        onEntry,
        onPatch,
        onAgentDetected,
        onComplete,
        registerProcess,
      });

      const spawnedArgs = proxy.getSpawnedArgs();

      expect(Array.isArray(spawnedArgs)).toBe(true);

      const argsArray = spawnedArgs as unknown[];
      const promptIndex = argsArray.indexOf('-p') + 1;
      const prompt = String(argsArray[promptIndex]);

      expect(prompt).not.toContain('new-quest');
      expect(prompt).toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/u);
    });
  });

  describe('onQuestCreated callback', () => {
    it('VALID: {new session} => calls onQuestCreated with questId and chatProcessId', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();

      proxy.setupNewSession({ exitCode: ExitCodeStub({ value: 0 }) });

      const onEntry = jest.fn();
      const onPatch = jest.fn();
      const onAgentDetected = jest.fn();
      const onComplete = jest.fn();
      const registerProcess = jest.fn();
      const onQuestCreated = jest.fn();

      const result = await chatSpawnBroker({
        guildId,
        message: 'Help me build auth',
        processor: chatLineProcessTransformer(),
        onEntry,
        onPatch,
        onAgentDetected,
        onComplete,
        registerProcess,
        onQuestCreated,
      });

      expect(onQuestCreated).toHaveBeenCalledTimes(1);
      expect(onQuestCreated.mock.calls[0][0].chatProcessId).toBe(result.chatProcessId);
      expect(typeof onQuestCreated.mock.calls[0][0].questId).toBe('string');
    });

    it('VALID: {resume session} => does not call onQuestCreated', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const sessionId = SessionIdStub({ value: 'existing-session-999' });

      proxy.setupResumeSession({ exitCode: ExitCodeStub({ value: 0 }) });

      const onEntry = jest.fn();
      const onPatch = jest.fn();
      const onAgentDetected = jest.fn();
      const onComplete = jest.fn();
      const registerProcess = jest.fn();
      const onQuestCreated = jest.fn();

      await chatSpawnBroker({
        guildId,
        message: 'Continue working',
        sessionId,
        processor: chatLineProcessTransformer(),
        onEntry,
        onPatch,
        onAgentDetected,
        onComplete,
        registerProcess,
        onQuestCreated,
      });

      expect(onQuestCreated).toHaveBeenCalledTimes(0);
    });
  });

  describe('quest creation failure', () => {
    it('ERROR: {quest creation fails} => throws error', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();

      proxy.setupQuestCreationFailure();

      const onEntry = jest.fn();
      const onPatch = jest.fn();
      const onAgentDetected = jest.fn();
      const onComplete = jest.fn();
      const registerProcess = jest.fn();

      await expect(
        chatSpawnBroker({
          guildId,
          message: 'Help me build auth',
          processor: chatLineProcessTransformer(),
          onEntry,
          onPatch,
          onAgentDetected,
          onComplete,
          registerProcess,
        }),
      ).rejects.toThrow(/Failed to create quest/u);
    });
  });
});
