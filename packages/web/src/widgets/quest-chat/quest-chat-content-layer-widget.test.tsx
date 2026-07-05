import { act, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import {
  GuildIdStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QuestChatContentLayerWidget } from './quest-chat-content-layer-widget';
import { QuestChatContentLayerWidgetProxy } from './quest-chat-content-layer-widget.proxy';

describe('QuestChatContentLayerWidget', () => {
  describe('no-questId placeholder surface (claude mode)', () => {
    it('VALID: {claude mode, questId null} => renders the /dumpster-create placeholder banner', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupMode({ mode: 'claude' });
      const guildId = GuildIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });

      const { queryByTestId, findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatContentLayerWidget
              questId={null}
              guildId={guildId}
              guildSlug={'test-guild' as never}
            />
          </MemoryRouter>
        ),
      });

      await findByTestId('QUEST_CHAT_NO_QUEST_PLACEHOLDER');

      expect(queryByTestId('DUMPSTER_COMMAND_BANNER_COMMAND')?.textContent).toBe(
        '/dumpster-create',
      );
    });

    it('VALID: {claude mode, questId null} => does NOT mount the chat panel, divider, or activity column (Create-Quest entry point moved to /dumpster-create)', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupMode({ mode: 'claude' });
      const guildId = GuildIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });

      const { queryByTestId, findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatContentLayerWidget
              questId={null}
              guildId={guildId}
              guildSlug={'test-guild' as never}
            />
          </MemoryRouter>
        ),
      });

      await findByTestId('QUEST_CHAT_NO_QUEST_PLACEHOLDER');

      expect(queryByTestId('CHAT_PANEL')).toBe(null);
      expect(queryByTestId('QUEST_CHAT_DIVIDER')).toBe(null);
      expect(queryByTestId('QUEST_CHAT_ACTIVITY')).toBe(null);
    });
  });

  describe('node mode create-quest surface', () => {
    it('VALID: {node mode, questId null} => renders chat panel + dumpster raccoon column, not the /dumpster-create banner', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupMode({ mode: 'node' });
      const guildId = GuildIdStub({ value: '44444444-5555-6666-7777-888888888888' });

      const { queryByTestId, findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatContentLayerWidget
              questId={null}
              guildId={guildId}
              guildSlug={'test-guild' as never}
            />
          </MemoryRouter>
        ),
      });

      await findByTestId('CHAT_PANEL');

      expect(queryByTestId('QUEST_CHAT_ACTIVITY')?.getAttribute('data-testid')).toBe(
        'QUEST_CHAT_ACTIVITY',
      );
      expect(queryByTestId('dumpster-raccoon-widget')?.getAttribute('data-testid')).toBe(
        'dumpster-raccoon-widget',
      );
      expect(queryByTestId('QUEST_CHAT_NO_QUEST_PLACEHOLDER')).toBe(null);
    });

    it('VALID: {node mode, questId null, first message sent} => POSTs quest-new and renders the typed message', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupMode({ mode: 'node' });
      proxy.setupNewQuest({
        questId: QuestIdStub({ value: 'q-created' }),
        chatProcessId: ProcessIdStub({ value: 'proc-created' }),
      });
      const guildId = GuildIdStub({ value: '55555555-6666-7777-8888-999999999999' });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatContentLayerWidget
              questId={null}
              guildId={guildId}
              guildSlug={'test-guild' as never}
            />
          </MemoryRouter>
        ),
      });

      await screen.findByTestId('CHAT_PANEL');
      await proxy.typeMessage({ text: 'Add auth' });
      await proxy.clickSend();

      await waitFor(() => {
        expect(proxy.getNewQuestRequestCount()).toBe(1);
      });

      const messageTexts = screen
        .queryAllByTestId('CHAT_MESSAGE')
        .map((m) => String(m.textContent));
      const typedIdx = messageTexts.findIndex((t) => t.includes('Add auth'));

      expect(typedIdx).toBe(0);
    });
  });

  describe('live workspace (questId set)', () => {
    it('VALID: {claude mode, no quest yet from binding} => renders new-chat-style awaiting surface', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupMode({ mode: 'claude' });
      const guildId = GuildIdStub({ value: 'cccccccc-dddd-eeee-ffff-aaaaaaaaaaaa' });

      const { queryByTestId, findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatContentLayerWidget
              questId={'q-loading' as never}
              guildId={guildId}
              guildSlug={'test-guild' as never}
            />
          </MemoryRouter>
        ),
      });

      await findByTestId('CHAT_PANEL');

      expect(queryByTestId('QUEST_CHAT_ACTIVITY')?.getAttribute('data-testid')).toBe(
        'QUEST_CHAT_ACTIVITY',
      );
      expect(queryByTestId('CHAT_PANEL')?.getAttribute('data-testid')).toBe('CHAT_PANEL');
    });

    it('VALID: {quest at review_flows} => renders chat panel + spec panel', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupMode({ mode: 'claude' });
      const guildId = GuildIdStub({ value: 'dddddddd-eeee-ffff-aaaa-bbbbbbbbbbbb' });
      const quest = QuestStub({
        id: 'q-pre',
        status: 'review_flows',
      });

      const { queryByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatContentLayerWidget
              questId={'q-pre' as never}
              guildId={guildId}
              guildSlug={'test-guild' as never}
            />
          </MemoryRouter>
        ),
      });

      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'quest-modified',
            payload: { questId: quest.id, quest },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(queryByTestId('CHAT_PANEL')?.getAttribute('data-testid')).toBe('CHAT_PANEL');
      });

      expect(queryByTestId('CHAT_PANEL')?.getAttribute('data-testid')).toBe('CHAT_PANEL');
    });

    it('VALID: {quest at in_progress} => renders execution panel + dumpster raccoon column (no chat-entry feed)', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupMode({ mode: 'claude' });
      const guildId = GuildIdStub({ value: 'eeeeeeee-ffff-aaaa-bbbb-cccccccccccc' });
      const quest = QuestStub({
        id: 'q-exec',
        status: 'in_progress',
      });

      const { queryByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatContentLayerWidget
              questId={'q-exec' as never}
              guildId={guildId}
              guildSlug={'test-guild' as never}
            />
          </MemoryRouter>
        ),
      });

      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'quest-modified',
            payload: { questId: quest.id, quest },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(queryByTestId('execution-panel-widget')?.getAttribute('data-testid')).toBe(
          'execution-panel-widget',
        );
      });

      expect(queryByTestId('QUEST_CHAT_DIVIDER')?.getAttribute('data-testid')).toBe(
        'QUEST_CHAT_DIVIDER',
      );
      expect(queryByTestId('QUEST_CHAT_ACTIVITY')?.getAttribute('data-testid')).toBe(
        'QUEST_CHAT_ACTIVITY',
      );
      // No chat-entry feed inside the right column — only the dumpster raccoon.
      expect(queryByTestId('CHAT_MESSAGE')).toBe(null);
    });

    it('VALID: {clarification-request WS event} => panel renders questions and submit calls clarify broker', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupMode({ mode: 'claude' });
      const guildId = GuildIdStub({ value: 'ffffffff-aaaa-bbbb-cccc-dddddddddddd' });
      const quest = QuestStub({ id: 'q-clarify', status: 'review_flows' });
      const chatProcessId = ProcessIdStub({ value: 'proc-clarify' });
      proxy.setupClarify({ chatProcessId });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatContentLayerWidget
              questId={'q-clarify' as never}
              guildId={guildId}
              guildSlug={'test-guild' as never}
            />
          </MemoryRouter>
        ),
      });

      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'quest-modified',
            payload: { questId: quest.id, quest },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'clarification-request',
            payload: {
              chatProcessId,
              questions: [
                {
                  question: 'Which database do you prefer?',
                  header: 'Database',
                  options: [{ label: 'Postgres', description: 'Relational DB' }],
                  multiSelect: false,
                },
              ],
            },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await findByTestId('QUEST_CLARIFY_PANEL');

      const option = await findByTestId('CLARIFY_OPTION');
      await act(async () => {
        option.click();
        return Promise.resolve();
      });

      expect(proxy.getClarifyRequestCount()).toBe(1);
    });

    it('VALID: {?chat=hidden, quest at review_flows} => CHAT_PANEL not in DOM, binding still subscribed (spec panel renders from WS quest-modified)', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupMode({ mode: 'claude' });
      const guildId = GuildIdStub({ value: '11111111-2222-3333-4444-555555555555' });
      const quest = QuestStub({ id: 'q-hidden', status: 'review_flows' });

      const { queryByTestId, findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/quest/q-hidden?chat=hidden']}>
            <Routes>
              <Route
                path="/test-guild/quest/:questId"
                element={
                  <QuestChatContentLayerWidget
                    questId={'q-hidden' as never}
                    guildId={guildId}
                    guildSlug={'test-guild' as never}
                  />
                }
              />
            </Routes>
          </MemoryRouter>
        ),
      });

      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'quest-modified',
            payload: { questId: quest.id, quest },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      // Binding subscribed and produced the quest: spec panel mounts.
      await findByTestId('QUEST_SPEC_PANEL');

      // Chat panel sub-tree suppressed.
      expect(queryByTestId('CHAT_PANEL')).toBe(null);
    });

    it('VALID: {claude mode, ?chat=hidden, no quest yet (loading)} => CHAT_PANEL not in DOM, awaiting activity column still renders', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupMode({ mode: 'claude' });
      const guildId = GuildIdStub({ value: '22222222-3333-4444-5555-666666666666' });

      const { queryByTestId, findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/quest/q-loading?chat=hidden']}>
            <Routes>
              <Route
                path="/test-guild/quest/:questId"
                element={
                  <QuestChatContentLayerWidget
                    questId={'q-loading' as never}
                    guildId={guildId}
                    guildSlug={'test-guild' as never}
                  />
                }
              />
            </Routes>
          </MemoryRouter>
        ),
      });

      await findByTestId('QUEST_CHAT_ACTIVITY');

      expect(queryByTestId('CHAT_PANEL')).toBe(null);
      expect(queryByTestId('QUEST_CHAT_DIVIDER')).toBe(null);
      expect(queryByTestId('QUEST_CHAT_ACTIVITY')?.getAttribute('data-testid')).toBe(
        'QUEST_CHAT_ACTIVITY',
      );
    });

    it('VALID: {?chat=visible, quest at review_flows} => CHAT_PANEL still in DOM (only exact `hidden` triggers)', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupMode({ mode: 'claude' });
      const guildId = GuildIdStub({ value: '33333333-4444-5555-6666-777777777777' });
      const quest = QuestStub({ id: 'q-visible', status: 'review_flows' });

      const { queryByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/quest/q-visible?chat=visible']}>
            <Routes>
              <Route
                path="/test-guild/quest/:questId"
                element={
                  <QuestChatContentLayerWidget
                    questId={'q-visible' as never}
                    guildId={guildId}
                    guildSlug={'test-guild' as never}
                  />
                }
              />
            </Routes>
          </MemoryRouter>
        ),
      });

      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'quest-modified',
            payload: { questId: quest.id, quest },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(queryByTestId('CHAT_PANEL')?.getAttribute('data-testid')).toBe('CHAT_PANEL');
      });

      expect(queryByTestId('CHAT_PANEL')?.getAttribute('data-testid')).toBe('CHAT_PANEL');
    });

    it('VALID: {clarify answered between two agent batches with different sessionIds} => user answer renders BETWEEN earlier and later agent messages (cross-session timestamp order)', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupMode({ mode: 'claude' });
      const guildId = GuildIdStub({ value: '99999999-aaaa-bbbb-cccc-dddddddddddd' });
      const quest = QuestStub({ id: 'q-clarify-order', status: 'review_flows' });
      const chatProcessId = ProcessIdStub({ value: 'proc-clarify-order' });
      proxy.setupClarify({ chatProcessId });
      // Mocked timestamp for the synthetic user entry created by submitClarifyAnswers.
      // Sits BETWEEN the two agent chat-outputs (T1=10s, T2=30s, T3=50s).
      proxy.setupTimestamps({ timestamps: ['2026-05-11T03:59:30.000Z'] });
      proxy.setupUuids({ uuids: ['ddddddd2-dddd-4ddd-8ddd-dddddddddddd'] });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatContentLayerWidget
              questId={'q-clarify-order' as never}
              guildId={guildId}
              guildSlug={'test-guild' as never}
            />
          </MemoryRouter>
        ),
      });

      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'quest-modified',
            payload: { questId: quest.id, quest },
            timestamp: '2026-05-11T03:59:00.000Z',
          }),
        });
      });

      // Earlier agent text — arrives at T1=10s with the live sessionId. Goes into
      // entriesBySessionInternal under the real-session bucket FIRST (Map insertion order).
      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              chatProcessId,
              sessionId: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
              questId: quest.id,
              entries: [
                {
                  role: 'assistant',
                  type: 'text',
                  content: 'AGENT_FIRST_TEXT',
                  uuid: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                  timestamp: '2026-05-11T03:59:10.000Z',
                },
              ],
            },
            timestamp: '2026-05-11T03:59:10.000Z',
          }),
        });
      });

      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'clarification-request',
            payload: {
              chatProcessId,
              questions: [
                {
                  question: 'Which database do you prefer?',
                  header: 'Database',
                  options: [{ label: 'Postgres', description: 'Relational DB' }],
                  multiSelect: false,
                },
              ],
            },
            timestamp: '2026-05-11T03:59:25.000Z',
          }),
        });
      });

      const option = await screen.findByTestId('CLARIFY_OPTION');
      await act(async () => {
        option.click();
        return Promise.resolve();
      });

      // Later agent text — arrives at T3=50s with the SAME real sessionId. Lands in
      // the already-inserted real-session bucket; the synthetic user entry inserted at
      // T2 lives under SYNTHETIC_SESSION_KEY in the binding. flattenedEntries must sort
      // them GLOBALLY by timestamp; per-bucket sort alone leaves the user entry at the
      // end because Map iteration follows insertion order.
      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              chatProcessId,
              sessionId: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
              questId: quest.id,
              entries: [
                {
                  role: 'assistant',
                  type: 'text',
                  content: 'AGENT_THIRD_TEXT',
                  uuid: 'aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                  timestamp: '2026-05-11T03:59:50.000Z',
                },
              ],
            },
            timestamp: '2026-05-11T03:59:50.000Z',
          }),
        });
      });

      await waitFor(() => {
        const lastIdx = screen
          .queryAllByTestId('CHAT_MESSAGE')
          .map((m) => String(m.textContent))
          .findIndex((t) => t.includes('AGENT_THIRD_TEXT'));

        expect(lastIdx).toBe(2);
      });

      const messageTexts = screen
        .queryAllByTestId('CHAT_MESSAGE')
        .map((m) => String(m.textContent));
      const positions = [
        messageTexts.findIndex((t) => t.includes('AGENT_FIRST_TEXT')),
        messageTexts.findIndex((t) => t.includes('Database: Postgres')),
        messageTexts.findIndex((t) => t.includes('AGENT_THIRD_TEXT')),
      ];

      expect(positions).toStrictEqual([0, 1, 2]);
    });
  });
});
