import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import {
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
  TaskNotificationChatEntryStub,
  UserChatEntryStub,
} from '../../contracts/chat-entry/chat-entry.stub';
import { SubagentChainGroupStub } from '../../contracts/chat-entry-group/chat-entry-group.stub';
import { SubagentChainWidget } from './subagent-chain-widget';
import { SubagentChainWidgetProxy } from './subagent-chain-widget.proxy';

describe('SubagentChainWidget', () => {
  describe('collapsed state', () => {
    it('VALID: {collapsed} => shows header with description and entry count', () => {
      const proxy = SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub({
        description: 'Run tests',
        entryCount: 2,
      });

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} isStreaming={false} />,
      });

      expect(proxy.isHeaderVisible()).toBe(true);

      const header = screen.getByTestId('SUBAGENT_CHAIN_HEADER');

      expect(header.textContent).toMatch(/Run tests/u);
      expect(header.textContent).toMatch(/2 entries/u);
    });

    it('VALID: {collapsed} => shows SUB-AGENT badge in header', () => {
      const proxy = SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub();

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} isStreaming={false} />,
      });

      expect(proxy.isBadgeVisible()).toBe(true);
    });

    it('VALID: {collapsed} => shows right-pointing chevron', () => {
      SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub();

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} isStreaming={false} />,
      });

      const header = screen.getByTestId('SUBAGENT_CHAIN_HEADER');

      expect(header.textContent).toMatch(/\u25B8/u);
    });
  });

  describe('expand and collapse', () => {
    it('VALID: {click header} => expands to show inner entries', async () => {
      const proxy = SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub();

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} isStreaming={false} />,
      });

      await proxy.clickHeader();

      expect(screen.queryByTestId('TOOL_GROUP_HEADER')).not.toBeNull();
    });

    it('VALID: {click header twice} => collapses back', async () => {
      const proxy = SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub();

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} isStreaming={false} />,
      });

      await proxy.clickHeader();
      await proxy.clickHeader();

      expect(screen.queryByTestId('TOOL_GROUP_HEADER')).toBeNull();
    });

    it('VALID: {expanded} => shows down-pointing chevron', async () => {
      const proxy = SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub();

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} isStreaming={false} />,
      });

      await proxy.clickHeader();

      const header = screen.getByTestId('SUBAGENT_CHAIN_HEADER');

      expect(header.textContent).toMatch(/\u25BE/u);
    });
  });

  describe('inner groups rendering', () => {
    it('VALID: {expanded with tool-group innerGroup} => renders nested ToolGroupWidget', async () => {
      const proxy = SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub({
        innerGroups: [
          {
            kind: 'tool-group',
            entries: [
              AssistantToolUseChatEntryStub({ source: 'subagent', agentId: 'agent-001' }),
              AssistantToolResultChatEntryStub({ source: 'subagent', agentId: 'agent-001' }),
            ],
            toolCount: 1,
            contextTokens: null,
            source: 'subagent',
          },
        ],
      });

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} isStreaming={false} />,
      });

      await proxy.clickHeader();

      expect(screen.queryAllByTestId('TOOL_GROUP_HEADER')).toHaveLength(1);
    });

    it('VALID: {expanded with single innerGroup} => renders ChatMessageWidget', async () => {
      const proxy = SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub({
        innerGroups: [
          {
            kind: 'single',
            entry: UserChatEntryStub({ source: 'subagent' }),
          },
        ],
      });

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} isStreaming={false} />,
      });

      await proxy.clickHeader();

      expect(screen.queryAllByTestId('CHAT_MESSAGE')).toHaveLength(1);
    });

    it('VALID: {expanded with task notification} => renders notification at bottom', async () => {
      const proxy = SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub({
        taskNotification: TaskNotificationChatEntryStub({
          taskId: 'agent-001',
          status: 'completed',
          summary: 'Tests passed',
        }),
      });

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} isStreaming={false} />,
      });

      await proxy.clickHeader();

      const messages = screen.queryAllByTestId('CHAT_MESSAGE');

      expect(messages.length).toBeGreaterThan(0);
      expect(screen.getByTestId('SUBAGENT_CHAIN_HEADER').textContent).toMatch(/SUB-AGENT/u);
    });

    it('VALID: {expanded without task notification} => does not render extra message at bottom', async () => {
      const proxy = SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub({
        taskNotification: null,
        innerGroups: [
          {
            kind: 'single',
            entry: UserChatEntryStub({ source: 'subagent' }),
          },
        ],
      });

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} isStreaming={false} />,
      });

      await proxy.clickHeader();

      expect(screen.queryAllByTestId('CHAT_MESSAGE')).toHaveLength(1);
    });
  });
});
