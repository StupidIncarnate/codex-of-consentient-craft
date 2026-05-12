import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
    it('VALID: {assistant text + tool pair} => renders message and flat tool row', () => {
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
      const toolRowIds = screen
        .queryAllByTestId('TOOL_ROW')
        .map((h) => h.getAttribute('data-testid'));

      expect(messages.length).toBeGreaterThan(0);
      expect(toolRowIds).toStrictEqual(['TOOL_ROW']);
      expect(screen.queryByTestId('TOOL_GROUP_HEADER')).toBe(null);
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

    it('VALID: {tool_use with usage, flag on} => renders context divider after the tool row', () => {
      ChatEntryListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget
            entries={[
              AssistantToolUseChatEntryStub({
                toolUseId: 'use_1',
                usage: {
                  inputTokens: 500,
                  outputTokens: 50,
                  cacheCreationInputTokens: 5000,
                  cacheReadInputTokens: 0,
                },
              }),
              AssistantToolResultChatEntryStub({ toolName: 'use_1' }),
            ]}
            isStreaming={false}
            showContextDividers={true}
          />
        ),
      });

      expect(screen.getByTestId('CONTEXT_DIVIDER')).toBeInTheDocument();
      expect(screen.getByTestId('TOOL_ROW')).toBeInTheDocument();
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

    it('VALID: {multiple tool pairs separated by text} => all tool rows render', () => {
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

      const toolRowNames = screen.queryAllByTestId('TOOL_ROW_NAME').map((n) => n.textContent);

      expect(toolRowNames).toStrictEqual(['Read', 'Grep']);
    });

    it('VALID: {interleaved thinking + tool pairs + text} => all sections render in order', () => {
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
      const toolRowNames = screen.queryAllByTestId('TOOL_ROW_NAME').map((n) => n.textContent);

      expect(thinkingContents).toStrictEqual(['thinking a', 'thinking b']);
      expect(toolRowNames).toStrictEqual(['Read', 'Grep', 'Bash']);
    });

    it('EDGE: {single tool pair, single thinking} => both render', () => {
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
      const toolRowNames = screen.queryAllByTestId('TOOL_ROW_NAME').map((n) => n.textContent);

      expect(thinkingContents).toStrictEqual(['only thought']);
      expect(toolRowNames).toStrictEqual(['Read']);
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

  describe('streaming tool_use without result', () => {
    it('VALID: {last entry is unmatched tool_use, isStreaming true} => renders ToolRowWidget with loading state', () => {
      ChatEntryListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget
            entries={[AssistantToolUseChatEntryStub({ toolUseId: 'use_1', toolName: 'Read' })]}
            isStreaming={true}
          />
        ),
      });

      expect(screen.getByTestId('TOOL_LOADING')).toBeInTheDocument();
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

  describe('collapseToTail (execution variant)', () => {
    const FIRST = 'TAIL_FIRST_marker';
    const MIDDLE = 'TAIL_MIDDLE_marker';
    const LAST = 'TAIL_LAST_marker';

    const buildSevenEntryFixture = (): ReturnType<typeof AssistantTextChatEntryStub>[] => [
      AssistantTextChatEntryStub({ content: FIRST }),
      AssistantToolUseChatEntryStub({ toolUseId: 'use_a' }),
      AssistantToolResultChatEntryStub({ toolName: 'use_a' }),
      AssistantTextChatEntryStub({ content: MIDDLE }),
      AssistantToolUseChatEntryStub({ toolUseId: 'use_b' }),
      AssistantToolResultChatEntryStub({ toolName: 'use_b' }),
      AssistantTextChatEntryStub({ content: LAST }),
    ];

    it('VALID: {collapseToTail false (default) with text/tool/text/tool/text} => all 3 text messages render in order, no toggle', () => {
      ChatEntryListWidgetProxy();

      mantineRenderAdapter({
        ui: <ChatEntryListWidget entries={buildSevenEntryFixture()} isStreaming={false} />,
      });

      expect(screen.queryAllByTestId('CHAT_MESSAGE').map((m) => m.textContent)).toStrictEqual([
        `CHAOSWHISPERER${FIRST}`,
        `CHAOSWHISPERER${MIDDLE}`,
        `CHAOSWHISPERER${LAST}`,
      ]);
      expect(screen.queryByTestId('CHAT_LIST_SHOW_EARLIER_TOGGLE')).toBe(null);
    });

    it('VALID: {collapseToTail true with text/tool/text/tool/text} => only LAST text renders + toggle visible', () => {
      ChatEntryListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget
            entries={buildSevenEntryFixture()}
            isStreaming={false}
            collapseToTail={true}
          />
        ),
      });

      expect(screen.queryAllByTestId('CHAT_MESSAGE').map((m) => m.textContent)).toStrictEqual([
        `CHAOSWHISPERER${LAST}`,
      ]);
      expect(
        screen.queryAllByTestId('TOOL_ROW').map((t) => t.getAttribute('data-testid')),
      ).toStrictEqual([]);
      expect(screen.getByTestId('CHAT_LIST_SHOW_EARLIER_TOGGLE')).toBeInTheDocument();
    });

    it('VALID: {collapseToTail true with anchor text + subsequent tool} => last text and tool both visible, earlier text hidden', () => {
      ChatEntryListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget
            entries={[
              AssistantTextChatEntryStub({ content: FIRST }),
              AssistantToolUseChatEntryStub({ toolUseId: 'use_a' }),
              AssistantToolResultChatEntryStub({ toolName: 'use_a' }),
              AssistantTextChatEntryStub({ content: LAST }),
              AssistantToolUseChatEntryStub({ toolUseId: 'use_b', toolName: 'Read' }),
              AssistantToolResultChatEntryStub({ toolName: 'use_b' }),
            ]}
            isStreaming={false}
            collapseToTail={true}
          />
        ),
      });

      expect(screen.queryAllByTestId('CHAT_MESSAGE').map((m) => m.textContent)).toStrictEqual([
        `CHAOSWHISPERER${LAST}`,
      ]);
      expect(
        screen.queryAllByTestId('TOOL_ROW').map((t) => t.getAttribute('data-testid')),
      ).toStrictEqual(['TOOL_ROW']);
      expect(screen.getByTestId('CHAT_LIST_SHOW_EARLIER_TOGGLE')).toBeInTheDocument();
    });

    it('VALID: {collapseToTail true, no message anchor (only tool pairs)} => only last tool-pair renders + toggle', () => {
      ChatEntryListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget
            entries={[
              AssistantToolUseChatEntryStub({ toolUseId: 'use_a', toolName: 'Read' }),
              AssistantToolResultChatEntryStub({ toolName: 'use_a' }),
              AssistantToolUseChatEntryStub({ toolUseId: 'use_b', toolName: 'Bash' }),
              AssistantToolResultChatEntryStub({ toolName: 'use_b' }),
            ]}
            isStreaming={false}
            collapseToTail={true}
          />
        ),
      });

      expect(
        screen.queryAllByTestId('TOOL_ROW').map((t) => t.getAttribute('data-testid')),
      ).toStrictEqual(['TOOL_ROW']);
      expect(screen.queryAllByTestId('CHAT_MESSAGE').map((m) => m.textContent)).toStrictEqual([]);
      expect(screen.getByTestId('CHAT_LIST_SHOW_EARLIER_TOGGLE')).toBeInTheDocument();
    });

    it('VALID: {collapseToTail true, single entry} => no toggle (nothing hidden)', () => {
      ChatEntryListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget
            entries={[AssistantTextChatEntryStub({ content: LAST })]}
            isStreaming={false}
            collapseToTail={true}
          />
        ),
      });

      expect(screen.queryAllByTestId('CHAT_MESSAGE').map((m) => m.textContent)).toStrictEqual([
        `CHAOSWHISPERER${LAST}`,
      ]);
      expect(screen.queryByTestId('CHAT_LIST_SHOW_EARLIER_TOGGLE')).toBe(null);
    });

    it('VALID: {collapseToTail true, click "Show N earlier"} => earlier entries become visible and toggle flips to "Hide"', async () => {
      ChatEntryListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatEntryListWidget
            entries={buildSevenEntryFixture()}
            isStreaming={false}
            collapseToTail={true}
          />
        ),
      });

      // Pre-click: only LAST visible.
      expect(screen.queryAllByTestId('CHAT_MESSAGE').map((m) => m.textContent)).toStrictEqual([
        `CHAOSWHISPERER${LAST}`,
      ]);

      const toggle = screen.getByTestId('CHAT_LIST_SHOW_EARLIER_TOGGLE');
      await userEvent.click(toggle);

      // Post-click: all 3 text messages visible in original order.
      expect(screen.queryAllByTestId('CHAT_MESSAGE').map((m) => m.textContent)).toStrictEqual([
        `CHAOSWHISPERER${FIRST}`,
        `CHAOSWHISPERER${MIDDLE}`,
        `CHAOSWHISPERER${LAST}`,
      ]);
      expect(toggle.textContent).toMatch(/^▾ Hide \d+ earlier entries?$/u);
    });
  });
});
