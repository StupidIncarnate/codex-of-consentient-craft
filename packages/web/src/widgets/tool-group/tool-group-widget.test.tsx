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
          AssistantToolUseChatEntryStub(),
          AssistantToolResultChatEntryStub(),
          AssistantToolUseChatEntryStub({ toolName: 'write_file' }),
          AssistantToolResultChatEntryStub({ toolName: 'write_file' }),
        ],
        toolCount: 2,
      });

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={false} />,
      });

      expect(proxy.isHeaderVisible()).toBe(true);
      expect(proxy.hasMessageCount({ count: 0 })).toBe(true);
    });

    it('VALID: {group with context tokens 25500} => shows formatted tokens in header', () => {
      ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [AssistantToolUseChatEntryStub()],
        toolCount: 1,
        contextTokens: 25500,
      });

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={false} />,
      });

      const header = screen.getByTestId('TOOL_GROUP_HEADER');

      expect(header.textContent).toMatch(/25\.5k/u);
    });
  });

  describe('expanded state', () => {
    it('VALID: {click header} => expands to show all entries', async () => {
      const proxy = ToolGroupWidgetProxy();
      const group = ToolGroupStub();

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={false} />,
      });

      await proxy.clickHeader();

      expect(proxy.hasMessageCount({ count: 2 })).toBe(true);
    });

    it('VALID: {click header twice} => collapses back', async () => {
      const proxy = ToolGroupWidgetProxy();
      const group = ToolGroupStub();

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={false} />,
      });

      await proxy.clickHeader();
      await proxy.clickHeader();

      expect(proxy.hasMessageCount({ count: 0 })).toBe(true);
    });
  });

  describe('streaming last group', () => {
    it('VALID: {isLastGroup: true, isStreaming: true} => shows last entry beneath header', () => {
      const proxy = ToolGroupWidgetProxy();
      const group = ToolGroupStub();

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={true} isStreaming={true} />,
      });

      expect(proxy.hasMessageCount({ count: 1 })).toBe(true);
    });

    it('VALID: {isLastGroup: false, isStreaming: true} => stays collapsed', () => {
      const proxy = ToolGroupWidgetProxy();
      const group = ToolGroupStub();

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={true} />,
      });

      expect(proxy.hasMessageCount({ count: 0 })).toBe(true);
    });
  });

  describe('subagent badge', () => {
    it('VALID: {source: subagent} => shows SUB-AGENT badge', () => {
      const proxy = ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [AssistantToolUseChatEntryStub({ source: 'subagent' })],
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
      const group = ToolGroupStub();

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={false} />,
      });

      expect(proxy.isSubagentBadgeVisible()).toBe(false);
    });
  });

  describe('chevron', () => {
    it('VALID: {collapsed} => shows right-pointing chevron', () => {
      ToolGroupWidgetProxy();
      const group = ToolGroupStub();

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={false} />,
      });

      const header = screen.getByTestId('TOOL_GROUP_HEADER');

      expect(header.textContent).toMatch(/\u25B8/u);
    });

    it('VALID: {expanded} => shows down-pointing chevron', async () => {
      const proxy = ToolGroupWidgetProxy();
      const group = ToolGroupStub();

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={false} />,
      });

      await proxy.clickHeader();

      const header = screen.getByTestId('TOOL_GROUP_HEADER');

      expect(header.textContent).toMatch(/\u25BE/u);
    });
  });

  describe('per-line token badges', () => {
    it('VALID: {tool_use entry with usage} => shows context delta badge', async () => {
      const proxy = ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [
          AssistantToolUseChatEntryStub({
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

      const badges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(badges).toHaveLength(1);
      expect(badges[0]?.textContent).toBe('5.0k context');
    });

    it('VALID: {tool_result entry with content} => shows estimated badge', async () => {
      const proxy = ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [
          AssistantToolResultChatEntryStub({
            content: 'x'.repeat(740),
          }),
        ],
        toolCount: 1,
      });

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={false} />,
      });

      await proxy.clickHeader();

      const badges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(badges).toHaveLength(1);
      expect(badges[0]?.textContent).toBe('~200 est');
    });

    it('VALID: {mixed tool_use and tool_result entries} => correct delta tracking', async () => {
      const proxy = ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [
          AssistantToolUseChatEntryStub({
            usage: {
              inputTokens: 50,
              outputTokens: 20,
              cacheCreationInputTokens: 5000,
              cacheReadInputTokens: 0,
            },
          }),
          AssistantToolResultChatEntryStub({
            content: 'x'.repeat(740),
          }),
          AssistantToolUseChatEntryStub({
            toolName: 'write_file',
            usage: {
              inputTokens: 50,
              outputTokens: 20,
              cacheCreationInputTokens: 5000,
              cacheReadInputTokens: 0,
            },
          }),
          AssistantToolResultChatEntryStub({
            toolName: 'write_file',
            content: 'x'.repeat(370),
          }),
        ],
        toolCount: 2,
      });

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={false} />,
      });

      await proxy.clickHeader();

      const badges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(badges).toHaveLength(3);
      expect(badges[0]?.textContent).toBe('5.0k context');
      expect(badges[1]?.textContent).toBe('~200 est');
      expect(badges[2]?.textContent).toBe('~100 est');
    });

    it('VALID: {tool_use with delta zero} => no badge on second entry', async () => {
      const proxy = ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [
          AssistantToolUseChatEntryStub({
            usage: {
              inputTokens: 50,
              outputTokens: 20,
              cacheCreationInputTokens: 5000,
              cacheReadInputTokens: 0,
            },
          }),
          AssistantToolUseChatEntryStub({
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

      const badges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(badges).toHaveLength(1);
    });
  });
});
