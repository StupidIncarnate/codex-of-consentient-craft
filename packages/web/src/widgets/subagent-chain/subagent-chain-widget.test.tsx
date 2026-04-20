import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import {
  AssistantTextChatEntryStub,
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
  TaskNotificationChatEntryStub,
  UserChatEntryStub,
} from '@dungeonmaster/shared/contracts';
import { SubagentChainGroupStub } from '../../contracts/chat-entry-group/chat-entry-group.stub';
import { SubagentChainWidget } from './subagent-chain-widget';
import { SubagentChainWidgetProxy } from './subagent-chain-widget.proxy';

describe('SubagentChainWidget', () => {
  describe('default expanded state', () => {
    it('VALID: {default} => shows header with description and entry count', () => {
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

      const headerText = header.textContent;

      expect(headerText).toBe('\u25BE SUB-AGENT"Run tests" (2 entries)');
    });

    it('VALID: {default} => shows SUB-AGENT badge in header', () => {
      const proxy = SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub();

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} />,
      });

      expect(proxy.isBadgeVisible()).toBe(true);
    });

    it('VALID: {default with contextTokens} => shows token count in header', () => {
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

      expect(header.textContent).toBe('\u25BE SUB-AGENT"Read files" (7 entries, 1.9k context)');
    });

    it('VALID: {default without contextTokens} => shows only entry count', () => {
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

      const headerText = header.textContent;

      expect(headerText).toBe('\u25BE SUB-AGENT"Run tests" (3 entries)');
    });

    it('VALID: {default} => shows down-pointing chevron', () => {
      SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub();

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} />,
      });

      const header = screen.getByTestId('SUBAGENT_CHAIN_HEADER');

      expect(header.textContent).toBe('\u25BE SUB-AGENT"Run tests" (2 entries)');
    });
  });

  describe('collapse and expand', () => {
    it('VALID: {click header} => collapses to hide inner entries', async () => {
      const proxy = SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub();

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} />,
      });

      await proxy.clickHeader();

      expect(screen.queryAllByTestId('CHAT_MESSAGE')).toStrictEqual([]);
    });

    it('VALID: {click header twice} => expands back', async () => {
      const proxy = SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub();

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} />,
      });

      await proxy.clickHeader();
      await proxy.clickHeader();

      expect(screen.queryAllByTestId('CHAT_MESSAGE').length).toBeGreaterThan(0);
    });

    it('VALID: {collapsed} => shows right-pointing chevron', async () => {
      const proxy = SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub();

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} />,
      });

      await proxy.clickHeader();

      const header = screen.getByTestId('SUBAGENT_CHAIN_HEADER');

      expect(header.textContent).toBe('\u25B8 SUB-AGENT"Run tests" (2 entries)');
    });
  });

  describe('inner groups rendering', () => {
    it('VALID: {expanded with tool entries} => renders flat without tool-group collapse', () => {
      SubagentChainWidgetProxy();
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

      expect(screen.queryAllByTestId('TOOL_GROUP_HEADER')).toStrictEqual([]);

      const toolRows = screen.queryAllByTestId('TOOL_ROW');
      const chatMessages = screen.queryAllByTestId('CHAT_MESSAGE');

      expect(toolRows.length + chatMessages.length).toBe(2);
    });

    it('VALID: {expanded with single innerGroup} => renders ChatMessageWidget', () => {
      SubagentChainWidgetProxy();
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

      expect(
        screen.queryAllByTestId('CHAT_MESSAGE').map((m) => m.getAttribute('data-testid')),
      ).toStrictEqual(['CHAT_MESSAGE']);
    });

    it('VALID: {expanded with task notification} => renders notification at bottom', () => {
      SubagentChainWidgetProxy();
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

      const messages = screen.queryAllByTestId('CHAT_MESSAGE');

      expect(messages.length).toBeGreaterThan(0);
      expect(screen.getByTestId('SUBAGENT_CHAIN_HEADER').textContent).toBe(
        '\u25BE SUB-AGENT"Run tests" (2 entries)',
      );
    });

    it('VALID: {expanded without task notification} => does not render extra message at bottom', () => {
      SubagentChainWidgetProxy();
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

      expect(
        screen.queryAllByTestId('CHAT_MESSAGE').map((m) => m.getAttribute('data-testid')),
      ).toStrictEqual(['CHAT_MESSAGE']);
    });
  });

  describe('per-line token badges', () => {
    it('VALID: {first assistant entry with usage} => shows full context as delta badge', () => {
      SubagentChainWidgetProxy();
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

      const badges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(badges.map((b) => b.textContent)).toStrictEqual(['5.0k context']);
    });

    it('VALID: {second assistant entry} => shows delta not absolute', () => {
      SubagentChainWidgetProxy();
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

      const badges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(badges.map((b) => b.textContent)).toStrictEqual(['5.0k context', '1.2k context']);
    });

    it('VALID: {delta zero from same API call} => no badge on second entry', () => {
      SubagentChainWidgetProxy();
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

      const badges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(badges.map((b) => b.getAttribute('data-testid'))).toStrictEqual(['TOKEN_BADGE']);
    });

    it('VALID: {tool result with content} => shows estimated badge', () => {
      SubagentChainWidgetProxy();
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

      const badges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(badges.map((b) => b.textContent)).toStrictEqual(['~200 est']);
    });

    it('VALID: {tool result with large content} => shows abbreviated estimate', () => {
      SubagentChainWidgetProxy();
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

      const badges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(badges.map((b) => b.textContent)).toStrictEqual(['~1.0k est']);
    });

    it('VALID: {user prompt entry} => no badge', () => {
      SubagentChainWidgetProxy();
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

      const badges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(badges).toStrictEqual([]);
    });

    it('VALID: {full chain with mixed entries} => correct delta tracking across entry types', () => {
      SubagentChainWidgetProxy();
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

      const badges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(badges.map((b) => b.textContent)).toStrictEqual([
        '15.5k context',
        '~541 est',
        '~217 est',
        '1.9k context',
      ]);
    });
  });
});
