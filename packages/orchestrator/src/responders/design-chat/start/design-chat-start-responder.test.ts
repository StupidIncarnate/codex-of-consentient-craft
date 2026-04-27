import { GuildIdStub, QuestIdStub, QuestStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { DesignChatStartResponderProxy } from './design-chat-start-responder.proxy';

describe('DesignChatStartResponder', () => {
  describe('valid design chat start', () => {
    it('VALID: {guildId + questId + message with explore_design quest} => returns chatProcessId', async () => {
      const proxy = DesignChatStartResponderProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'explore_design' });

      proxy.setupDesignSession({ exitCode: ExitCodeStub({ value: 0 }), quest });

      const result = await proxy.callResponder({
        guildId,
        questId,
        message: 'Create login page prototype',
      });

      expect(result.chatProcessId).toBe('design-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });
  });

  describe('fire-and-forget resilience', () => {
    it('VALID: {questModifyBroker rejects during onComplete work-item update} => logs to stderr, does not throw', async () => {
      const proxy = DesignChatStartResponderProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'explore_design' });

      proxy.setupStderrCapture();
      proxy.setupModifyReject({ error: new Error('network failure') });
      proxy.setupDesignSession({ exitCode: ExitCodeStub({ value: 0 }), quest });

      const result = await proxy.callResponder({
        guildId,
        questId,
        message: 'Create login page prototype',
      });

      expect(result.chatProcessId).toBe('design-f47ac10b-58cc-4372-a567-0e02b2c3d479');

      // Wait for spawn exit (setImmediate chain) + onComplete + fire-and-forget .catch handler
      await new Promise<void>((resolve) => {
        setImmediate(() => {
          setImmediate(() => {
            setTimeout(resolve, 0);
          });
        });
      });

      const stderrOutput = proxy.getStderrWrites();
      const hasDesignChatLog = stderrOutput.some((line) =>
        String(line).includes('[design-chat] work-item update failed'),
      );

      expect(hasDesignChatLog).toBe(true);
    });
  });

  describe('chat-session-started event', () => {
    it('VALID: {new session, sessionId extracted} => emits chat-session-started BEFORE chat-complete', async () => {
      const proxy = DesignChatStartResponderProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'explore_design' });
      const sessionLine = JSON.stringify({ session_id: 'design-session-early' });

      proxy.setupDesignSession({
        exitCode: ExitCodeStub({ value: 0 }),
        quest,
        stdoutLines: [sessionLine],
      });

      const capture = proxy.setupEventCapture();

      await proxy.callResponder({
        guildId,
        questId,
        message: 'Create prototype',
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

      const events = capture.getEmittedEvents();
      const sessionStartedEvents = events.filter((event) => event.type === 'chat-session-started');

      expect(sessionStartedEvents).toStrictEqual([
        {
          type: 'chat-session-started',
          processId: 'design-f47ac10b-58cc-4372-a567-0e02b2c3d479',
          payload: {
            chatProcessId: 'design-f47ac10b-58cc-4372-a567-0e02b2c3d479',
            sessionId: 'design-session-early',
            questId,
            workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          },
        },
      ]);

      const sessionStartedIdx = events.findIndex((event) => event.type === 'chat-session-started');
      const chatCompleteIdx = events.findIndex((event) => event.type === 'chat-complete');

      expect(sessionStartedIdx).toBe(0);
      expect(chatCompleteIdx).toBeGreaterThan(sessionStartedIdx);
    });
  });

  describe('workItemId stamping on per-quest emits', () => {
    it('VALID: {sessionId extracted, content line emitted} => stamps workItemId+questId on quest-session-linked, chat-output, chat-complete', async () => {
      const proxy = DesignChatStartResponderProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'explore_design' });
      const sessionLine = JSON.stringify({ session_id: 'design-session-stamp' });
      const contentLine = JSON.stringify({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'Hello, I can help with that.' }],
        },
      });

      proxy.setupDesignSession({
        exitCode: ExitCodeStub({ value: 0 }),
        quest,
        stdoutLines: [sessionLine, contentLine],
      });

      const capture = proxy.setupEventCapture();

      await proxy.callResponder({
        guildId,
        questId,
        message: 'Create login page prototype',
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

      const events = capture.getEmittedEvents();

      const sessionLinked = events.filter((event) => event.type === 'quest-session-linked');
      const chatOutput = events.filter((event) => event.type === 'chat-output');
      const chatComplete = events.filter((event) => event.type === 'chat-complete');

      expect({
        sessionLinkedCount: sessionLinked.length,
        sessionLinkedWorkItemId: sessionLinked[0]?.payload.workItemId,
        sessionLinkedQuestId: sessionLinked[0]?.payload.questId,
        chatOutputCount: chatOutput.length,
        chatOutputWorkItemId: chatOutput[0]?.payload.workItemId,
        chatOutputQuestId: chatOutput[0]?.payload.questId,
        chatCompleteCount: chatComplete.length,
        chatCompleteWorkItemId: chatComplete[0]?.payload.workItemId,
        chatCompleteQuestId: chatComplete[0]?.payload.questId,
      }).toStrictEqual({
        sessionLinkedCount: 1,
        sessionLinkedWorkItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        sessionLinkedQuestId: questId,
        chatOutputCount: 1,
        chatOutputWorkItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        chatOutputQuestId: questId,
        chatCompleteCount: 1,
        chatCompleteWorkItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        chatCompleteQuestId: questId,
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {quest not found} => throws quest not found error', async () => {
      const proxy = DesignChatStartResponderProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'nonexistent' });

      proxy.setupQuestNotFound();

      await expect(
        proxy.callResponder({ guildId, questId, message: 'Create prototype' }),
      ).rejects.toThrow(/Quest not found/u);
    });

    it('ERROR: {quest in wrong status} => throws design status error', async () => {
      const proxy = DesignChatStartResponderProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'created' });

      proxy.setupInvalidStatus({ quest });

      await expect(
        proxy.callResponder({ guildId, questId, message: 'Create prototype' }),
      ).rejects.toThrow(/Quest must be in a design phase/u);
    });
  });
});
