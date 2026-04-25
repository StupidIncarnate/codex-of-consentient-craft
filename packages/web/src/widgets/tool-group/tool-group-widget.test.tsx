import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import {
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
} from '@dungeonmaster/shared/contracts';
import { ContextTokenDeltaStub } from '../../contracts/context-token-delta/context-token-delta.stub';
import { ToolGroupStub } from '../../contracts/chat-entry-group/chat-entry-group.stub';
import { ToolGroupWidget } from './tool-group-widget';
import { ToolGroupWidgetProxy } from './tool-group-widget.proxy';

describe('ToolGroupWidget', () => {
  describe('default expanded state', () => {
    it('VALID: {group with 2 tool_use, not streaming} => starts expanded showing tool rows', () => {
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
      expect(proxy.hasEntryCount({ count: 2 })).toBe(true);
    });

    it('VALID: {deltaContextTokens: 18000} => header shows positive delta context', () => {
      ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [AssistantToolUseChatEntryStub({ toolUseId: 'use_1' })],
        toolCount: 1,
      });

      mantineRenderAdapter({
        ui: (
          <ToolGroupWidget
            group={group}
            isLastGroup={false}
            isStreaming={false}
            deltaContextTokens={ContextTokenDeltaStub({ value: 18000 })}
          />
        ),
      });

      const header = screen.getByTestId('TOOL_GROUP_HEADER');

      expect(header.textContent).toBe('▾ 1 Tools (+18.0k context)');
    });

    it('VALID: {deltaContextTokens: -5000} => header shows negative delta context', () => {
      ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [AssistantToolUseChatEntryStub({ toolUseId: 'use_1' })],
        toolCount: 1,
      });

      mantineRenderAdapter({
        ui: (
          <ToolGroupWidget
            group={group}
            isLastGroup={false}
            isStreaming={false}
            deltaContextTokens={ContextTokenDeltaStub({ value: -5000 })}
          />
        ),
      });

      const header = screen.getByTestId('TOOL_GROUP_HEADER');

      expect(header.textContent).toBe('▾ 1 Tools (-5.0k context)');
    });

    it('VALID: {deltaContextTokens: undefined} => header omits context badge (first group)', () => {
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

      expect(header.textContent).toBe('▾ 1 Tools');
    });

    it('VALID: {deltaContextTokens: 0} => header omits context badge', () => {
      ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [
          AssistantToolUseChatEntryStub({ toolUseId: 'use_1' }),
          AssistantToolResultChatEntryStub({ toolName: 'use_1' }),
        ],
        toolCount: 1,
      });

      mantineRenderAdapter({
        ui: (
          <ToolGroupWidget
            group={group}
            isLastGroup={false}
            isStreaming={false}
            deltaContextTokens={ContextTokenDeltaStub({ value: 0 })}
          />
        ),
      });

      const header = screen.getByTestId('TOOL_GROUP_HEADER');

      expect(header.textContent).toBe('▾ 1 Tools');
    });
  });

  describe('toggle behavior', () => {
    it('VALID: {default expanded, linked pair} => shows merged entry without click', () => {
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

      expect(proxy.hasEntryCount({ count: 1 })).toBe(true);
      expect(screen.queryByTestId('TOOL_ROW')).toBeInTheDocument();
    });

    it('VALID: {click header once} => collapses entries', async () => {
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

      expect(proxy.hasEntryCount({ count: 0 })).toBe(true);
    });

    it('VALID: {click header twice} => re-expands', async () => {
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

      expect(proxy.hasEntryCount({ count: 1 })).toBe(true);
    });

    it('VALID: {unlinked entries, default expanded} => shows orphan result separately', () => {
      const proxy = ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [AssistantToolUseChatEntryStub(), AssistantToolResultChatEntryStub()],
        toolCount: 1,
      });

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={false} />,
      });

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

    it('VALID: {isLastGroup: false, isStreaming: true} => default expanded shows entry', () => {
      const proxy = ToolGroupWidgetProxy();
      const group = ToolGroupStub({
        entries: [AssistantToolUseChatEntryStub({ toolUseId: 'use_1' })],
        toolCount: 1,
      });

      mantineRenderAdapter({
        ui: <ToolGroupWidget group={group} isLastGroup={false} isStreaming={true} />,
      });

      expect(proxy.hasEntryCount({ count: 1 })).toBe(true);
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
    it('VALID: {default expanded} => shows down-pointing chevron', () => {
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

      expect(header.textContent).toBe('▾ 1 Tools');
    });

    it('VALID: {click to collapse} => shows right-pointing chevron', async () => {
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

      expect(header.textContent).toBe('▸ 1 Tools');
    });
  });

  describe('per-tool result-content estimate badges', () => {
    it('VALID: {linked tool_result with content} => shows estimated badge; no per-tool TOKEN_BADGE', () => {
      ToolGroupWidgetProxy();
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

      const resultBadges = screen.queryAllByTestId('RESULT_TOKEN_BADGE');
      const tokenBadges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(resultBadges.map((b) => b.textContent)).toStrictEqual(['~200 est']);
      expect(tokenBadges).toStrictEqual([]);
    });

    it('VALID: {two tool_use with usage but no result content} => no TOKEN_BADGE on tool rows (per-tool delta is misattribution)', () => {
      ToolGroupWidgetProxy();
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

      const tokenBadges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(tokenBadges).toStrictEqual([]);
    });

    it('VALID: {mixed tool_use and tool_result entries} => only RESULT_TOKEN_BADGE per tool, no TOKEN_BADGE', () => {
      ToolGroupWidgetProxy();
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

      const tokenBadges = screen.queryAllByTestId('TOKEN_BADGE');
      const resultBadges = screen.queryAllByTestId('RESULT_TOKEN_BADGE');

      expect(tokenBadges).toStrictEqual([]);
      expect(resultBadges.map((b) => b.textContent)).toStrictEqual(['~200 est', '~100 est']);
    });
  });
});
