import {
  AbsoluteFilePathStub,
  GuildIdStub,
  RepoRootCwdStub,
  SessionIdStub,
  ExitCodeStub,
  QuestIdStub,
  QuestStub,
  AssistantTextStreamLineStub,
  WorkItemRoleStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import { pastedImageStatics } from '@dungeonmaster/shared/statics';
import { chatSpawnBroker } from './chat-spawn-broker';
import { chatSpawnBrokerProxy } from './chat-spawn-broker.proxy';

// proxy.getSpawnedArgs() is declared `() => unknown` (chatSpawnBrokerProxy delegates straight
// through agentLaunchBrokerProxy's own `unknown`-typed getter). Narrowing here via Array.isArray
// reads one positional value without an `as` cast or a conditional inside a test body.
const spawnedArgvValueAt = ({ args, index }: { args: unknown; index: number }): unknown =>
  Array.isArray(args) ? args[index] : undefined;

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
        onEntries: jest.fn(),
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
        onEntries: jest.fn(),
        onComplete: jest.fn(),
        registerProcess,
      });

      expect(registerProcess).toHaveBeenCalledTimes(1);

      const [[registerArg]] = registerProcess.mock.calls;

      expect(registerArg).toStrictEqual({
        processId: 'chat-f47ac10b-58cc-4372-a567-0e02b2c3d479',
        questId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        questWorkItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        kill: expect.any(Function),
      });
    });

    it('VALID: {chaoswhisperer new session, message carries an image token} => spawns with the image path inside -p', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const ABSOLUTE_IMAGE_PATH = '/home/user/.dungeonmaster/guilds/g1/quests/q1/images/2f6d.png';
      const message = `here is the mock ![Pasted Image 1](${ABSOLUTE_IMAGE_PATH}) build me this`;

      proxy.setupNewSession({ exitCode: ExitCodeStub({ value: 0 }) });

      await chatSpawnBroker({
        role,
        guildId,
        message,
        onEntries: jest.fn(),
        onComplete: jest.fn(),
        registerProcess: jest.fn(),
      });

      const args = proxy.getSpawnedArgs();
      const promptArg = String(spawnedArgvValueAt({ args, index: 1 }));
      const occurrenceCount = promptArg.split(ABSOLUTE_IMAGE_PATH).length;

      expect(spawnedArgvValueAt({ args, index: 0 })).toBe('-p');
      expect(occurrenceCount).toBe(2);

      const trailer = `\n\n${pastedImageStatics.promptSentinel}\n${pastedImageStatics.promptInstruction}`;
      const promptTail = promptArg.slice(-trailer.length);

      expect(promptTail).toBe(trailer);
    });
  });

  describe('chaoswhisperer resume session', () => {
    it('VALID: {chaoswhisperer + sessionId} => returns chatProcessId', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const sessionId = SessionIdStub({ value: 'existing-session-123' });
      const questId = QuestIdStub({ value: 'existing-quest-resume' });

      proxy.setupResumeSession({ exitCode: ExitCodeStub({ value: 0 }), questId });

      const result = await chatSpawnBroker({
        role,
        guildId,
        questId,
        message: 'Continue working',
        sessionId,
        onEntries: jest.fn(),
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
        onEntries: jest.fn(),
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
      const questId = QuestIdStub({ value: 'existing-quest-resume-completion' });
      const onComplete = jest.fn();

      proxy.setupResumeSession({ exitCode: ExitCodeStub({ value: 0 }), questId });

      const { chatProcessId } = await chatSpawnBroker({
        role,
        guildId,
        questId,
        message: 'Continue working',
        sessionId,
        onEntries: jest.fn(),
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
        onEntries: jest.fn(),
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
      const questId = QuestIdStub({ value: 'existing-quest-resume-no-create' });
      const onQuestCreated = jest.fn();

      proxy.setupResumeSession({ exitCode: ExitCodeStub({ value: 0 }), questId });

      await chatSpawnBroker({
        role,
        guildId,
        questId,
        message: 'Continue working',
        sessionId,
        onEntries: jest.fn(),
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
          onEntries: jest.fn(),
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
        onEntries,
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
        onEntries,
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
        onEntries: jest.fn(),
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
        onEntries: jest.fn(),
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
        onEntries: jest.fn(),
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
        onEntries: jest.fn(),
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
      const questId = QuestIdStub({ value: 'existing-quest-resume-no-extract' });
      const onSessionIdExtracted = jest.fn();
      const sessionLine = JSON.stringify({ session_id: 'extracted-session-should-ignore' });

      proxy.setupResumeSession({
        exitCode: ExitCodeStub({ value: 0 }),
        stdoutLines: [sessionLine],
        questId,
      });

      await chatSpawnBroker({
        role,
        guildId,
        questId,
        message: 'Continue working',
        sessionId,
        onEntries: jest.fn(),
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

      // A leaked background poller (e.g. the rate-limits watcher) can land an unrelated
      // write inside this stderr spy's window. Simulate that interleaving so the assertion
      // is proven robust to shadowing — the chat-spawn line must be located among ALL
      // writes, never assumed to be the first.
      process.stderr.write(
        'rate-limits-watch read error: Failed to read file at /home/x/.dungeonmaster/rate-limits.json\n',
      );

      await chatSpawnBroker({
        role,
        guildId,
        message: 'Help me build auth',
        onEntries: jest.fn(),
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

      const linkFailurePattern =
        /^\[chat-spawn\] session-id quest link failed:.*modify exploded\n$/u;
      const linkFailureWrites = stderrSpy.callsMatching([linkFailurePattern]);

      expect(linkFailureWrites.at(-1)?.[0]).toMatch(linkFailurePattern);
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
        onEntries: jest.fn(),
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
        onEntries: jest.fn(),
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
        onEntries: jest.fn(),
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
        onEntries: jest.fn(),
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
        onEntries: jest.fn(),
        onComplete: jest.fn(),
        registerProcess,
      });

      expect(registerProcess).toHaveBeenCalledTimes(1);

      const [[registerArg]] = registerProcess.mock.calls;

      expect(registerArg).toStrictEqual({
        processId: 'design-f47ac10b-58cc-4372-a567-0e02b2c3d479',
        questId: 'design-quest',
        questWorkItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
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
        onEntries: jest.fn(),
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
          onEntries: jest.fn(),
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
          onEntries: jest.fn(),
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
          onEntries: jest.fn(),
          onComplete: jest.fn(),
          registerProcess: jest.fn(),
        }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });

  // The old 'onAgentDetected via agent-detected output' describe block was removed when
  // chat-spawn-broker delegated sub-agent dispatch into chatStreamProcessHandleBroker.
  // Equivalent coverage now lives in
  // brokers/chat/stream-process-handle/chat-stream-process-handle-broker.test.ts.

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
        onEntries: jest.fn(),
        onComplete: jest.fn(),
        registerProcess: jest.fn(),
      });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      const traceCalls = stderrSpy.callsMatching([/\[SUBAGENT-TRACE\]/u]);

      expect(traceCalls).toStrictEqual([]);
    });
  });

  describe('cwd resolution', () => {
    it('VALID: {quest records a worktreePath} => the chat child is launched with that worktree path as cwd', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const sessionId = SessionIdStub({ value: 'resume-with-worktree' });
      const questId = QuestIdStub({ value: 'quest-with-worktree' });
      const worktreePath = AbsoluteFilePathStub({
        value: '/repo/worktrees/quest-with-worktree',
      });

      proxy.setupResumeWithWorktree({ questId, sessionId, worktreePath });

      await chatSpawnBroker({
        role,
        guildId,
        questId,
        sessionId,
        message: 'Continue working',
        onEntries: jest.fn(),
        onComplete: jest.fn(),
        registerProcess: jest.fn(),
      });

      expect(proxy.getSpawnedCwd()).toBe(worktreePath);
    });

    it('VALID: {quest records no worktreePath} => the chat child is launched with the resolved repo root as cwd', async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const sessionId = SessionIdStub({ value: 'resume-no-worktree' });
      const questId = QuestIdStub({ value: 'quest-no-worktree' });
      const resolvedRepoRoot = RepoRootCwdStub({ value: '/home/user/repo-root' });

      proxy.setupResumeWithRepoRoot({ questId, sessionId, repoRoot: resolvedRepoRoot });

      await chatSpawnBroker({
        role,
        guildId,
        questId,
        sessionId,
        message: 'Continue working',
        onEntries: jest.fn(),
        onComplete: jest.fn(),
        registerProcess: jest.fn(),
      });

      expect(proxy.getSpawnedCwd()).toBe(resolvedRepoRoot);
    });

    it("ERROR: {quest's recorded worktree is missing} => rejects with a message naming the absolute path, and no child is launched", async () => {
      const proxy = chatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const sessionId = SessionIdStub({ value: 'resume-missing-worktree' });
      const questId = QuestIdStub({ value: 'quest-missing-worktree' });
      const worktreePath = AbsoluteFilePathStub({
        value: '/repo/worktrees/quest-missing-worktree',
      });

      proxy.setupResumeWithMissingWorktree({ questId, sessionId, worktreePath });

      await expect(
        chatSpawnBroker({
          role,
          guildId,
          questId,
          sessionId,
          message: 'Continue working',
          onEntries: jest.fn(),
          onComplete: jest.fn(),
          registerProcess: jest.fn(),
        }),
      ).rejects.toThrow(/\/repo\/worktrees\/quest-missing-worktree/u);

      expect(proxy.getSpawnedCwd()).toBe(undefined);
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
        onEntries: jest.fn(),
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
