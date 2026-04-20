import { screen } from '@testing-library/react';

import {
  AssistantTextChatEntryStub,
  AssistantToolUseChatEntryStub,
  TaskNotificationChatEntryStub,
  TaskToolUseChatEntryStub,
  UserChatEntryStub,
} from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ChatEntryListWidget } from './chat-entry-list-widget';
import { ChatEntryListWidgetProxy } from './chat-entry-list-widget.proxy';

describe('ChatEntryListWidget', () => {
  describe('message rendering', () => {
    it('VALID: {entries with user and assistant} => renders all messages', () => {
      const proxy = ChatEntryListWidgetProxy();
      const entries = [
        UserChatEntryStub({ content: 'Hello' }),
        AssistantTextChatEntryStub({ content: 'Hi there' }),
      ];

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget entries={entries} isStreaming={false} showContextDividers={true} />
        ),
      });

      expect(proxy.hasMessageCount({ count: 2 })).toBe(true);
    });

    it('VALID: {entries with tool use} => renders user message and tool group header', () => {
      const proxy = ChatEntryListWidgetProxy();
      const entries = [
        UserChatEntryStub({ content: 'Do something' }),
        AssistantToolUseChatEntryStub({ toolName: 'read_file', toolInput: '{"path":"/src"}' }),
      ];

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget entries={entries} isStreaming={false} showContextDividers={true} />
        ),
      });

      expect(proxy.hasMessageCount({ count: 1 })).toBe(true);
      expect(proxy.hasToolGroupCount({ count: 1 })).toBe(true);
    });

    it('EMPTY: {no entries} => renders nothing', () => {
      const proxy = ChatEntryListWidgetProxy();

      mantineRenderAdapter({
        ui: <ChatEntryListWidget entries={[]} isStreaming={false} showContextDividers={true} />,
      });

      expect(proxy.hasMessageCount({ count: 0 })).toBe(true);
      expect(proxy.hasToolGroupCount({ count: 0 })).toBe(true);
      expect(proxy.isStreamingIndicatorVisible()).toBe(false);
    });
  });

  describe('tool loading indicator', () => {
    it('VALID: {tool_use as last entry, isStreaming true} => shows Running indicator', () => {
      ChatEntryListWidgetProxy();
      const entries = [
        UserChatEntryStub({ content: 'Do something' }),
        AssistantToolUseChatEntryStub({ toolName: 'Read', toolInput: '{"path":"/src"}' }),
      ];

      mantineRenderAdapter({
        ui: <ChatEntryListWidget entries={entries} isStreaming={true} showContextDividers={true} />,
      });

      expect(screen.queryByTestId('TOOL_LOADING')).toBeInTheDocument();
    });

    it('VALID: {multiple parallel tool_use, isStreaming true} => shows Running on last tool group only', () => {
      ChatEntryListWidgetProxy();
      const entries = [
        UserChatEntryStub({ content: 'Do something' }),
        AssistantToolUseChatEntryStub({ toolName: 'Bash', toolInput: '{"command":"ls cli"}' }),
        AssistantToolUseChatEntryStub({
          toolName: 'Bash',
          toolInput: '{"command":"ls standards"}',
        }),
        AssistantToolUseChatEntryStub({ toolName: 'Read', toolInput: '{"file":"index.ts"}' }),
      ];

      mantineRenderAdapter({
        ui: <ChatEntryListWidget entries={entries} isStreaming={true} showContextDividers={true} />,
      });

      const loadingIndicators = screen.queryAllByTestId('TOOL_LOADING');

      expect(loadingIndicators.map((el) => el.getAttribute('data-testid'))).toStrictEqual([
        'TOOL_LOADING',
      ]);
    });

    it('VALID: {previous turn tool_use, new turn streaming} => does not show Running on previous turn tools', () => {
      ChatEntryListWidgetProxy();
      const entries = [
        UserChatEntryStub({ content: 'First question' }),
        AssistantToolUseChatEntryStub({ toolName: 'Bash', toolInput: '{"command":"ls cli"}' }),
        AssistantToolUseChatEntryStub({
          toolName: 'Bash',
          toolInput: '{"command":"ls standards"}',
        }),
        AssistantTextChatEntryStub({ content: 'Here are the results' }),
        UserChatEntryStub({ content: 'Second question' }),
        AssistantToolUseChatEntryStub({ toolName: 'Read', toolInput: '{"file":"index.ts"}' }),
      ];

      mantineRenderAdapter({
        ui: <ChatEntryListWidget entries={entries} isStreaming={true} showContextDividers={true} />,
      });

      const loadingIndicators = screen.queryAllByTestId('TOOL_LOADING');

      expect(loadingIndicators.map((el) => el.getAttribute('data-testid'))).toStrictEqual([
        'TOOL_LOADING',
      ]);
    });

    it('VALID: {tool_use with text response after, isStreaming true} => does not show Running', () => {
      ChatEntryListWidgetProxy();
      const entries = [
        UserChatEntryStub({ content: 'Do something' }),
        AssistantToolUseChatEntryStub({ toolName: 'Bash', toolInput: '{"command":"ls cli"}' }),
        AssistantToolUseChatEntryStub({
          toolName: 'Bash',
          toolInput: '{"command":"ls standards"}',
        }),
        AssistantTextChatEntryStub({ content: 'Here are the results' }),
      ];

      mantineRenderAdapter({
        ui: <ChatEntryListWidget entries={entries} isStreaming={true} showContextDividers={true} />,
      });

      const loadingIndicators = screen.queryAllByTestId('TOOL_LOADING');

      expect(loadingIndicators).toStrictEqual([]);
    });

    it('VALID: {tool_use as last entry, isStreaming false} => does not show Running indicator', () => {
      ChatEntryListWidgetProxy();
      const entries = [
        UserChatEntryStub({ content: 'Do something' }),
        AssistantToolUseChatEntryStub({ toolName: 'Read', toolInput: '{"path":"/src"}' }),
      ];

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget entries={entries} isStreaming={false} showContextDividers={true} />
        ),
      });

      expect(screen.queryByTestId('TOOL_LOADING')).toBe(null);
    });
  });

  describe('streaming indicator', () => {
    it('VALID: {isStreaming: true} => shows STREAMING_INDICATOR', () => {
      const proxy = ChatEntryListWidgetProxy();

      mantineRenderAdapter({
        ui: <ChatEntryListWidget entries={[]} isStreaming={true} showContextDividers={true} />,
      });

      expect(proxy.isStreamingIndicatorVisible()).toBe(true);
    });

    it('VALID: {isStreaming: false} => does not show STREAMING_INDICATOR', () => {
      const proxy = ChatEntryListWidgetProxy();

      mantineRenderAdapter({
        ui: <ChatEntryListWidget entries={[]} isStreaming={false} showContextDividers={true} />,
      });

      expect(proxy.isStreamingIndicatorVisible()).toBe(false);
    });

    it('VALID: {isStreaming true, last entry source subagent} => indicator rendered purple', () => {
      ChatEntryListWidgetProxy();
      const entries = [
        AssistantTextChatEntryStub({
          content: 'sub thinking',
          source: 'subagent',
          agentId: 'agent-001',
        }),
      ];

      mantineRenderAdapter({
        ui: <ChatEntryListWidget entries={entries} isStreaming={true} showContextDividers={true} />,
      });

      const indicator = screen.getByTestId('STREAMING_INDICATOR');

      expect(indicator.style.borderLeft).toBe('3px solid rgb(232, 121, 249)');
    });

    it('VALID: {isStreaming true, last entry main agent} => indicator rendered orange', () => {
      ChatEntryListWidgetProxy();
      const entries = [AssistantTextChatEntryStub({ content: 'main thinking' })];

      mantineRenderAdapter({
        ui: <ChatEntryListWidget entries={entries} isStreaming={true} showContextDividers={true} />,
      });

      const indicator = screen.getByTestId('STREAMING_INDICATOR');

      expect(indicator.style.borderLeft).toBe('3px solid rgb(255, 107, 53)');
    });
  });

  describe('token badge rendering', () => {
    it('VALID: {assistant text entry with usage} => renders TOKEN_BADGE', () => {
      ChatEntryListWidgetProxy();
      const entries = [
        UserChatEntryStub({ content: 'Hello' }),
        AssistantTextChatEntryStub({
          content: 'Hi there',
          usage: {
            inputTokens: 500,
            outputTokens: 50,
            cacheCreationInputTokens: 0,
            cacheReadInputTokens: 0,
          },
        }),
      ];

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget entries={entries} isStreaming={false} showContextDividers={true} />
        ),
      });

      const tokenBadge = screen.queryByTestId('TOKEN_BADGE');

      expect(tokenBadge).toBeInTheDocument();
      expect(tokenBadge?.textContent).toBe('500 context');
    });

    it('VALID: {assistant text with usage, showContextDividers true} => renders context divider', () => {
      const proxy = ChatEntryListWidgetProxy();
      const entries = [
        UserChatEntryStub({ content: 'Hello' }),
        AssistantTextChatEntryStub({
          content: 'Hi there',
          usage: {
            inputTokens: 500,
            outputTokens: 50,
            cacheCreationInputTokens: 0,
            cacheReadInputTokens: 0,
          },
        }),
      ];

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget entries={entries} isStreaming={false} showContextDividers={true} />
        ),
      });

      expect(proxy.hasDividerCount({ count: 1 })).toBe(true);
    });

    it('VALID: {assistant text with usage, showContextDividers false} => does not render divider', () => {
      const proxy = ChatEntryListWidgetProxy();
      const entries = [
        UserChatEntryStub({ content: 'Hello' }),
        AssistantTextChatEntryStub({
          content: 'Hi there',
          usage: {
            inputTokens: 500,
            outputTokens: 50,
            cacheCreationInputTokens: 0,
            cacheReadInputTokens: 0,
          },
        }),
      ];

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget entries={entries} isStreaming={false} showContextDividers={false} />
        ),
      });

      expect(proxy.hasDividerCount({ count: 0 })).toBe(true);
    });

    it('VALID: {entries without usage} => does not render token badge or divider', () => {
      const proxy = ChatEntryListWidgetProxy();
      const entries = [
        UserChatEntryStub({ content: 'Hello' }),
        AssistantTextChatEntryStub({ content: 'Hi there' }),
      ];

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget entries={entries} isStreaming={false} showContextDividers={true} />
        ),
      });

      expect(screen.queryByTestId('TOKEN_BADGE')).toBe(null);
      expect(proxy.hasDividerCount({ count: 0 })).toBe(true);
    });

    it('VALID: {two assistant texts with usage} => renders rolling delta on second badge', () => {
      ChatEntryListWidgetProxy();
      const entries = [
        UserChatEntryStub({ content: 'Hello' }),
        AssistantTextChatEntryStub({
          content: 'First response',
          usage: {
            inputTokens: 500,
            outputTokens: 50,
            cacheCreationInputTokens: 0,
            cacheReadInputTokens: 0,
          },
        }),
        UserChatEntryStub({ content: 'Follow up' }),
        AssistantTextChatEntryStub({
          content: 'Second response',
          usage: {
            inputTokens: 1200,
            outputTokens: 80,
            cacheCreationInputTokens: 0,
            cacheReadInputTokens: 0,
          },
        }),
      ];

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget entries={entries} isStreaming={false} showContextDividers={true} />
        ),
      });

      const badges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(badges.map((b) => b.textContent)).toStrictEqual(['500 context', '700 context']);
    });
  });

  describe('subagent chain rendering', () => {
    it('VALID: {entries forming subagent chain} => renders SubagentChainWidget', () => {
      const proxy = ChatEntryListWidgetProxy();
      const entries = [
        UserChatEntryStub({ content: 'Run my tests' }),
        TaskToolUseChatEntryStub({ agentId: 'agent-001' }),
        AssistantToolUseChatEntryStub({ source: 'subagent', agentId: 'agent-001' }),
        TaskNotificationChatEntryStub({ taskId: 'agent-001', status: 'completed' }),
      ];

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget entries={entries} isStreaming={false} showContextDividers={true} />
        ),
      });

      expect(proxy.hasSubagentChainCount({ count: 1 })).toBe(true);
    });
  });
});
