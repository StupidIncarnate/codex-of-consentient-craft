import { fireEvent, screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import {
  AssistantTextChatEntryStub,
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
  SystemErrorChatEntryStub,
  TaskNotificationChatEntryStub,
  UserChatEntryStub,
} from '../../contracts/chat-entry/chat-entry.stub';
import { FormattedTokenLabelStub } from '../../contracts/formatted-token-label/formatted-token-label.stub';
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

    it('VALID: {tokenBadgeLabel present} => renders token badge below content', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub({
        usage: {
          inputTokens: 100,
          outputTokens: 50,
          cacheCreationInputTokens: 0,
          cacheReadInputTokens: 0,
        },
      });
      const tokenBadgeLabel = FormattedTokenLabelStub({ value: '2.1k' });

      mantineRenderAdapter({
        ui: <ChatMessageWidget entry={entry} tokenBadgeLabel={tokenBadgeLabel} />,
      });

      const badge = screen.getByTestId('TOKEN_BADGE');

      expect(badge.textContent).toBe('2.1k context');
      expect(badge.style.fontSize).toBe('10px');

      const message = screen.getByTestId('CHAT_MESSAGE');
      const children = Array.from(message.children);
      const labelIndex = children.findIndex((child) =>
        child.textContent?.includes('CHAOSWHISPERER'),
      );
      const badgeIndex = children.indexOf(badge);

      expect(badgeIndex).toBeGreaterThan(labelIndex + 1);
    });

    it('VALID: {tokenBadgeLabel present, isStreaming true} => does not render token count badge', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub({
        usage: {
          inputTokens: 100,
          outputTokens: 50,
          cacheCreationInputTokens: 0,
          cacheReadInputTokens: 0,
        },
      });
      const tokenBadgeLabel = FormattedTokenLabelStub({ value: '2.1k' });

      mantineRenderAdapter({
        ui: (
          <ChatMessageWidget entry={entry} isStreaming={true} tokenBadgeLabel={tokenBadgeLabel} />
        ),
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
    it('VALID: {role: assistant, type: tool_use} => renders TOOL CALL label with formatted fields', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolUseChatEntryStub({
        toolName: 'read_file',
        toolInput: '{"path":"/src"}',
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/TOOL CALL/u);
      expect(message.textContent).toMatch(/path/u);
      expect(message.textContent).toMatch(/\/src/u);
    });

    it('VALID: {role: assistant, type: tool_use} => renders text-dim borders', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolUseChatEntryStub();

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.style.borderLeft).toBe('2px solid rgb(138, 114, 96)');
      expect(message.style.borderRight).toBe('2px solid rgb(138, 114, 96)');
    });

    it('VALID: {role: assistant, type: tool_use} => renders formatted fields with italic style', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolUseChatEntryStub();

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');
      const fieldContainer = message.children[1] as HTMLElement;
      const fieldElement = fieldContainer.children[0] as HTMLElement;

      expect(fieldElement.style.fontStyle).toBe('italic');
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

  describe('sub-agent user message', () => {
    it('VALID: {role: user, source: subagent} => renders SUB-AGENT PROMPT label', () => {
      ChatMessageWidgetProxy();
      const entry = UserChatEntryStub({ content: 'Do this subtask', source: 'subagent' });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/SUB-AGENT PROMPT/u);
      expect(message.textContent).toMatch(/Do this subtask/u);
      expect(message.textContent).not.toMatch(/^YOU/u);
    });

    it('VALID: {role: user, source: subagent} => renders loot-rare borders', () => {
      ChatMessageWidgetProxy();
      const entry = UserChatEntryStub({ source: 'subagent' });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.style.borderLeft).toBe('2px solid rgb(232, 121, 249)');
      expect(message.style.borderRight).toBe('2px solid rgb(232, 121, 249)');
    });
  });

  describe('sub-agent text message', () => {
    it('VALID: {role: assistant, type: text, source: subagent} => renders SUB-AGENT label', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub({
        content: 'Sub-agent response',
        source: 'subagent',
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/SUB-AGENT/u);
      expect(message.textContent).not.toMatch(/CHAOSWHISPERER/u);
      expect(message.textContent).toMatch(/Sub-agent response/u);
    });

    it('VALID: {role: assistant, type: text, source: subagent} => renders loot-rare borders', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub({ source: 'subagent' });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.style.borderLeft).toBe('2px solid rgb(232, 121, 249)');
      expect(message.style.borderRight).toBe('2px solid rgb(232, 121, 249)');
    });
  });

  describe('sub-agent tool use message', () => {
    it('VALID: {role: assistant, type: tool_use, source: subagent} => renders SUB-AGENT TOOL label', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolUseChatEntryStub({
        toolName: 'read_file',
        toolInput: '{"path":"/src"}',
        source: 'subagent',
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/SUB-AGENT TOOL/u);
    });

    it('VALID: {role: assistant, type: tool_use, source: subagent} => renders loot-rare borders at 50% opacity', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolUseChatEntryStub({ source: 'subagent' });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.style.borderLeft).toBe('2px solid rgba(232, 121, 249, 0.5)');
      expect(message.style.borderRight).toBe('2px solid rgba(232, 121, 249, 0.5)');
    });
  });

  describe('hook blocked message', () => {
    it('VALID: {tool_result, isError, PreToolUse prefix} => renders HOOK BLOCKED label', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolResultChatEntryStub({
        content: 'PreToolUse: blocked by policy',
        isError: true,
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/HOOK BLOCKED/u);
    });

    it('VALID: {tool_result, isError, PreToolUse prefix} => renders danger borders', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolResultChatEntryStub({
        content: 'PreToolUse: not allowed',
        isError: true,
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.style.borderLeft).toBe('2px solid rgb(239, 68, 68)');
      expect(message.style.borderRight).toBe('2px solid rgb(239, 68, 68)');
    });

    it('VALID: {tool_result, isError, PostToolUse prefix} => renders HOOK BLOCKED label', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolResultChatEntryStub({
        content: 'PostToolUse: rejected',
        isError: true,
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/HOOK BLOCKED/u);
    });
  });

  describe('tool error message', () => {
    it('VALID: {tool_result, isError: true} => renders TOOL ERROR label', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolResultChatEntryStub({
        content: 'Command failed with exit code 1',
        isError: true,
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/TOOL ERROR/u);
      expect(message.textContent).not.toMatch(/HOOK BLOCKED/u);
    });

    it('VALID: {tool_result, isError: true} => renders danger borders', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolResultChatEntryStub({
        content: 'Command failed',
        isError: true,
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.style.borderLeft).toBe('2px solid rgb(239, 68, 68)');
      expect(message.style.borderRight).toBe('2px solid rgb(239, 68, 68)');
    });
  });

  describe('sibling errored message', () => {
    it('VALID: {tool_result, content includes sibling errored} => renders SKIPPED label', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolResultChatEntryStub({
        content: 'Sibling tool call errored',
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/SKIPPED/u);
    });

    it('VALID: {tool_result, content includes sibling errored} => renders warning borders', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolResultChatEntryStub({
        content: 'Sibling tool call errored',
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.style.borderLeft).toBe('2px solid rgb(245, 158, 11)');
      expect(message.style.borderRight).toBe('2px solid rgb(245, 158, 11)');
    });
  });

  describe('task notification message', () => {
    it('VALID: {role: system, type: task_notification} => renders TASK REPORT label', () => {
      ChatMessageWidgetProxy();
      const entry = TaskNotificationChatEntryStub({
        status: 'completed',
        summary: 'Agent finished work',
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/TASK REPORT/u);
      expect(message.textContent).toMatch(/completed/u);
      expect(message.textContent).toMatch(/Agent finished work/u);
    });

    it('VALID: {role: system, type: task_notification} => renders loot-rare borders', () => {
      ChatMessageWidgetProxy();
      const entry = TaskNotificationChatEntryStub();

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.style.borderLeft).toBe('2px solid rgb(232, 121, 249)');
      expect(message.style.borderRight).toBe('2px solid rgb(232, 121, 249)');
    });

    it('VALID: {task_notification with stats} => renders tool calls and duration', () => {
      ChatMessageWidgetProxy();
      const entry = TaskNotificationChatEntryStub({
        toolUses: 5,
        durationMs: 12000,
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/5 tool calls/u);
      expect(message.textContent).toMatch(/12\.0s/u);
    });

    it('VALID: {task_notification without summary} => renders taskId as fallback', () => {
      ChatMessageWidgetProxy();
      const entry = TaskNotificationChatEntryStub({ summary: undefined });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/task-001/u);
    });
  });

  describe('skill invocation message', () => {
    it('VALID: {tool_use, toolName: Skill} => renders SKILL label with loot-gold borders', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolUseChatEntryStub({
        toolName: 'Skill',
        toolInput: '{"skill":"commit","args":""}',
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/SKILL/u);
      expect(message.textContent).toMatch(/commit/u);
      expect(message.style.borderLeft).toBe('2px solid rgb(251, 191, 36)');
      expect(message.style.borderRight).toBe('2px solid rgb(251, 191, 36)');
    });

    it('VALID: {tool_use, toolName: Skill, isLoading} => renders Running... indicator', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolUseChatEntryStub({
        toolName: 'Skill',
        toolInput: '{"skill":"commit"}',
      });

      mantineRenderAdapter({
        ui: <ChatMessageWidget entry={entry} isLoading={true} />,
      });

      const loading = screen.getByTestId('TOOL_LOADING');

      expect(loading.textContent).toBe('Running...');
    });
  });

  describe('tool result truncation', () => {
    it('VALID: {long tool_result content} => renders Show full result toggle', () => {
      ChatMessageWidgetProxy();
      const longContent = 'x'.repeat(300);
      const entry = AssistantToolResultChatEntryStub({
        content: longContent,
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/Show full result/u);
    });

    it('VALID: {long tool_result content, click Show full result} => expands and shows Collapse', () => {
      ChatMessageWidgetProxy();
      const longContent = 'x'.repeat(300);
      const entry = AssistantToolResultChatEntryStub({
        content: longContent,
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const showButton = screen.getByText('Show full result');

      fireEvent.click(showButton);

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/Collapse/u);
      expect(message.textContent).not.toMatch(/Show full result/u);
    });

    it('VALID: {short tool_result content} => does not render truncation toggle', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolResultChatEntryStub({ content: 'short' });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).not.toMatch(/Show full result/u);
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
