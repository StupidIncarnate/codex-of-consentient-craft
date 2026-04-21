import { screen } from '@testing-library/react';

import {
  AssistantTextChatEntryStub,
  AssistantThinkingChatEntryStub,
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
  TaskToolUseChatEntryStub,
} from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ExecutionRoleStub } from '../../contracts/execution-role/execution-role.stub';
import { ChatEntryListWidget } from './chat-entry-list-widget';
import { ChatEntryListWidgetProxy } from './chat-entry-list-widget.proxy';

describe('ChatEntryListWidget', () => {
  describe('chat variant (default flags)', () => {
    it('VALID: {assistant text + tool pair} => renders message and tool group header', () => {
      ChatEntryListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget
            entries={[
              AssistantTextChatEntryStub({ content: 'Hello' }),
              AssistantToolUseChatEntryStub({ toolUseId: 'use_1' }),
              AssistantToolResultChatEntryStub({ toolName: 'use_1' }),
            ]}
            isStreaming={false}
          />
        ),
      });

      const messages = screen.queryAllByTestId('CHAT_MESSAGE').map((m) => m.textContent);
      const toolGroupIds = screen
        .queryAllByTestId('TOOL_GROUP_HEADER')
        .map((h) => h.getAttribute('data-testid'));

      expect(messages.length).toBeGreaterThan(0);
      expect(toolGroupIds).toStrictEqual(['TOOL_GROUP_HEADER']);
    });

    it('VALID: {subagent task tool_use} => renders subagent chain header', () => {
      ChatEntryListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget
            entries={[
              TaskToolUseChatEntryStub({ agentId: 'agent-xyz' }),
              AssistantTextChatEntryStub({
                content: 'sub working',
                source: 'subagent',
                agentId: 'agent-xyz',
              }),
            ]}
            isStreaming={false}
          />
        ),
      });

      expect(screen.getByTestId('SUBAGENT_CHAIN_HEADER')).toBeInTheDocument();
    });

    it('EMPTY: {no entries, not streaming} => renders nothing', () => {
      ChatEntryListWidgetProxy();

      mantineRenderAdapter({
        ui: <ChatEntryListWidget entries={[]} isStreaming={false} />,
      });

      expect(screen.queryByTestId('STREAMING_INDICATOR')).toBe(null);
      expect(screen.queryByTestId('CHAT_MESSAGE')).toBe(null);
    });
  });

  describe('showEndStreamingIndicator', () => {
    it('VALID: {isStreaming true, flag on} => appends streaming indicator at end', () => {
      ChatEntryListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget
            entries={[AssistantTextChatEntryStub({ content: 'hi' })]}
            isStreaming={true}
            showEndStreamingIndicator={true}
          />
        ),
      });

      expect(screen.getByTestId('STREAMING_INDICATOR')).toBeInTheDocument();
    });

    it('VALID: {isStreaming false, flag on} => no streaming indicator', () => {
      ChatEntryListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget
            entries={[AssistantTextChatEntryStub({ content: 'hi' })]}
            isStreaming={false}
            showEndStreamingIndicator={true}
          />
        ),
      });

      expect(screen.queryByTestId('STREAMING_INDICATOR')).toBe(null);
    });

    it('VALID: {isStreaming true, flag off} => no streaming indicator', () => {
      ChatEntryListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget
            entries={[AssistantTextChatEntryStub({ content: 'hi' })]}
            isStreaming={true}
          />
        ),
      });

      expect(screen.queryByTestId('STREAMING_INDICATOR')).toBe(null);
    });
  });

  describe('showContextDividers', () => {
    it('VALID: {entry with usage, flag on} => renders context divider after the message', () => {
      ChatEntryListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget
            entries={[
              AssistantTextChatEntryStub({
                content: 'Working',
                usage: {
                  inputTokens: 500,
                  outputTokens: 50,
                  cacheCreationInputTokens: 5000,
                  cacheReadInputTokens: 0,
                },
              }),
            ]}
            isStreaming={false}
            showContextDividers={true}
          />
        ),
      });

      expect(screen.getByTestId('CONTEXT_DIVIDER')).toBeInTheDocument();
    });

    it('VALID: {entry with usage, flag off} => does not render context divider', () => {
      ChatEntryListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget
            entries={[
              AssistantTextChatEntryStub({
                content: 'Working',
                usage: {
                  inputTokens: 500,
                  outputTokens: 50,
                  cacheCreationInputTokens: 5000,
                  cacheReadInputTokens: 0,
                },
              }),
            ]}
            isStreaming={false}
          />
        ),
      });

      expect(screen.queryByTestId('CONTEXT_DIVIDER')).toBe(null);
    });
  });

  describe('swapTrailingEmptyThinkingForIndicator', () => {
    it('VALID: {multiple thinking entries} => all thinking contents render', () => {
      ChatEntryListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget
            entries={[
              AssistantThinkingChatEntryStub({ content: 'first thought' }),
              AssistantThinkingChatEntryStub({ content: 'second thought' }),
              AssistantThinkingChatEntryStub({ content: 'final thought' }),
            ]}
            isStreaming={false}
            swapTrailingEmptyThinkingForIndicator={true}
          />
        ),
      });

      const contents = screen.queryAllByTestId('THINKING_ROW_CONTENT').map((c) => c.textContent);

      expect(contents).toStrictEqual(['first thought', 'second thought', 'final thought']);
    });

    it('VALID: {multiple tool groups separated by text} => all tool groups render', () => {
      ChatEntryListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget
            entries={[
              AssistantToolUseChatEntryStub({ toolUseId: 'use_1', toolName: 'Read' }),
              AssistantToolResultChatEntryStub({ toolName: 'use_1' }),
              AssistantTextChatEntryStub({ content: 'divider text' }),
              AssistantToolUseChatEntryStub({ toolUseId: 'use_2', toolName: 'Grep' }),
              AssistantToolResultChatEntryStub({ toolName: 'use_2' }),
            ]}
            isStreaming={false}
            swapTrailingEmptyThinkingForIndicator={true}
          />
        ),
      });

      const toolGroupIds = screen
        .queryAllByTestId('TOOL_GROUP_HEADER')
        .map((h) => h.getAttribute('data-testid'));

      expect(toolGroupIds).toStrictEqual(['TOOL_GROUP_HEADER', 'TOOL_GROUP_HEADER']);
    });

    it('VALID: {interleaved thinking + tool groups + text} => all sections render in order', () => {
      ChatEntryListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget
            entries={[
              AssistantThinkingChatEntryStub({ content: 'thinking a' }),
              AssistantToolUseChatEntryStub({ toolUseId: 'use_1', toolName: 'Read' }),
              AssistantToolResultChatEntryStub({ toolName: 'use_1' }),
              AssistantTextChatEntryStub({ content: 'between a' }),
              AssistantToolUseChatEntryStub({ toolUseId: 'use_2', toolName: 'Grep' }),
              AssistantToolResultChatEntryStub({ toolName: 'use_2' }),
              AssistantThinkingChatEntryStub({ content: 'thinking b' }),
              AssistantToolUseChatEntryStub({ toolUseId: 'use_3', toolName: 'Bash' }),
              AssistantToolResultChatEntryStub({ toolName: 'use_3' }),
              AssistantTextChatEntryStub({ content: 'between b' }),
            ]}
            isStreaming={false}
            swapTrailingEmptyThinkingForIndicator={true}
          />
        ),
      });

      const thinkingContents = screen
        .queryAllByTestId('THINKING_ROW_CONTENT')
        .map((c) => c.textContent);
      const toolGroupIds = screen
        .queryAllByTestId('TOOL_GROUP_HEADER')
        .map((h) => h.getAttribute('data-testid'));

      expect(thinkingContents).toStrictEqual(['thinking a', 'thinking b']);
      expect(toolGroupIds).toStrictEqual([
        'TOOL_GROUP_HEADER',
        'TOOL_GROUP_HEADER',
        'TOOL_GROUP_HEADER',
      ]);
    });

    it('EDGE: {single tool group, single thinking} => both render', () => {
      ChatEntryListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget
            entries={[
              AssistantThinkingChatEntryStub({ content: 'only thought' }),
              AssistantToolUseChatEntryStub({ toolUseId: 'use_1', toolName: 'Read' }),
              AssistantToolResultChatEntryStub({ toolName: 'use_1' }),
            ]}
            isStreaming={false}
            swapTrailingEmptyThinkingForIndicator={true}
          />
        ),
      });

      const thinkingContents = screen
        .queryAllByTestId('THINKING_ROW_CONTENT')
        .map((c) => c.textContent);
      const toolGroupIds = screen
        .queryAllByTestId('TOOL_GROUP_HEADER')
        .map((h) => h.getAttribute('data-testid'));

      expect(thinkingContents).toStrictEqual(['only thought']);
      expect(toolGroupIds).toStrictEqual(['TOOL_GROUP_HEADER']);
    });

    it('VALID: {last thinking has empty content} => renders streaming indicator in place of empty thinking row', () => {
      ChatEntryListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget
            entries={[
              AssistantThinkingChatEntryStub({ content: 'earlier' }),
              AssistantThinkingChatEntryStub({ content: '' }),
            ]}
            isStreaming={false}
            swapTrailingEmptyThinkingForIndicator={true}
          />
        ),
      });

      const thinkingContents = screen
        .queryAllByTestId('THINKING_ROW_CONTENT')
        .map((c) => c.textContent);

      expect(thinkingContents).toStrictEqual(['earlier']);
      expect(screen.getByTestId('STREAMING_INDICATOR')).toBeInTheDocument();
    });

    it('VALID: {flag off, multiple thinking} => all thinking rows render', () => {
      ChatEntryListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget
            entries={[
              AssistantThinkingChatEntryStub({ content: 'first' }),
              AssistantThinkingChatEntryStub({ content: 'second' }),
            ]}
            isStreaming={false}
          />
        ),
      });

      const contents = screen.queryAllByTestId('THINKING_ROW_CONTENT').map((c) => c.textContent);

      expect(contents).toStrictEqual(['first', 'second']);
    });
  });

  describe('roleLabel', () => {
    it('VALID: {roleLabel provided} => ChatMessageWidget renders role as label', () => {
      ChatEntryListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget
            entries={[AssistantTextChatEntryStub({ content: 'hi' })]}
            isStreaming={false}
            roleLabel={ExecutionRoleStub({ value: 'pathseeker' })}
          />
        ),
      });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent?.startsWith('PATHSEEKER')).toBe(true);
    });
  });
});
