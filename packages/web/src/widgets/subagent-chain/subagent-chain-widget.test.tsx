import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import {
  AssistantTextChatEntryStub,
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
  TaskNotificationChatEntryStub,
  UserChatEntryStub,
} from '@dungeonmaster/shared/contracts';
import {
  SingleGroupStub,
  SubagentChainGroupStub,
} from '../../contracts/chat-entry-group/chat-entry-group.stub';
import { SubagentChainWidget } from './subagent-chain-widget';
import { SubagentChainWidgetProxy } from './subagent-chain-widget.proxy';

describe('SubagentChainWidget', () => {
  describe('early null return', () => {
    it('VALID: {group.kind is not subagent-chain} => renders null', () => {
      SubagentChainWidgetProxy();
      const group = SingleGroupStub();

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} />,
      });

      expect(screen.queryByTestId('SUBAGENT_CHAIN')).toBe(null);
    });
  });

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

      expect(
        screen.queryAllByTestId('CHAT_MESSAGE').map((m) => m.getAttribute('data-testid')),
      ).toStrictEqual(['CHAT_MESSAGE']);
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
    it('VALID: {expanded with tool entries, show all earlier} => renders flat without tool-group collapse', async () => {
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

      // Tail-window default hides earlier non-message entries; click the toggle to show all.
      await proxy.clickShowEarlier();

      expect(screen.queryAllByTestId('TOOL_GROUP_HEADER')).toStrictEqual([]);

      const toolRows = screen.queryAllByTestId('TOOL_ROW');
      const chatMessages = screen.queryAllByTestId('CHAT_MESSAGE');

      expect(toolRows.length + chatMessages.length).toBe(2);
    });

    it('VALID: {expanded with tool entries, default tail-window} => renders only last entry plus toggle', () => {
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

      const toolRows = screen.queryAllByTestId('TOOL_ROW');
      const chatMessages = screen.queryAllByTestId('CHAT_MESSAGE');

      expect(toolRows.length + chatMessages.length).toBe(1);
      expect(proxy.hasShowEarlierToggle()).toBe(true);
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

      expect(messages.map((m) => m.getAttribute('data-testid'))).toStrictEqual([
        'CHAT_MESSAGE',
        'CHAT_MESSAGE',
      ]);
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

    it('VALID: {expanded with text anchor + 3 tool-pairs, default tail-window} => only anchor + LAST tool visible; Read+Grep absent', () => {
      SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub({
        innerGroups: [
          {
            kind: 'single',
            entry: AssistantTextChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              content: 'ANCHOR_TEXT',
            }),
          },
          {
            kind: 'single',
            entry: AssistantToolUseChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              toolUseId: 'use_a',
              toolName: 'Read',
            }),
          },
          {
            kind: 'single',
            entry: AssistantToolResultChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              toolName: 'use_a',
            }),
          },
          {
            kind: 'single',
            entry: AssistantToolUseChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              toolUseId: 'use_b',
              toolName: 'Grep',
            }),
          },
          {
            kind: 'single',
            entry: AssistantToolResultChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              toolName: 'use_b',
            }),
          },
          {
            kind: 'single',
            entry: AssistantToolUseChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              toolUseId: 'use_c',
              toolName: 'Bash',
            }),
          },
          {
            kind: 'single',
            entry: AssistantToolResultChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              toolName: 'use_c',
            }),
          },
        ],
      });

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} />,
      });

      const messageTexts = screen.queryAllByTestId('CHAT_MESSAGE').map((m) => m.textContent);
      const toolNames = screen.queryAllByTestId('TOOL_ROW_NAME').map((n) => n.textContent);

      expect(messageTexts).toStrictEqual(['SUB-AGENTANCHOR_TEXT']);
      expect(toolNames).toStrictEqual(['Bash']);
      expect(screen.getByTestId('SUBAGENT_CHAIN_SHOW_EARLIER_TOGGLE').textContent).toMatch(
        /^▸ Show 2 earlier entries$/u,
      );
    });

    it('VALID: {expanded with text anchor + 3 tool-pairs, click Show earlier} => all 3 tools visible in order, toggle flips to Hide', async () => {
      const proxy = SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub({
        innerGroups: [
          {
            kind: 'single',
            entry: AssistantTextChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              content: 'ANCHOR_TEXT',
            }),
          },
          {
            kind: 'single',
            entry: AssistantToolUseChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              toolUseId: 'use_a',
              toolName: 'Read',
            }),
          },
          {
            kind: 'single',
            entry: AssistantToolResultChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              toolName: 'use_a',
            }),
          },
          {
            kind: 'single',
            entry: AssistantToolUseChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              toolUseId: 'use_b',
              toolName: 'Grep',
            }),
          },
          {
            kind: 'single',
            entry: AssistantToolResultChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              toolName: 'use_b',
            }),
          },
          {
            kind: 'single',
            entry: AssistantToolUseChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              toolUseId: 'use_c',
              toolName: 'Bash',
            }),
          },
          {
            kind: 'single',
            entry: AssistantToolResultChatEntryStub({
              source: 'subagent',
              agentId: 'agent-001',
              toolName: 'use_c',
            }),
          },
        ],
      });

      mantineRenderAdapter({
        ui: <SubagentChainWidget group={group} />,
      });

      await proxy.clickShowEarlier();

      const toolNames = screen.queryAllByTestId('TOOL_ROW_NAME').map((n) => n.textContent);

      expect(toolNames).toStrictEqual(['Read', 'Grep', 'Bash']);
      expect(screen.getByTestId('SUBAGENT_CHAIN_SHOW_EARLIER_TOGGLE').textContent).toMatch(
        /^▾ Hide 2 earlier entries$/u,
      );
    });
  });

  describe('nested sub-agent chains', () => {
    it('VALID: {parent with SingleGroup + nested SubagentChainGroup description Nested Agent} => single entry renders as CHAT_MESSAGE and nested SUBAGENT_CHAIN_HEADER present with Nested Agent', () => {
      const proxy = SubagentChainWidgetProxy();
      const inner = SubagentChainGroupStub({
        description: 'Nested Agent',
        agentId: 'agent-002',
        innerGroups: [
          {
            kind: 'single',
            entry: AssistantTextChatEntryStub({ source: 'subagent', agentId: 'agent-002' }),
          },
        ],
      });
      const outer = SubagentChainGroupStub({
        description: 'Outer',
        innerGroups: [{ kind: 'single', entry: UserChatEntryStub({ source: 'subagent' }) }, inner],
      });

      mantineRenderAdapter({ ui: <SubagentChainWidget group={outer} /> });

      expect(
        screen.getAllByTestId('SUBAGENT_CHAIN_HEADER').map((h) => h.textContent),
      ).toStrictEqual(['▾ SUB-AGENT"Outer" (2 entries)', '▾ SUB-AGENT"Nested Agent" (2 entries)']);
      expect(
        screen.queryAllByTestId('CHAT_MESSAGE').map((m) => m.getAttribute('data-testid')),
      ).toStrictEqual(['CHAT_MESSAGE', 'CHAT_MESSAGE']);

      // proxy reference retained to satisfy lint (child widget proxies are set up via constructor)
      expect(proxy.hasShowEarlierToggle()).toBe(false);
    });

    it('VALID: {3-level nest outer>mid>inner, all expanded} => exactly 3 SUBAGENT_CHAIN_HEADER elements with distinct descriptions Outer, Mid, Inner', () => {
      SubagentChainWidgetProxy();
      const inner = SubagentChainGroupStub({
        description: 'Inner',
        agentId: 'agent-003',
        innerGroups: [
          {
            kind: 'single',
            entry: UserChatEntryStub({ source: 'subagent', agentId: 'agent-003' }),
          },
        ],
      });
      const mid = SubagentChainGroupStub({
        description: 'Mid',
        agentId: 'agent-002',
        innerGroups: [inner],
      });
      const outer = SubagentChainGroupStub({
        description: 'Outer',
        agentId: 'agent-001',
        innerGroups: [mid],
      });

      mantineRenderAdapter({ ui: <SubagentChainWidget group={outer} /> });

      expect(
        screen.getAllByTestId('SUBAGENT_CHAIN_HEADER').map((h) => h.textContent),
      ).toStrictEqual([
        '▾ SUB-AGENT"Outer" (2 entries)',
        '▾ SUB-AGENT"Mid" (2 entries)',
        '▾ SUB-AGENT"Inner" (2 entries)',
      ]);
    });

    it('VALID: {innerGroups all SingleGroups, no nested chains} => exactly 1 SUBAGENT_CHAIN element and items only CHAT_MESSAGE', () => {
      SubagentChainWidgetProxy();
      const group = SubagentChainGroupStub({
        taskNotification: null,
        innerGroups: [{ kind: 'single', entry: UserChatEntryStub({ source: 'subagent' }) }],
      });

      mantineRenderAdapter({ ui: <SubagentChainWidget group={group} /> });

      expect(
        screen.queryAllByTestId('SUBAGENT_CHAIN').map((c) => c.getAttribute('data-testid')),
      ).toStrictEqual(['SUBAGENT_CHAIN']);
      expect(
        screen.queryAllByTestId('CHAT_MESSAGE').map((m) => m.getAttribute('data-testid')),
      ).toStrictEqual(['CHAT_MESSAGE']);
    });

    it('VALID: {click inner chain header at index 1} => inner collapses while outer stays expanded with its single item visible', async () => {
      const proxy = SubagentChainWidgetProxy();
      const innerChain = SubagentChainGroupStub({
        description: 'Inner Chain',
        agentId: 'agent-002',
        innerGroups: [
          {
            kind: 'single',
            entry: UserChatEntryStub({ source: 'subagent', agentId: 'agent-002' }),
          },
        ],
      });
      const outer = SubagentChainGroupStub({
        description: 'Outer Chain',
        agentId: 'agent-001',
        innerGroups: [
          {
            kind: 'single',
            entry: UserChatEntryStub({ source: 'subagent', agentId: 'agent-001' }),
          },
          innerChain,
        ],
      });

      mantineRenderAdapter({ ui: <SubagentChainWidget group={outer} /> });

      // Both chains start expanded — each has one CHAT_MESSAGE from its single group
      expect(
        screen.queryAllByTestId('CHAT_MESSAGE').map((m) => m.getAttribute('data-testid')),
      ).toStrictEqual(['CHAT_MESSAGE', 'CHAT_MESSAGE']);

      await proxy.clickHeaderAt({ index: 1 });

      // Inner chain collapsed: its CHAT_MESSAGE gone, outer's CHAT_MESSAGE still visible
      expect(
        screen.queryAllByTestId('CHAT_MESSAGE').map((m) => m.getAttribute('data-testid')),
      ).toStrictEqual(['CHAT_MESSAGE']);
      // Both headers still in DOM; inner now shows right-pointing chevron (collapsed)
      expect(
        screen.getAllByTestId('SUBAGENT_CHAIN_HEADER').map((h) => h.textContent),
      ).toStrictEqual([
        '▾ SUB-AGENT"Outer Chain" (2 entries)',
        '▸ SUB-AGENT"Inner Chain" (2 entries)',
      ]);
    });
  });

  describe('per-line token badges', () => {
    it('VALID: {first assistant entry with usage} => no badge (no prev to diff against)', () => {
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

      expect(badges).toStrictEqual([]);
    });

    it('VALID: {second assistant entry} => shows +delta on second only (first has no prev)', () => {
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

      expect(badges.map((b) => b.textContent)).toStrictEqual(['+1.2k context']);
    });

    it('VALID: {delta zero from same API call} => no badge on either entry (first has no prev, second has zero delta)', () => {
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

      expect(badges).toStrictEqual([]);
    });

    it.each([
      { contentLength: 740, expected: '~200 est' },
      { contentLength: 3700, expected: '~1.0k est' },
    ])(
      'VALID: {tool result with $contentLength chars} => shows $expected badge',
      ({ contentLength, expected }) => {
        SubagentChainWidgetProxy();
        const group = SubagentChainGroupStub({
          innerGroups: [
            {
              kind: 'single',
              entry: AssistantToolResultChatEntryStub({
                source: 'subagent',
                agentId: 'agent-001',
                content: 'x'.repeat(contentLength),
              }),
            },
          ],
        });

        mantineRenderAdapter({
          ui: <SubagentChainWidget group={group} />,
        });

        const badges = screen.queryAllByTestId('TOKEN_BADGE');

        expect(badges.map((b) => b.textContent)).toStrictEqual([expected]);
      },
    );

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

    it('VALID: {full chain with mixed entries, show all earlier} => correct delta tracking across entry types', async () => {
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

      // Tail-window default would hide the earlier two tool-pair badges; expand to assert annotations across the full chain.
      await proxy.clickShowEarlier();

      const badges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(badges.map((b) => b.textContent)).toStrictEqual([
        '~541 est',
        '~217 est',
        '+1.9k context',
      ]);
    });
  });
});
