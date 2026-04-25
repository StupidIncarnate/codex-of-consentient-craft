import {
  GuildIdStub,
  RepoRootCwdStub,
  SessionIdStub,
  ExitCodeStub,
  QuestIdStub,
  QuestStub,
  AssistantTextStreamLineStub,
  AssistantToolUseStreamLineStub,
  SuccessfulToolResultStreamLineStub,
  WorkItemRoleStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import { chatLineProcessTransformer } from '../../../transformers/chat-line-process/chat-line-process-transformer';
import { chatSpawnBroker } from './chat-spawn-broker';
import { chatSpawnBrokerProxy } from './chat-spawn-broker.proxy';

describe('chatSpawnBroker', () => {
  describe('chaoswhisperer new session', () => {
    it('VALID: {chaoswhisperer + message, no sessionId} => returns chatProcessId', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });

      proxy.setupNewSession({ exitCode: ExitCodeStub({ value: 0 }) });

      const result = await chatSpawnBroker({
        role,
        guildId,
        message: 'Help me build auth',
        processor: chatLineProcessTransformer(),
        onEntries: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete: jest.fn(),
        registerProcess: jest.fn(),
      });

      expect(result.chatProcessId).toBe('chat-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('VALID: {chaoswhisperer new session} => calls registerProcess with kill function', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const registerProcess = jest.fn();

      proxy.setupNewSession({ exitCode: ExitCodeStub({ value: 0 }) });

      await chatSpawnBroker({
        role,
        guildId,
        message: 'Help me build auth',
        processor: chatLineProcessTransformer(),
        onEntries: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete: jest.fn(),
        registerProcess,
      });

      expect(registerProcess).toHaveBeenCalledTimes(1);

      const [[registerArg]] = registerProcess.mock.calls;

      expect(registerArg).toStrictEqual({
        processId: 'chat-f47ac10b-58cc-4372-a567-0e02b2c3d479',
        kill: expect.any(Function),
      });
    });
  });

  describe('chaoswhisperer resume session', () => {
    it('VALID: {chaoswhisperer + sessionId} => returns chatProcessId', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const sessionId = SessionIdStub({ value: 'existing-session-123' });

      proxy.setupResumeSession({ exitCode: ExitCodeStub({ value: 0 }) });

      const result = await chatSpawnBroker({
        role,
        guildId,
        message: 'Continue working',
        sessionId,
        processor: chatLineProcessTransformer(),
        onEntries: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete: jest.fn(),
        registerProcess: jest.fn(),
      });

      expect(result.chatProcessId).toBe('chat-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });
  });

  describe('chaoswhisperer process completion', () => {
    it('VALID: {chaoswhisperer process exits} => calls onComplete', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const onComplete = jest.fn();

      proxy.setupNewSession({ exitCode: ExitCodeStub({ value: 0 }) });

      const { chatProcessId } = await chatSpawnBroker({
        role,
        guildId,
        message: 'Help me build auth',
        processor: chatLineProcessTransformer(),
        onEntries: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete,
        registerProcess: jest.fn(),
      });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete.mock.calls[0][0].chatProcessId).toBe(chatProcessId);
    });

    it('VALID: {chaoswhisperer resume exits} => calls onComplete with provided sessionId', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const sessionId = SessionIdStub({ value: 'resume-session-789' });
      const onComplete = jest.fn();

      proxy.setupResumeSession({ exitCode: ExitCodeStub({ value: 0 }) });

      const { chatProcessId } = await chatSpawnBroker({
        role,
        guildId,
        message: 'Continue working',
        sessionId,
        processor: chatLineProcessTransformer(),
        onEntries: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete,
        registerProcess: jest.fn(),
      });

      await new Promise((resolve) => {
        setImmediate(resolve);
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

  describe('chaoswhisperer onQuestCreated callback', () => {
    it('VALID: {chaoswhisperer new session} => calls onQuestCreated', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const onQuestCreated = jest.fn();

      proxy.setupNewSession({ exitCode: ExitCodeStub({ value: 0 }) });

      const result = await chatSpawnBroker({
        role,
        guildId,
        message: 'Help me build auth',
        processor: chatLineProcessTransformer(),
        onEntries: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete: jest.fn(),
        registerProcess: jest.fn(),
        onQuestCreated,
      });

      expect(onQuestCreated).toHaveBeenCalledTimes(1);

      const [[questCreatedArg]] = onQuestCreated.mock.calls;

      expect(questCreatedArg).toStrictEqual({
        chatProcessId: result.chatProcessId,
        questId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
    });

    it('VALID: {chaoswhisperer resume session} => does not call onQuestCreated', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const sessionId = SessionIdStub({ value: 'existing-session-999' });
      const onQuestCreated = jest.fn();

      proxy.setupResumeSession({ exitCode: ExitCodeStub({ value: 0 }) });

      await chatSpawnBroker({
        role,
        guildId,
        message: 'Continue working',
        sessionId,
        processor: chatLineProcessTransformer(),
        onEntries: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete: jest.fn(),
        registerProcess: jest.fn(),
        onQuestCreated,
      });

      expect(onQuestCreated).toHaveBeenCalledTimes(0);
    });
  });

  describe('chaoswhisperer quest creation failure', () => {
    it('ERROR: {quest creation fails} => throws error', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });

      proxy.setupQuestCreationFailure();

      await expect(
        chatSpawnBroker({
          role,
          guildId,
          message: 'Help me build auth',
          processor: chatLineProcessTransformer(),
          onEntries: jest.fn(),
          onAgentDetected: jest.fn(),
          onComplete: jest.fn(),
          registerProcess: jest.fn(),
        }),
      ).rejects.toThrow(/Failed to create quest/u);
    });
  });

  describe('chaoswhisperer onEntries via stdout lines', () => {
    it('VALID: {stdout emits assistant text line} => calls onEntries with parsed entry', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const onEntries = jest.fn();
      const assistantLine = JSON.stringify(AssistantTextStreamLineStub());

      proxy.setupNewSession({
        exitCode: ExitCodeStub({ value: 0 }),
        stdoutLines: [assistantLine],
      });

      await chatSpawnBroker({
        role,
        guildId,
        message: 'Help me build auth',
        processor: chatLineProcessTransformer(),
        onEntries,
        onAgentDetected: jest.fn(),
        onComplete: jest.fn(),
        registerProcess: jest.fn(),
      });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(onEntries).toHaveBeenCalledTimes(1);
      expect(onEntries.mock.calls[0][0].entries[0].role).toBe('assistant');
    });
  });

  describe('glyphsmith onEntries via stdout lines', () => {
    it('VALID: {glyphsmith stdout emits assistant text line} => calls onEntries with parsed entry', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'glyphsmith' });
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'explore_design' });
      const onEntries = jest.fn();
      const assistantLine = JSON.stringify(AssistantTextStreamLineStub());

      proxy.setupGlyphsmithSession({
        exitCode: ExitCodeStub({ value: 0 }),
        quest,
        stdoutLines: [assistantLine],
      });

      await chatSpawnBroker({
        role,
        guildId,
        questId,
        message: 'Create prototype',
        processor: chatLineProcessTransformer(),
        onEntries,
        onAgentDetected: jest.fn(),
        onComplete: jest.fn(),
        registerProcess: jest.fn(),
      });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(onEntries).toHaveBeenCalledTimes(1);
      expect(onEntries.mock.calls[0][0].entries[0].role).toBe('assistant');
    });
  });

  describe('glyphsmith onDesignSessionLinked callback', () => {
    it('VALID: {glyphsmith new session with no sessionId} => calls onDesignSessionLinked', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'glyphsmith' });
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'explore_design' });
      const onDesignSessionLinked = jest.fn();
      const sessionLine = JSON.stringify({ session_id: 'extracted-session-abc' });

      proxy.setupGlyphsmithSession({
        exitCode: ExitCodeStub({ value: 0 }),
        quest,
        stdoutLines: [sessionLine],
      });

      const { chatProcessId } = await chatSpawnBroker({
        role,
        guildId,
        questId,
        message: 'Create prototype',
        processor: chatLineProcessTransformer(),
        onEntries: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete: jest.fn(),
        onDesignSessionLinked,
        registerProcess: jest.fn(),
      });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(onDesignSessionLinked).toHaveBeenCalledTimes(1);

      const [[designLinkedArg]] = onDesignSessionLinked.mock.calls;

      expect(designLinkedArg).toStrictEqual({
        chatProcessId,
        questId: 'design-quest',
      });
    });
  });

  describe('chaoswhisperer questSessionWriteLayerBroker', () => {
    it('VALID: {chaoswhisperer new session extracts sessionId} => calls questSessionWriteLayerBroker', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const onComplete = jest.fn();
      const sessionLine = JSON.stringify({ session_id: 'extracted-session-xyz' });

      proxy.setupNewSession({
        exitCode: ExitCodeStub({ value: 0 }),
        stdoutLines: [sessionLine],
      });

      await chatSpawnBroker({
        role,
        guildId,
        message: 'Help me build auth',
        processor: chatLineProcessTransformer(),
        onEntries: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete,
        registerProcess: jest.fn(),
      });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete.mock.calls[0][0].sessionId).toBe('extracted-session-xyz');
    });
  });

  describe('glyphsmith designSessionWriteLayerBroker', () => {
    it('VALID: {glyphsmith new session extracts sessionId} => calls designSessionWriteLayerBroker', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'glyphsmith' });
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'explore_design' });
      const onComplete = jest.fn();
      const sessionLine = JSON.stringify({ session_id: 'extracted-design-session' });

      proxy.setupGlyphsmithSession({
        exitCode: ExitCodeStub({ value: 0 }),
        quest,
        stdoutLines: [sessionLine],
      });

      await chatSpawnBroker({
        role,
        guildId,
        questId,
        message: 'Create prototype',
        processor: chatLineProcessTransformer(),
        onEntries: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete,
        registerProcess: jest.fn(),
      });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete.mock.calls[0][0].sessionId).toBe('extracted-design-session');
    });
  });

  describe('onSessionIdExtracted callback', () => {
    it('VALID: {sessionId$ resolves, new session} => invokes onSessionIdExtracted', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const onSessionIdExtracted = jest.fn();
      const sessionLine = JSON.stringify({ session_id: 'extracted-session-abc' });

      const linkQuest = QuestStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        status: 'created',
        workItems: [WorkItemStub({ role: 'chaoswhisperer' })],
      });

      proxy.setupNewSession({
        exitCode: ExitCodeStub({ value: 0 }),
        stdoutLines: [sessionLine],
      });
      proxy.setupSessionLinkQuest({ quest: linkQuest });

      const { chatProcessId } = await chatSpawnBroker({
        role,
        guildId,
        message: 'Help me build auth',
        processor: chatLineProcessTransformer(),
        onEntries: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete: jest.fn(),
        onSessionIdExtracted,
        registerProcess: jest.fn(),
      });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(onSessionIdExtracted).toHaveBeenCalledTimes(1);

      const [[extractedArg]] = onSessionIdExtracted.mock.calls;

      expect(extractedArg).toStrictEqual({
        chatProcessId,
        sessionId: 'extracted-session-abc',
      });
    });

    it('EMPTY: {resumed session} => does NOT invoke onSessionIdExtracted', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const sessionId = SessionIdStub({ value: 'resumed-session-xyz' });
      const onSessionIdExtracted = jest.fn();
      const sessionLine = JSON.stringify({ session_id: 'extracted-session-should-ignore' });

      proxy.setupResumeSession({
        exitCode: ExitCodeStub({ value: 0 }),
        stdoutLines: [sessionLine],
      });

      await chatSpawnBroker({
        role,
        guildId,
        message: 'Continue working',
        sessionId,
        processor: chatLineProcessTransformer(),
        onEntries: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete: jest.fn(),
        onSessionIdExtracted,
        registerProcess: jest.fn(),
      });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(onSessionIdExtracted).toHaveBeenCalledTimes(0);
    });
  });

  describe('session-id quest link failure', () => {
    it('ERROR: {questModifyBroker rejects during session link} => writes error to stderr', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const sessionLine = JSON.stringify({ session_id: 'link-fail-session' });
      const stderrSpy = proxy.setupStderrCapture();

      const linkQuest = QuestStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        status: 'created',
        workItems: [WorkItemStub({ role: 'chaoswhisperer' })],
      });

      proxy.setupNewSession({
        exitCode: ExitCodeStub({ value: 0 }),
        stdoutLines: [sessionLine],
      });

      proxy.setupSessionLinkQuest({ quest: linkQuest });
      proxy.setupSessionLinkReject({ error: new Error('modify exploded') });

      await chatSpawnBroker({
        role,
        guildId,
        message: 'Help me build auth',
        processor: chatLineProcessTransformer(),
        onEntries: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete: jest.fn(),
        registerProcess: jest.fn(),
      });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(stderrSpy.mock.calls.length).toBeGreaterThan(0);
      expect(stderrSpy.mock.calls[0]?.[0]).toMatch(
        /^\[chat-spawn\] session-id quest link failed:.*modify exploded\n$/u,
      );
    });
  });

  describe('exitCode null handling', () => {
    it('VALID: {process killed with null exit code} => calls onComplete with null exitCode', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const onComplete = jest.fn();

      proxy.setupNewSession({ exitCode: null as never });

      await chatSpawnBroker({
        role,
        guildId,
        message: 'Help me build auth',
        processor: chatLineProcessTransformer(),
        onEntries: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete,
        registerProcess: jest.fn(),
      });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete.mock.calls[0][0].exitCode).toBe(null);
    });
  });

  describe('glyphsmith new session', () => {
    it('VALID: {glyphsmith + questId in explore_design} => returns chatProcessId', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'glyphsmith' });
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'explore_design' });

      proxy.setupGlyphsmithSession({ exitCode: ExitCodeStub({ value: 0 }), quest });

      const result = await chatSpawnBroker({
        role,
        guildId,
        questId,
        message: 'Create login page prototype',
        processor: chatLineProcessTransformer(),
        onEntries: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete: jest.fn(),
        registerProcess: jest.fn(),
      });

      expect(result.chatProcessId).toBe('design-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('VALID: {glyphsmith + questId in review_design} => returns chatProcessId', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'glyphsmith' });
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'review_design' });

      proxy.setupGlyphsmithSession({ exitCode: ExitCodeStub({ value: 0 }), quest });

      const result = await chatSpawnBroker({
        role,
        guildId,
        questId,
        message: 'Iterate on prototype',
        processor: chatLineProcessTransformer(),
        onEntries: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete: jest.fn(),
        registerProcess: jest.fn(),
      });

      expect(result.chatProcessId).toBe('design-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('VALID: {glyphsmith + questId in design_approved} => returns chatProcessId', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'glyphsmith' });
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'design_approved' });

      proxy.setupGlyphsmithSession({ exitCode: ExitCodeStub({ value: 0 }), quest });

      const result = await chatSpawnBroker({
        role,
        guildId,
        questId,
        message: 'Review approved design',
        processor: chatLineProcessTransformer(),
        onEntries: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete: jest.fn(),
        registerProcess: jest.fn(),
      });

      expect(result.chatProcessId).toBe('design-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('VALID: {glyphsmith session} => calls registerProcess with kill function', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'glyphsmith' });
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'explore_design' });
      const registerProcess = jest.fn();

      proxy.setupGlyphsmithSession({ exitCode: ExitCodeStub({ value: 0 }), quest });

      await chatSpawnBroker({
        role,
        guildId,
        questId,
        message: 'Create prototype',
        processor: chatLineProcessTransformer(),
        onEntries: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete: jest.fn(),
        registerProcess,
      });

      expect(registerProcess).toHaveBeenCalledTimes(1);

      const [[registerArg]] = registerProcess.mock.calls;

      expect(registerArg).toStrictEqual({
        processId: 'design-f47ac10b-58cc-4372-a567-0e02b2c3d479',
        kill: expect.any(Function),
      });
    });
  });

  describe('glyphsmith resume session', () => {
    it('VALID: {glyphsmith + sessionId} => returns chatProcessId', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'glyphsmith' });
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'explore_design' });
      const sessionId = SessionIdStub({ value: 'design-session-123' });

      proxy.setupGlyphsmithSession({ exitCode: ExitCodeStub({ value: 0 }), quest });

      const result = await chatSpawnBroker({
        role,
        guildId,
        questId,
        message: 'Continue design',
        sessionId,
        processor: chatLineProcessTransformer(),
        onEntries: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete: jest.fn(),
        registerProcess: jest.fn(),
      });

      expect(result.chatProcessId).toBe('design-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });
  });

  describe('glyphsmith status guard', () => {
    it('ERROR: {glyphsmith + quest in approved status} => throws', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'glyphsmith' });
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'approved' });

      proxy.setupInvalidStatus({ quest });

      await expect(
        chatSpawnBroker({
          role,
          guildId,
          questId,
          message: 'Create prototype',
          processor: chatLineProcessTransformer(),
          onEntries: jest.fn(),
          onAgentDetected: jest.fn(),
          onComplete: jest.fn(),
          registerProcess: jest.fn(),
        }),
      ).rejects.toThrow(/Quest must be in a design phase/u);
    });

    it('ERROR: {glyphsmith + quest in created status} => throws', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'glyphsmith' });
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'created' });

      proxy.setupInvalidStatus({ quest });

      await expect(
        chatSpawnBroker({
          role,
          guildId,
          questId,
          message: 'Create prototype',
          processor: chatLineProcessTransformer(),
          onEntries: jest.fn(),
          onAgentDetected: jest.fn(),
          onComplete: jest.fn(),
          registerProcess: jest.fn(),
        }),
      ).rejects.toThrow(/Current status: created/u);
    });
  });

  describe('glyphsmith quest not found', () => {
    it('ERROR: {glyphsmith + nonexistent questId} => throws', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'glyphsmith' });
      const questId = QuestIdStub({ value: 'nonexistent' });

      proxy.setupQuestNotFound();

      await expect(
        chatSpawnBroker({
          role,
          guildId,
          questId,
          message: 'Create prototype',
          processor: chatLineProcessTransformer(),
          onEntries: jest.fn(),
          onAgentDetected: jest.fn(),
          onComplete: jest.fn(),
          registerProcess: jest.fn(),
        }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });

  describe('onAgentDetected via agent-detected output', () => {
    it('VALID: {user tool_result with toolUseResult.agentId, sessionId set} => calls onAgentDetected with realAgentId + toolUseId + sessionId', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const sessionId = SessionIdStub({ value: 'session-for-patch' });
      const onAgentDetected = jest.fn();
      const toolUseId = 'toolu_patch_test_01';

      const assistantLine = JSON.stringify(
        AssistantToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'tool_use', id: toolUseId, name: 'Task', input: {} }],
          },
        } as Parameters<typeof AssistantToolUseStreamLineStub>[0]),
      );

      const userLine = JSON.stringify({
        ...SuccessfulToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: toolUseId, content: 'done' }],
          },
        } as Parameters<typeof SuccessfulToolResultStreamLineStub>[0]),
        toolUseResult: { agentId: 'agent-patch-test' },
      });

      proxy.setupResumeSession({
        exitCode: ExitCodeStub({ value: 0 }),
        stdoutLines: [assistantLine, userLine],
      });

      await chatSpawnBroker({
        role,
        guildId,
        message: 'Continue working',
        sessionId,
        processor: chatLineProcessTransformer(),
        onEntries: jest.fn(),
        onAgentDetected,
        onComplete: jest.fn(),
        registerProcess: jest.fn(),
      });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(onAgentDetected).toHaveBeenCalledTimes(1);

      const [[detectedArg]] = onAgentDetected.mock.calls;

      expect(detectedArg).toStrictEqual({
        chatProcessId: 'chat-f47ac10b-58cc-4372-a567-0e02b2c3d479',
        toolUseId: 'toolu_patch_test_01',
        agentId: 'agent-patch-test',
        sessionId,
      });
    });

    it('VALID: {user tool_result with toolUseResult.agentId, sessionId undefined} => does not call onAgentDetected', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const onAgentDetected = jest.fn();
      const toolUseId = 'toolu_patch_no_session_01';

      const assistantLine = JSON.stringify(
        AssistantToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'tool_use', id: toolUseId, name: 'Task', input: {} }],
          },
        } as Parameters<typeof AssistantToolUseStreamLineStub>[0]),
      );

      const userLine = JSON.stringify({
        ...SuccessfulToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: toolUseId, content: 'done' }],
          },
        } as Parameters<typeof SuccessfulToolResultStreamLineStub>[0]),
        toolUseResult: { agentId: 'agent-no-session' },
      });

      proxy.setupNewSession({
        exitCode: ExitCodeStub({ value: 0 }),
        stdoutLines: [assistantLine, userLine],
      });

      await chatSpawnBroker({
        role,
        guildId,
        message: 'Help me build auth',
        processor: chatLineProcessTransformer(),
        onEntries: jest.fn(),
        onAgentDetected,
        onComplete: jest.fn(),
        registerProcess: jest.fn(),
      });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(onAgentDetected).toHaveBeenCalledTimes(0);
    });

    it('VALID: {assistant Task tool_use emitted alone, no matching user tool_result} => does not call onAgentDetected', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const sessionId = SessionIdStub({ value: 'session-task-alone' });
      const onAgentDetected = jest.fn();
      const toolUseId = 'toolu_task_alone_01';

      const assistantLine = JSON.stringify(
        AssistantToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'tool_use', id: toolUseId, name: 'Task', input: {} }],
          },
        } as Parameters<typeof AssistantToolUseStreamLineStub>[0]),
      );

      proxy.setupResumeSession({
        exitCode: ExitCodeStub({ value: 0 }),
        stdoutLines: [assistantLine],
      });

      await chatSpawnBroker({
        role,
        guildId,
        message: 'Continue working',
        sessionId,
        processor: chatLineProcessTransformer(),
        onEntries: jest.fn(),
        onAgentDetected,
        onComplete: jest.fn(),
        registerProcess: jest.fn(),
      });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(onAgentDetected).toHaveBeenCalledTimes(0);
    });
  });

  describe('SUBAGENT_DEBUG gated logging', () => {
    it('EDGE: {SUBAGENT_DEBUG env var not set} => does not write SUBAGENT-TRACE lines to stderr', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const stderrSpy = proxy.setupStderrCapture();
      const assistantLine = JSON.stringify(AssistantTextStreamLineStub());

      proxy.setupNewSession({
        exitCode: ExitCodeStub({ value: 0 }),
        stdoutLines: [assistantLine],
      });

      await chatSpawnBroker({
        role,
        guildId,
        message: 'Help me build auth',
        processor: chatLineProcessTransformer(),
        onEntries: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete: jest.fn(),
        registerProcess: jest.fn(),
      });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      const traceCalls = stderrSpy.mock.calls.filter((call) =>
        String(call[0]).includes('[SUBAGENT-TRACE]'),
      );

      expect(traceCalls).toStrictEqual([]);
    });
  });

  describe('cwd resolution', () => {
    it('VALID: {cwdResolveBroker resolves repo-root above guild path} => spawns with resolved repo-root cwd', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const resolvedRepoRoot = RepoRootCwdStub({ value: '/home/user/repo-root' });

      proxy.setupCwdResolveSuccess({ cwd: resolvedRepoRoot });
      proxy.setupNewSession({ exitCode: ExitCodeStub({ value: 0 }) });

      await chatSpawnBroker({
        role,
        guildId,
        message: 'Help me build auth',
        processor: chatLineProcessTransformer(),
        onEntries: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete: jest.fn(),
        registerProcess: jest.fn(),
      });

      const spawnedCwd = proxy.getSpawnedCwd();

      expect(spawnedCwd).toBe(resolvedRepoRoot);
    });

    it('ERROR: {cwdResolveBroker throws} => falls back to repoRootCwdContract.parse(guild.path) for cwd', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });

      proxy.setupCwdResolveReject({ error: new Error('no .dungeonmaster.json ancestor') });
      proxy.setupNewSession({ exitCode: ExitCodeStub({ value: 0 }) });

      await chatSpawnBroker({
        role,
        guildId,
        message: 'Help me build auth',
        processor: chatLineProcessTransformer(),
        onEntries: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete: jest.fn(),
        registerProcess: jest.fn(),
      });

      const spawnedCwd = proxy.getSpawnedCwd();

      expect(spawnedCwd).toBe(RepoRootCwdStub({ value: '/home/user/my-guild' }));
    });
  });

  describe('glyphsmith process completion', () => {
    it('VALID: {glyphsmith process exits} => calls onComplete', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'glyphsmith' });
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'explore_design' });
      const onComplete = jest.fn();

      proxy.setupGlyphsmithSession({ exitCode: ExitCodeStub({ value: 0 }), quest });

      const { chatProcessId } = await chatSpawnBroker({
        role,
        guildId,
        questId,
        message: 'Create prototype',
        processor: chatLineProcessTransformer(),
        onEntries: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete,
        registerProcess: jest.fn(),
      });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete.mock.calls[0][0].chatProcessId).toBe(chatProcessId);
    });
  });
});
