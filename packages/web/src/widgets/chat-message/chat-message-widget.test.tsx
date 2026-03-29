import { fireEvent, screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import {
  AssistantTextChatEntryStub,
  AssistantThinkingChatEntryStub,
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
  SystemErrorChatEntryStub,
  TaskNotificationChatEntryStub,
  UserChatEntryStub,
} from '../../contracts/chat-entry/chat-entry.stub';
import { ExecutionRoleStub } from '../../contracts/execution-role/execution-role.stub';
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
      const messageStyle = message.style;

      expect(message.textContent).toMatch(/^(?=.*YOU)(?=.*I need auth).*$/u);
      expect(messageStyle.backgroundColor).toBe('rgb(42, 26, 20)');
    });

    it('VALID: {role: user} => renders loot-gold left and right borders', () => {
      ChatMessageWidgetProxy();
      const entry = UserChatEntryStub();

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const messageStyle = screen.getByTestId('CHAT_MESSAGE').style;

      expect([messageStyle.borderLeft, messageStyle.borderRight]).toStrictEqual([
        '2px solid rgb(251, 191, 36)',
        '2px solid rgb(251, 191, 36)',
      ]);
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

      expect(message.textContent).toMatch(/^(?=.*CHAOSWHISPERER)(?=.*Let me explore).*$/u);
    });

    it('VALID: {role: assistant, type: text} => renders primary left and right borders', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub();

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect([
        message.style.borderLeft,

        message.style.borderRight,

        message.style.backgroundColor,
      ]).toStrictEqual([
        '2px solid rgb(255, 107, 53)',

        '2px solid rgb(255, 107, 53)',

        'transparent',
      ]);
    });

    it('VALID: {role: assistant, type: text} => renders with textAlign left and 15% paddingLeft', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub();

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect([message.style.textAlign, message.style.paddingLeft]).toStrictEqual(['left', '15%']);
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
      const tokenBadgeLabel = FormattedTokenLabelStub({ value: '2.1k context' });

      mantineRenderAdapter({
        ui: <ChatMessageWidget entry={entry} tokenBadgeLabel={tokenBadgeLabel} />,
      });

      const badge = screen.getByTestId('TOKEN_BADGE');
      const badgeStyle = badge.style;

      expect(badge.textContent).toBe('2.1k context');
      expect(badgeStyle.fontSize).toBe('10px');

      const message = screen.getByTestId('CHAT_MESSAGE');
      const children = Array.from(message.children);
      const labelIndex = children.findIndex((child) =>
        child.textContent?.includes('CHAOSWHISPERER'),
      );
      const badgeIndex = children.indexOf(badge);

      expect(badgeIndex).toBeGreaterThan(labelIndex + 1);
    });

    it('VALID: {tokenBadgeLabel present, isStreaming true} => renders token count badge during streaming', () => {
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

      expect(badge.textContent).toBe('2.1k');
    });

    it('VALID: {no usage} => does not render token count badge', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub();

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      expect(screen.queryByTestId('TOKEN_BADGE')).toBe(null);
    });
  });

  describe('tool use message', () => {
    it('VALID: {role: assistant, type: tool_use} => renders ToolRowWidget with tool name and params', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolUseChatEntryStub({
        toolName: 'read_file',
        toolInput: '{"path":"/src"}',
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const row = screen.getByTestId('TOOL_ROW');
      const name = screen.getByTestId('TOOL_ROW_NAME');

      expect(row).not.toBe(null);
      expect(name.textContent).toBe('read_file');
    });

    it('VALID: {role: assistant, type: tool_use} => renders text-dim accent border', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolUseChatEntryStub();

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const row = screen.getByTestId('TOOL_ROW');

      expect(row.style.borderLeft).toBe('3px solid rgb(138, 114, 96)');
    });

    it('VALID: {role: assistant, type: tool_use} => renders inline summary with italic style', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolUseChatEntryStub({
        toolName: 'read_file',
        toolInput: '{"path":"/src"}',
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const summary = screen.getByTestId('TOOL_ROW_SUMMARY');

      expect(summary.style.fontStyle).toBe('italic');
    });

    it('VALID: {isLoading: true} => renders loading status icon', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolUseChatEntryStub();

      mantineRenderAdapter({
        ui: <ChatMessageWidget entry={entry} isLoading={true} />,
      });

      const status = screen.getByTestId('TOOL_ROW_STATUS');

      expect(status.textContent).toBe('\u00B7\u00B7\u00B7');
    });

    it('VALID: {isLoading: false} => does not render status icon', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolUseChatEntryStub();

      mantineRenderAdapter({
        ui: <ChatMessageWidget entry={entry} isLoading={false} />,
      });

      expect(screen.queryByTestId('TOOL_ROW_STATUS')).toBe(null);
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

      expect(message.textContent).toMatch(
        /^(?=.*TOOL RESULT)(?=.*read_file)(?=.*file data here).*$/u,
      );
    });

    it('VALID: {role: assistant, type: tool_result} => renders text-dim borders', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolResultChatEntryStub();

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect([message.style.borderLeft, message.style.borderRight]).toStrictEqual([
        '2px solid rgb(138, 114, 96)',

        '2px solid rgb(138, 114, 96)',
      ]);
    });
  });

  describe('sub-agent user message', () => {
    it('VALID: {role: user, source: subagent} => renders SUB-AGENT PROMPT label', () => {
      ChatMessageWidgetProxy();
      const entry = UserChatEntryStub({ content: 'Do this subtask', source: 'subagent' });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/^(?=.*SUB-AGENT PROMPT)(?=.*Do this subtask).*$/u);
    });

    it('VALID: {role: user, source: subagent} => renders loot-rare borders', () => {
      ChatMessageWidgetProxy();
      const entry = UserChatEntryStub({ source: 'subagent' });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect([message.style.borderLeft, message.style.borderRight]).toStrictEqual([
        '2px solid rgb(232, 121, 249)',

        '2px solid rgb(232, 121, 249)',
      ]);
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

      expect(message.textContent).toMatch(
        /^(?=.*SUB-AGENT)(?!.*CHAOSWHISPERER)(?=.*Sub-agent response).*$/u,
      );
    });

    it('VALID: {role: assistant, type: text, source: subagent} => renders loot-rare borders', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub({ source: 'subagent' });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect([message.style.borderLeft, message.style.borderRight]).toStrictEqual([
        '2px solid rgb(232, 121, 249)',

        '2px solid rgb(232, 121, 249)',
      ]);
    });
  });

  describe('sub-agent tool use message', () => {
    it('VALID: {role: assistant, type: tool_use, source: subagent} => renders with subagent accent border', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolUseChatEntryStub({
        toolName: 'read_file',
        toolInput: '{"path":"/src"}',
        source: 'subagent',
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const row = screen.getByTestId('TOOL_ROW');

      expect(row.style.borderLeft).toMatch(/^.*rgba\(232, 121, 249.*$/u);
    });

    it('VALID: {role: assistant, type: tool_use, source: subagent} => renders tool name in ToolRowWidget', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolUseChatEntryStub({
        toolName: 'read_file',
        toolInput: '{"path":"/src"}',
        source: 'subagent',
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const name = screen.getByTestId('TOOL_ROW_NAME');

      expect(name.textContent).toBe('read_file');
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

      expect(message.textContent).toMatch(/^.*HOOK BLOCKED.*$/u);
    });

    it('VALID: {tool_result, isError, PreToolUse prefix} => renders danger borders', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolResultChatEntryStub({
        content: 'PreToolUse: not allowed',
        isError: true,
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect([message.style.borderLeft, message.style.borderRight]).toStrictEqual([
        '2px solid rgb(239, 68, 68)',

        '2px solid rgb(239, 68, 68)',
      ]);
    });

    it('VALID: {tool_result, isError, PostToolUse prefix} => renders HOOK BLOCKED label', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolResultChatEntryStub({
        content: 'PostToolUse: rejected',
        isError: true,
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/^.*HOOK BLOCKED.*$/u);
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

      expect(message.textContent).toMatch(/^(?=.*TOOL ERROR)(?!.*HOOK BLOCKED).*$/u);
    });

    it('VALID: {tool_result, isError: true} => renders danger borders', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolResultChatEntryStub({
        content: 'Command failed',
        isError: true,
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect([message.style.borderLeft, message.style.borderRight]).toStrictEqual([
        '2px solid rgb(239, 68, 68)',

        '2px solid rgb(239, 68, 68)',
      ]);
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

      expect(message.textContent).toMatch(/^.*SKIPPED.*$/u);
    });

    it('VALID: {tool_result, content includes sibling errored} => renders warning borders', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolResultChatEntryStub({
        content: 'Sibling tool call errored',
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect([message.style.borderLeft, message.style.borderRight]).toStrictEqual([
        '2px solid rgb(245, 158, 11)',

        '2px solid rgb(245, 158, 11)',
      ]);
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

      expect(message.textContent).toMatch(
        /^(?=.*TASK REPORT)(?=.*completed)(?=.*Agent finished work).*$/u,
      );
    });

    it('VALID: {role: system, type: task_notification} => renders loot-rare borders', () => {
      ChatMessageWidgetProxy();
      const entry = TaskNotificationChatEntryStub();

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect([message.style.borderLeft, message.style.borderRight]).toStrictEqual([
        '2px solid rgb(232, 121, 249)',

        '2px solid rgb(232, 121, 249)',
      ]);
    });

    it('VALID: {task_notification with stats} => renders tool calls and duration', () => {
      ChatMessageWidgetProxy();
      const entry = TaskNotificationChatEntryStub({
        toolUses: 5,
        durationMs: 12000,
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/^(?=.*5 tool calls)(?=.*12\.0s).*$/u);
    });

    it('VALID: {task_notification without summary} => renders taskId as fallback', () => {
      ChatMessageWidgetProxy();
      const entry = TaskNotificationChatEntryStub({ summary: undefined });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/^.*task-001.*$/u);
    });
  });

  describe('skill invocation message', () => {
    it('VALID: {tool_use, toolName: Skill} => renders "Skill: commit" with gold accent border', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolUseChatEntryStub({
        toolName: 'Skill',
        toolInput: '{"skill":"commit","args":""}',
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const name = screen.getByTestId('TOOL_ROW_NAME');
      const row = screen.getByTestId('TOOL_ROW');

      expect(name.textContent).toBe('Skill: commit');
      expect(row.style.borderLeft).toBe('3px solid rgb(251, 191, 36)');
    });

    it('VALID: {tool_use, toolName: Skill, isLoading} => renders loading status icon', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolUseChatEntryStub({
        toolName: 'Skill',
        toolInput: '{"skill":"commit"}',
      });

      mantineRenderAdapter({
        ui: <ChatMessageWidget entry={entry} isLoading={true} />,
      });

      const status = screen.getByTestId('TOOL_ROW_STATUS');

      expect(status.textContent).toBe('\u00B7\u00B7\u00B7');
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

      expect(message.textContent).toMatch(/^.*Show full result.*$/u);
    });

    it('VALID: {long tool_result content, click Show full result} => expands and shows Collapse', () => {
      ChatMessageWidgetProxy();
      const longContent = 'x'.repeat(300);
      const entry = AssistantToolResultChatEntryStub({
        content: longContent,
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const showButton = screen.getByTestId('CHAT_MESSAGE_TRUNCATION_TOGGLE');

      fireEvent.click(showButton);

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/^(?=.*Collapse)(?!.*Show full result).*$/u);
    });

    it('VALID: {short tool_result content} => does not render truncation toggle', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantToolResultChatEntryStub({ content: 'short' });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).not.toMatch(/^.*Show full result.*$/u);
    });
  });

  describe('system error message', () => {
    it('VALID: {role: system, type: error} => renders ERROR label with danger color', () => {
      ChatMessageWidgetProxy();
      const entry = SystemErrorChatEntryStub({ content: 'Server failed' });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(
        /^(?=.*ERROR)(?=.*Server failed)(?!.*CHAOSWHISPERER).*$/u,
      );
    });

    it('VALID: {role: system, type: error} => renders danger borders and centered text', () => {
      ChatMessageWidgetProxy();
      const entry = SystemErrorChatEntryStub();

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect([
        message.style.borderLeft,

        message.style.borderRight,

        message.style.textAlign,
      ]).toStrictEqual(['2px solid rgb(239, 68, 68)', '2px solid rgb(239, 68, 68)', 'center']);
    });
  });

  describe('thinking block message', () => {
    it('VALID: {role: assistant, type: thinking} => renders ThinkingRowWidget with THINKING label', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantThinkingChatEntryStub({ content: 'Let me think about this' });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const row = screen.getByTestId('THINKING_ROW');
      const label = screen.getByTestId('THINKING_ROW_LABEL');

      expect(row).not.toBe(null);
      expect(label.textContent).toMatch(/^.*THINKING.*$/u);
    });

    it('VALID: {role: assistant, type: thinking, short content} => renders full content', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantThinkingChatEntryStub({ content: 'Short thought' });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const content = screen.getByTestId('THINKING_ROW_CONTENT');

      expect(content.textContent).toBe('Short thought');
    });

    it('VALID: {role: assistant, type: thinking, long content} => renders all content without truncation', () => {
      ChatMessageWidgetProxy();
      const longContent = 'x'.repeat(300);
      const entry = AssistantThinkingChatEntryStub({ content: longContent });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const content = screen.getByTestId('THINKING_ROW_CONTENT');

      expect(content.textContent).toBe(longContent);
    });

    it('VALID: {role: assistant, type: thinking} => renders text-dim accent border', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantThinkingChatEntryStub();

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const row = screen.getByTestId('THINKING_ROW');

      expect(row.style.borderLeft).toBe('3px solid rgb(138, 114, 96)');
    });

    it('VALID: {role: assistant, type: thinking, model present} => renders model name', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantThinkingChatEntryStub({ model: 'claude-opus-4-6' });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const label = screen.getByTestId('THINKING_ROW_LABEL');

      expect(label.textContent).toMatch(/^.*claude-opus-4-6.*$/u);
    });
  });

  describe('roleLabel prop', () => {
    it('VALID: {roleLabel: chaoswhisperer} => renders CHAOSWHISPERER label', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub({ content: 'response' });

      mantineRenderAdapter({
        ui: (
          <ChatMessageWidget
            entry={entry}
            roleLabel={ExecutionRoleStub({ value: 'chaoswhisperer' })}
          />
        ),
      });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/^CHAOSWHISPERERresponse$/u);
    });

    it('VALID: {roleLabel: glyphsmith} => renders GLYPHSMITH label', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub({ content: 'response' });

      mantineRenderAdapter({
        ui: (
          <ChatMessageWidget entry={entry} roleLabel={ExecutionRoleStub({ value: 'glyphsmith' })} />
        ),
      });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/^GLYPHSMITHresponse$/u);
    });

    it('VALID: {roleLabel: pathseeker} => renders PATHSEEKER label', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub({ content: 'response' });

      mantineRenderAdapter({
        ui: (
          <ChatMessageWidget entry={entry} roleLabel={ExecutionRoleStub({ value: 'pathseeker' })} />
        ),
      });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/^PATHSEEKERresponse$/u);
    });

    it('VALID: {roleLabel: codeweaver} => renders CODEWEAVER label', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub({ content: 'response' });

      mantineRenderAdapter({
        ui: (
          <ChatMessageWidget entry={entry} roleLabel={ExecutionRoleStub({ value: 'codeweaver' })} />
        ),
      });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/^CODEWEAVERresponse$/u);
    });

    it('VALID: {roleLabel: ward} => renders WARD label', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub({ content: 'response' });

      mantineRenderAdapter({
        ui: <ChatMessageWidget entry={entry} roleLabel={ExecutionRoleStub({ value: 'ward' })} />,
      });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/^WARDresponse$/u);
    });

    it('VALID: {roleLabel: spiritmender} => renders SPIRITMENDER label', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub({ content: 'response' });

      mantineRenderAdapter({
        ui: (
          <ChatMessageWidget
            entry={entry}
            roleLabel={ExecutionRoleStub({ value: 'spiritmender' })}
          />
        ),
      });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/^SPIRITMENDERresponse$/u);
    });

    it('VALID: {roleLabel: siegemaster} => renders SIEGEMASTER label', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub({ content: 'response' });

      mantineRenderAdapter({
        ui: (
          <ChatMessageWidget
            entry={entry}
            roleLabel={ExecutionRoleStub({ value: 'siegemaster' })}
          />
        ),
      });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/^SIEGEMASTERresponse$/u);
    });

    it('VALID: {roleLabel: lawbringer} => renders LAWBRINGER label', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub({ content: 'response' });

      mantineRenderAdapter({
        ui: (
          <ChatMessageWidget entry={entry} roleLabel={ExecutionRoleStub({ value: 'lawbringer' })} />
        ),
      });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/^LAWBRINGERresponse$/u);
    });

    it('VALID: {no roleLabel} => defaults to CHAOSWHISPERER', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub({ content: 'response' });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/^CHAOSWHISPERERresponse$/u);
    });

    it('VALID: {roleLabel provided, source: subagent} => renders SUB-AGENT label instead of roleLabel', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub({ content: 'response', source: 'subagent' });

      mantineRenderAdapter({
        ui: <ChatMessageWidget entry={entry} roleLabel={ExecutionRoleStub({ value: 'ward' })} />,
      });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/^(?=.*SUB-AGENT)(?!.*WARD).*$/u);
    });
  });

  describe('model label on assistant text', () => {
    it('VALID: {role: assistant, type: text, model present} => renders model name after label', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub({
        content: 'Hello',
        model: 'claude-sonnet-4-20250514',
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(
        /^(?=.*CHAOSWHISPERER)(?=.*claude-sonnet-4-20250514).*$/u,
      );
    });

    it('VALID: {role: assistant, type: text, no model} => does not render model suffix', () => {
      ChatMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub({ content: 'Hello' });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/^(?=.*CHAOSWHISPERER)(?!.*claude).*$/u);
    });
  });

  describe('injected prompt message', () => {
    it('VALID: {role: user, isInjectedPrompt: true} => renders AGENT PROMPT section', () => {
      ChatMessageWidgetProxy();
      const entry = UserChatEntryStub({
        content: 'You are an agent.\n\n## User Request\n\nFix the bug',
        isInjectedPrompt: true,
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const agentSection = screen.getByTestId('AGENT_PROMPT_SECTION');

      expect(agentSection.textContent).toMatch(/^(?=.*AGENT PROMPT)(?=.*You are an agent\.).*$/u);
    });

    it('VALID: {role: user, isInjectedPrompt: true} => renders extracted user request with YOU label', () => {
      ChatMessageWidgetProxy();
      const entry = UserChatEntryStub({
        content: 'System prompt here\n\n## User Request\n\nDo the thing',
        isInjectedPrompt: true,
      });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/^(?=.*YOU)(?=.*Do the thing).*$/u);
    });

    it('VALID: {role: user, isInjectedPrompt not set} => renders normally with YOU label and full content', () => {
      ChatMessageWidgetProxy();
      const entry = UserChatEntryStub({ content: 'Just a normal message' });

      mantineRenderAdapter({ ui: <ChatMessageWidget entry={entry} /> });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/^(?=.*YOU)(?=.*Just a normal message).*$/u);
      expect(screen.queryByTestId('AGENT_PROMPT_SECTION')).toBe(null);
    });
  });
});
