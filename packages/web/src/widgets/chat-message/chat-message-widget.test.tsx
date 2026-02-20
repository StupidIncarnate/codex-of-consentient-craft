import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import {
  AssistantTextChatEntryStub,
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
  SystemErrorChatEntryStub,
  UserChatEntryStub,
} from '../../contracts/chat-entry/chat-entry.stub';
import { ChatMessageWidget } from './chat-message-widget';
import { ChatMessageWidgetProxy } from './chat-message-widget.proxy';

describe('ChatMessageWidget', () => {
  describe('user message', () => {
    it('VALID: {role: user} => renders YOU label and user content', () => {
      ChatMessageWidgetProxy();
      const entry = UserChatEntryStub({ content: 'I need auth' });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/^YOU/u);
      expect(message.textContent).toMatch(/I need auth/u);
      expect(message.style.backgroundColor).toBe('rgb(42, 26, 20)');
    });

    it('VALID: {role: user} => renders loot-gold left and right borders', () => {
      ChatMessageWidgetProxy();
      const entry = UserChatEntryStub();

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.style.borderLeft).toBe('2px solid rgb(251, 191, 36)');
      expect(message.style.borderRight).toBe('2px solid rgb(251, 191, 36)');
    });

    it('VALID: {role: user} => renders with textAlign left', () => {
      ChatMessageWidgetProxy();
      const entry = UserChatEntryStub();

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.style.textAlign).toBe('left');
    });
  });

  describe('assistant text message', () => {
    it('VALID: {role: assistant, type: text} => renders CHAOSWHISPERER label', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub({ content: 'Let me explore' });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/CHAOSWHISPERER/u);
      expect(message.textContent).toMatch(/Let me explore/u);
    });

    it('VALID: {role: assistant, type: text} => renders primary left and right borders', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub();

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.style.borderLeft).toBe('2px solid rgb(255, 107, 53)');
      expect(message.style.borderRight).toBe('2px solid rgb(255, 107, 53)');
      expect(message.style.backgroundColor).toBe('transparent');
    });

    it('VALID: {role: assistant, type: text} => renders with textAlign right', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub();

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.style.textAlign).toBe('right');
    });

    it('VALID: {usage present} => renders token count badge below content', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub({
        usage: {
          inputTokens: 100,
          outputTokens: 50,
          cacheCreationInputTokens: 0,
          cacheReadInputTokens: 0,
        },
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const badge = screen.getByTestId('TOKEN_BADGE');

      expect(badge.textContent).toBe('100 context (50 out)');
      expect(badge.style.fontSize).toBe('10px');

      const message = screen.getByTestId('CHAT_MESSAGE');
      const children = Array.from(message.children);
      const labelIndex = children.findIndex((child) =>
        child.textContent?.includes('CHAOSWHISPERER'),
      );
      const badgeIndex = children.indexOf(badge);

      expect(badgeIndex).toBeGreaterThan(labelIndex + 1);
    });

    it('VALID: {usage present, isStreaming true} => does not render token count badge', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub({
        usage: {
          inputTokens: 100,
          outputTokens: 50,
          cacheCreationInputTokens: 0,
          cacheReadInputTokens: 0,
        },
      });

      mantineRenderAdapter({
        ui: <ChatMessageWidget entry={entry} isStreaming={true} />,
      });

      expect(screen.queryByTestId('TOKEN_BADGE')).toBeNull();
    });

    it('VALID: {no usage} => does not render token count badge', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub();

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      expect(screen.queryByTestId('TOKEN_BADGE')).toBeNull();
    });
  });

  describe('tool use message', () => {
    it('VALID: {role: assistant, type: tool_use} => renders TOOL CALL label with tool name and input', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolUseChatEntryStub({
        toolName: 'read_file',
        toolInput: '{"path":"/src"}',
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/TOOL CALL/u);
      expect(message.textContent).toMatch(/read_file/u);
      expect(message.textContent).toMatch(/\{"path":"\/src"\}/u);
    });

    it('VALID: {role: assistant, type: tool_use} => renders text-dim borders', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolUseChatEntryStub();

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.style.borderLeft).toBe('2px solid rgb(138, 114, 96)');
      expect(message.style.borderRight).toBe('2px solid rgb(138, 114, 96)');
    });

    it('VALID: {role: assistant, type: tool_use} => renders italic text', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolUseChatEntryStub();

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');
      const contentElement = message.children[1] as HTMLElement;

      expect(contentElement.style.fontStyle).toBe('italic');
    });

    it('VALID: {isLoading: true} => renders Running... indicator', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolUseChatEntryStub();

      mantineRenderAdapter({
        ui: <ChatMessageWidget entry={entry} isLoading={true} />,
      });

      const loading = screen.getByTestId('TOOL_LOADING');

      expect(loading.textContent).toBe('Running...');
    });

    it('VALID: {isLoading: false} => does not render Running... indicator', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolUseChatEntryStub();

      mantineRenderAdapter({
        ui: <ChatMessageWidget entry={entry} isLoading={false} />,
      });

      expect(screen.queryByTestId('TOOL_LOADING')).toBeNull();
    });
  });

  describe('tool result message', () => {
    it('VALID: {role: assistant, type: tool_result} => renders TOOL RESULT label with tool name and content', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolResultChatEntryStub({
        toolName: 'read_file',
        content: 'file data here',
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/TOOL RESULT/u);
      expect(message.textContent).toMatch(/read_file/u);
      expect(message.textContent).toMatch(/file data here/u);
    });

    it('VALID: {role: assistant, type: tool_result} => renders text-dim borders', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolResultChatEntryStub();

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.style.borderLeft).toBe('2px solid rgb(138, 114, 96)');
      expect(message.style.borderRight).toBe('2px solid rgb(138, 114, 96)');
    });
  });

  describe('system error message', () => {
    it('VALID: {role: system, type: error} => renders ERROR label with danger color', () => {
      ChatMessageWidgetProxy();
      const entry = SystemErrorChatEntryStub({ content: 'Server failed' });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/ERROR/u);
      expect(message.textContent).toMatch(/Server failed/u);
      expect(message.textContent).not.toMatch(/CHAOSWHISPERER/u);
    });

    it('VALID: {role: system, type: error} => renders danger borders and centered text', () => {
      ChatMessageWidgetProxy();
      const entry = SystemErrorChatEntryStub();

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.style.borderLeft).toBe('2px solid rgb(239, 68, 68)');
      expect(message.style.borderRight).toBe('2px solid rgb(239, 68, 68)');
      expect(message.style.textAlign).toBe('center');
    });
  });
});
