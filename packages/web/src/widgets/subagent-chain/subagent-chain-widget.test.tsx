import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import {
  AssistantTextChatEntryStub,
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
        ui: <SubagentChainWidget group={group} />,
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
        ui: <SubagentChainWidget group={group} />,
      });

      expect(proxy.isBadgeVisible()).toBe(true);
    });

    it('VALID: {collapsed with contextTokens} => shows token count in header', () => {
      SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub({
        description: 'Read files',
        entryCount: 7,
        contextTokens: 1900,
      });

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} />,
      });

      const header = screen.getByTestId('SUBAGENT_CHAIN_HEADER');

      expect(header.textContent).toMatch(/7 entries, 1\.9k/u);
    });

    it('VALID: {collapsed without contextTokens} => shows only entry count', () => {
      SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub({
        description: 'Run tests',
        entryCount: 3,
        contextTokens: null,
      });

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} />,
      });

      const header = screen.getByTestId('SUBAGENT_CHAIN_HEADER');

      expect(header.textContent).toMatch(/3 entries/u);
      expect(header.textContent).not.toMatch(/,/u);
    });

    it('VALID: {collapsed} => shows right-pointing chevron', () => {
      SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub();

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} />,
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
        ui: <SubagentChainWidget group={group} />,
      });

      await proxy.clickHeader();

      expect(screen.queryAllByTestId('CHAT_MESSAGE').length).toBeGreaterThan(0);
    });

    it('VALID: {click header twice} => collapses back', async () => {
      const proxy = SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub();

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} />,
      });

      await proxy.clickHeader();
      await proxy.clickHeader();

      expect(screen.queryAllByTestId('CHAT_MESSAGE')).toHaveLength(0);
    });

    it('VALID: {expanded} => shows down-pointing chevron', async () => {
      const proxy = SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub();

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} />,
      });

      await proxy.clickHeader();

      const header = screen.getByTestId('SUBAGENT_CHAIN_HEADER');

      expect(header.textContent).toMatch(/\u25BE/u);
    });
  });

  describe('inner groups rendering', () => {
    it('VALID: {expanded with tool entries} => renders flat without tool-group collapse', async () => {
      const proxy = SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub({
        innerGroups: [
          {
            kind: 'single',
            entry: AssistantToolUseChatEntryStub({ source: 'subagent', agentId: 'agent-001' }),
          },
          {
            kind: 'single',
            entry: AssistantToolResultChatEntryStub({ source: 'subagent', agentId: 'agent-001' }),
          },
        ],
      });

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} />,
      });

      await proxy.clickHeader();

      expect(screen.queryAllByTestId('TOOL_GROUP_HEADER')).toHaveLength(0);
      expect(screen.queryAllByTestId('CHAT_MESSAGE')).toHaveLength(2);
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
        ui: <SubagentChainWidget group={group} />,
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
        ui: <SubagentChainWidget group={group} />,
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
        ui: <SubagentChainWidget group={group} />,
      });

      await proxy.clickHeader();

      expect(screen.queryAllByTestId('CHAT_MESSAGE')).toHaveLength(1);
    });
  });

  describe('per-line token badges', () => {
    it('VALID: {first assistant entry with usage} => shows full context as delta badge', async () => {
      const proxy = SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub({
        innerGroups: [
          {
            kind: 'single',
            entry: AssistantTextChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              usage: {
                inputTokens: 50,
                outputTokens: 20,
                cacheCreationInputTokens: 5000,
                cacheReadInputTokens: 0,
              },
            }),
          },
        ],
      });

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} />,
      });

      await proxy.clickHeader();

      const badges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(badges).toHaveLength(1);
      expect(badges[0]?.textContent).toBe('5.0k context');
    });

    it('VALID: {second assistant entry} => shows delta not absolute', async () => {
      const proxy = SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub({
        innerGroups: [
          {
            kind: 'single',
            entry: AssistantTextChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              usage: {
                inputTokens: 50,
                outputTokens: 20,
                cacheCreationInputTokens: 5000,
                cacheReadInputTokens: 0,
              },
            }),
          },
          {
            kind: 'single',
            entry: AssistantTextChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              usage: {
                inputTokens: 1250,
                outputTokens: 30,
                cacheCreationInputTokens: 5000,
                cacheReadInputTokens: 0,
              },
            }),
          },
        ],
      });

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} />,
      });

      await proxy.clickHeader();

      const badges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(badges).toHaveLength(2);
      expect(badges[0]?.textContent).toBe('5.0k context');
      expect(badges[1]?.textContent).toBe('1.2k context');
    });

    it('VALID: {delta zero from same API call} => no badge on second entry', async () => {
      const proxy = SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub({
        innerGroups: [
          {
            kind: 'single',
            entry: AssistantTextChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              usage: {
                inputTokens: 50,
                outputTokens: 20,
                cacheCreationInputTokens: 5000,
                cacheReadInputTokens: 0,
              },
            }),
          },
          {
            kind: 'single',
            entry: AssistantToolUseChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              usage: {
                inputTokens: 50,
                outputTokens: 20,
                cacheCreationInputTokens: 5000,
                cacheReadInputTokens: 0,
              },
            }),
          },
        ],
      });

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} />,
      });

      await proxy.clickHeader();

      const badges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(badges).toHaveLength(1);
    });

    it('VALID: {tool result with content} => shows estimated badge', async () => {
      const proxy = SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub({
        innerGroups: [
          {
            kind: 'single',
            entry: AssistantToolResultChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              content: 'x'.repeat(740),
            }),
          },
        ],
      });

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} />,
      });

      await proxy.clickHeader();

      const badges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(badges).toHaveLength(1);
      expect(badges[0]?.textContent).toBe('~200 est');
    });

    it('VALID: {tool result with large content} => shows abbreviated estimate', async () => {
      const proxy = SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub({
        innerGroups: [
          {
            kind: 'single',
            entry: AssistantToolResultChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              content: 'x'.repeat(3700),
            }),
          },
        ],
      });

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} />,
      });

      await proxy.clickHeader();

      const badges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(badges).toHaveLength(1);
      expect(badges[0]?.textContent).toBe('~1.0k est');
    });

    it('VALID: {user prompt entry} => no badge', async () => {
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
        ui: <SubagentChainWidget group={group} />,
      });

      await proxy.clickHeader();

      const badges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(badges).toHaveLength(0);
    });

    it('VALID: {full chain with mixed entries} => correct delta tracking across entry types', async () => {
      const proxy = SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub({
        innerGroups: [
          {
            kind: 'single',
            entry: UserChatEntryStub({ source: 'subagent', agentId: 'agent-001' }),
          },
          {
            kind: 'single',
            entry: AssistantTextChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              usage: {
                inputTokens: 500,
                outputTokens: 50,
                cacheCreationInputTokens: 15000,
                cacheReadInputTokens: 0,
              },
            }),
          },
          {
            kind: 'single',
            entry: AssistantToolUseChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              usage: {
                inputTokens: 500,
                outputTokens: 50,
                cacheCreationInputTokens: 15000,
                cacheReadInputTokens: 0,
              },
            }),
          },
          {
            kind: 'single',
            entry: AssistantToolResultChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              content: 'x'.repeat(2000),
            }),
          },
          {
            kind: 'single',
            entry: AssistantToolUseChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              usage: {
                inputTokens: 500,
                outputTokens: 50,
                cacheCreationInputTokens: 15000,
                cacheReadInputTokens: 0,
              },
            }),
          },
          {
            kind: 'single',
            entry: AssistantToolResultChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              content: 'x'.repeat(800),
            }),
          },
          {
            kind: 'single',
            entry: AssistantTextChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              usage: {
                inputTokens: 1500,
                outputTokens: 80,
                cacheCreationInputTokens: 15000,
                cacheReadInputTokens: 900,
              },
            }),
          },
        ],
      });

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} />,
      });

      await proxy.clickHeader();

      const badges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(badges).toHaveLength(4);
      expect(badges[0]?.textContent).toBe('15.5k context');
      expect(badges[1]?.textContent).toBe('~541 est');
      expect(badges[2]?.textContent).toBe('~217 est');
      expect(badges[3]?.textContent).toBe('1.9k context');
    });
  });
});
