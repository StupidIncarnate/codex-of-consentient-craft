import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import {
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
} from '../../contracts/chat-entry/chat-entry.stub';
import { ToolGroupStub } from '../../contracts/chat-entry-group/chat-entry-group.stub';
import { ToolGroupWidget } from './tool-group-widget';
import { ToolGroupWidgetProxy } from './tool-group-widget.proxy';

describe('ToolGroupWidget', () => {
  describe('collapsed state', () => {
    it('VALID: {group with 2 tool_use, not streaming} => shows header with tool count', () => {
      const proxy = ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [
          AssistantToolUseChatEntryStub({ toolUseId: 'use_1' }),
          AssistantToolResultChatEntryStub({ toolName: 'use_1' }),
          AssistantToolUseChatEntryStub({ toolUseId: 'use_2', toolName: 'write_file' }),
          AssistantToolResultChatEntryStub({ toolName: 'use_2' }),
        ],
        toolCount: 2,
      });

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={false} />,
      });

      expect(proxy.isHeaderVisible()).toBe(true);
      expect(proxy.hasEntryCount({ count: 0 })).toBe(true);
    });

    it('VALID: {group with context tokens 25500} => shows formatted tokens in header', () => {
      ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [AssistantToolUseChatEntryStub({ toolUseId: 'use_1' })],
        toolCount: 1,
        contextTokens: 25500,
      });

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={false} />,
      });

      const header = screen.getByTestId('TOOL_GROUP_HEADER');

      expect(header.textContent).toBe('\u25B8 1 Tools (25.5k context)');
    });

    it('VALID: {group with null contextTokens} => renders header without context suffix', () => {
      ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [
          AssistantToolUseChatEntryStub({ toolUseId: 'use_1' }),
          AssistantToolResultChatEntryStub({ toolName: 'use_1' }),
        ],
        toolCount: 1,
        contextTokens: null,
      });

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={false} />,
      });

      const header = screen.getByTestId('TOOL_GROUP_HEADER');

      expect(header.textContent).toBe('\u25B8 1 Tools');
    });
  });

  describe('expanded state', () => {
    it('VALID: {click header on linked pair} => expands to show merged entry', async () => {
      const proxy = ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [
          AssistantToolUseChatEntryStub({ toolUseId: 'use_1' }),
          AssistantToolResultChatEntryStub({ toolName: 'use_1' }),
        ],
        toolCount: 1,
      });

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={false} />,
      });

      await proxy.clickHeader();

      expect(proxy.hasEntryCount({ count: 1 })).toBe(true);
      expect(screen.queryByTestId('TOOL_ROW')).toBeInTheDocument();
    });

    it('VALID: {click header twice} => collapses back', async () => {
      const proxy = ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [
          AssistantToolUseChatEntryStub({ toolUseId: 'use_1' }),
          AssistantToolResultChatEntryStub({ toolName: 'use_1' }),
        ],
        toolCount: 1,
      });

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={false} />,
      });

      await proxy.clickHeader();
      await proxy.clickHeader();

      expect(proxy.hasEntryCount({ count: 0 })).toBe(true);
    });

    it('VALID: {unlinked entries} => shows orphan result separately', async () => {
      const proxy = ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [AssistantToolUseChatEntryStub(), AssistantToolResultChatEntryStub()],
        toolCount: 1,
      });

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={false} />,
      });

      await proxy.clickHeader();

      expect(proxy.hasEntryCount({ count: 2 })).toBe(true);
    });
  });

  describe('streaming last group', () => {
    it('VALID: {isLastGroup: true, isStreaming: true, pending result} => shows last entry beneath header', () => {
      const proxy = ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [AssistantToolUseChatEntryStub({ toolUseId: 'use_1' })],
        toolCount: 1,
      });

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={true} isStreaming={true} />,
      });

      expect(proxy.hasEntryCount({ count: 1 })).toBe(true);
    });

    it('VALID: {isLastGroup: true, isStreaming: true, has result} => shows merged entry', () => {
      const proxy = ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [
          AssistantToolUseChatEntryStub({ toolUseId: 'use_1' }),
          AssistantToolResultChatEntryStub({ toolName: 'use_1' }),
        ],
        toolCount: 1,
      });

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={true} isStreaming={true} />,
      });

      expect(proxy.hasEntryCount({ count: 1 })).toBe(true);
      expect(screen.queryByTestId('TOOL_ROW_RESULT')).toBeInTheDocument();
    });

    it('VALID: {isLastGroup: false, isStreaming: true} => stays collapsed', () => {
      const proxy = ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [AssistantToolUseChatEntryStub({ toolUseId: 'use_1' })],
        toolCount: 1,
      });

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={true} />,
      });

      expect(proxy.hasEntryCount({ count: 0 })).toBe(true);
    });
  });

  describe('subagent badge', () => {
    it('VALID: {source: subagent} => shows SUB-AGENT badge', () => {
      const proxy = ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [AssistantToolUseChatEntryStub({ source: 'subagent', toolUseId: 'use_1' })],
        toolCount: 1,
        source: 'subagent',
      });

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={false} />,
      });

      expect(proxy.isSubagentBadgeVisible()).toBe(true);
    });

    it('VALID: {source: session} => does not show SUB-AGENT badge', () => {
      const proxy = ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [
          AssistantToolUseChatEntryStub({ toolUseId: 'use_1' }),
          AssistantToolResultChatEntryStub({ toolName: 'use_1' }),
        ],
        toolCount: 1,
      });

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={false} />,
      });

      expect(proxy.isSubagentBadgeVisible()).toBe(false);
    });
  });

  describe('chevron', () => {
    it('VALID: {collapsed} => shows right-pointing chevron', () => {
      ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [
          AssistantToolUseChatEntryStub({ toolUseId: 'use_1' }),
          AssistantToolResultChatEntryStub({ toolName: 'use_1' }),
        ],
        toolCount: 1,
      });

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={false} />,
      });

      const header = screen.getByTestId('TOOL_GROUP_HEADER');

      expect(header.textContent).toBe('\u25B8 1 Tools');
    });

    it('VALID: {expanded} => shows down-pointing chevron', async () => {
      const proxy = ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [
          AssistantToolUseChatEntryStub({ toolUseId: 'use_1' }),
          AssistantToolResultChatEntryStub({ toolName: 'use_1' }),
        ],
        toolCount: 1,
      });

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={false} />,
      });

      await proxy.clickHeader();

      const header = screen.getByTestId('TOOL_GROUP_HEADER');

      expect(header.textContent).toBe('\u25BE 1 Tools');
    });
  });

  describe('per-line token badges', () => {
    it('VALID: {tool_use entry with usage} => shows context delta badge when row expanded', async () => {
      const proxy = ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [
          AssistantToolUseChatEntryStub({
            toolUseId: 'use_1',
            usage: {
              inputTokens: 50,
              outputTokens: 20,
              cacheCreationInputTokens: 5000,
              cacheReadInputTokens: 0,
            },
          }),
        ],
        toolCount: 1,
      });

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={false} />,
      });

      await proxy.clickHeader();
      await proxy.expandAllToolRows();

      const badges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(badges.map((b) => b.textContent)).toStrictEqual(['5.0k context']);
    });

    it('VALID: {linked tool_result with content} => shows estimated badge when row expanded', async () => {
      const proxy = ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [
          AssistantToolUseChatEntryStub({ toolUseId: 'use_1' }),
          AssistantToolResultChatEntryStub({
            toolName: 'use_1',
            content: 'x'.repeat(740),
          }),
        ],
        toolCount: 1,
      });

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={false} />,
      });

      await proxy.clickHeader();
      await proxy.expandAllToolRows();

      const badges = screen.queryAllByTestId('RESULT_TOKEN_BADGE');

      expect(badges.map((b) => b.textContent)).toStrictEqual(['~200 est']);
    });

    it('VALID: {mixed tool_use and tool_result entries} => correct delta tracking with inline badges', async () => {
      const proxy = ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [
          AssistantToolUseChatEntryStub({
            toolUseId: 'use_1',
            usage: {
              inputTokens: 50,
              outputTokens: 20,
              cacheCreationInputTokens: 5000,
              cacheReadInputTokens: 0,
            },
          }),
          AssistantToolResultChatEntryStub({
            toolName: 'use_1',
            content: 'x'.repeat(740),
          }),
          AssistantToolUseChatEntryStub({
            toolUseId: 'use_2',
            toolName: 'write_file',
            usage: {
              inputTokens: 50,
              outputTokens: 20,
              cacheCreationInputTokens: 5000,
              cacheReadInputTokens: 0,
            },
          }),
          AssistantToolResultChatEntryStub({
            toolName: 'use_2',
            content: 'x'.repeat(370),
          }),
        ],
        toolCount: 2,
      });

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={false} />,
      });

      await proxy.clickHeader();
      await proxy.expandAllToolRows();

      const tokenBadges = screen.queryAllByTestId('TOKEN_BADGE');
      const resultBadges = screen.queryAllByTestId('RESULT_TOKEN_BADGE');

      expect(tokenBadges.map((b) => b.textContent)).toStrictEqual(['5.0k context']);
      expect(resultBadges.map((b) => b.textContent)).toStrictEqual(['~200 est', '~100 est']);
    });

    it('VALID: {tool_use with delta zero} => no badge on second entry', async () => {
      const proxy = ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [
          AssistantToolUseChatEntryStub({
            toolUseId: 'use_1',
            usage: {
              inputTokens: 50,
              outputTokens: 20,
              cacheCreationInputTokens: 5000,
              cacheReadInputTokens: 0,
            },
          }),
          AssistantToolUseChatEntryStub({
            toolUseId: 'use_2',
            toolName: 'write_file',
            usage: {
              inputTokens: 50,
              outputTokens: 20,
              cacheCreationInputTokens: 5000,
              cacheReadInputTokens: 0,
            },
          }),
        ],
        toolCount: 2,
      });

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={false} />,
      });

      await proxy.clickHeader();
      await proxy.expandAllToolRows();

      const badges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(badges.map((b) => b.getAttribute('data-testid'))).toStrictEqual(['TOKEN_BADGE']);
    });
  });
});
