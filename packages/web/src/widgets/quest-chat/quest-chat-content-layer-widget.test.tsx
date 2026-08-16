import { act, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import {
  GuildIdStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
  QuestSummaryFlowStub,
  QuestSummaryStub,
  QuestSummaryTrackCountsStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QuestChatContentLayerWidget } from './quest-chat-content-layer-widget';
import { QuestChatContentLayerWidgetProxy } from './quest-chat-content-layer-widget.proxy';

// The message questLoadBroker produces when questContract rejects a field — the shape the server
// relays when a subscribe-quest read fails.
const PARSE_FAILURE_REASON =
  'Failed to parse quest file at /home/dm/guilds/g1/quests/q-broken/quest.json: comments.0.createdAt: Invalid datetime';

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

  describe('quest type picker', () => {
    it('VALID: {node mode, questId null} => renders the quest type picker on the create surface', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupMode({ mode: 'node' });
      const guildId = GuildIdStub({ value: '11111111-2222-3333-4444-555555555555' });

      const { findByTestId } = mantineRenderAdapter({
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

      const picker = await findByTestId('QUEST_TYPE_PICKER');

      expect(
        Array.from(picker.querySelectorAll('option')).map((option) => String(option.textContent)),
      ).toStrictEqual(['Create Feature', 'Create Bug']);
    });

    it('VALID: {default selection, first message sent} => POSTs questType feature', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupMode({ mode: 'node' });
      proxy.setupNewQuest({
        questId: QuestIdStub({ value: 'q-feature' }),
        chatProcessId: ProcessIdStub({ value: 'proc-feature' }),
      });
      const guildId = GuildIdStub({ value: '22222222-3333-4444-5555-666666666666' });

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

      await expect(proxy.getNewQuestRequestBodies()).resolves.toStrictEqual([
        { message: 'Add auth', questType: 'feature' },
      ]);
    });

    it('VALID: {Create Bug selected, first message sent} => POSTs questType bug-hunt', async () => {
      // The selection has to reach the wire: the server derives the intake role (bughunt vs
      // chaoswhisperer) and the whole PestEater pipeline from this field alone, so a picker that
      // renders but never POSTs its value silently creates a feature quest.
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupMode({ mode: 'node' });
      proxy.setupNewQuest({
        questId: QuestIdStub({ value: 'q-bug' }),
        chatProcessId: ProcessIdStub({ value: 'proc-bug' }),
      });
      const guildId = GuildIdStub({ value: '33333333-4444-5555-6666-777777777777' });

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
      await proxy.selectQuestType({ label: 'Create Bug' });
      await proxy.typeMessage({ text: 'Rows do not render' });
      await proxy.clickSend();

      await waitFor(() => {
        expect(proxy.getNewQuestRequestCount()).toBe(1);
      });

      await expect(proxy.getNewQuestRequestBodies()).resolves.toStrictEqual([
        { message: 'Rows do not render', questType: 'bug-hunt' },
      ]);
    });

    it('EMPTY: {questId set} => renders no quest type picker, since the type is already settled', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupMode({ mode: 'node' });
      const guildId = GuildIdStub({ value: '44444444-5555-6666-7777-999999999999' });

      const { queryByTestId, findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatContentLayerWidget
              questId={'q-existing' as never}
              guildId={guildId}
              guildSlug={'test-guild' as never}
            />
          </MemoryRouter>
        ),
      });

      await findByTestId('CHAT_PANEL');

      expect(queryByTestId('QUEST_TYPE_PICKER')).toBe(null);
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

    it('VALID: {quest at in_progress} => renders execution panel + activity column (no chat-entry feed)', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupMode({ mode: 'claude' });
      proxy.setupQuestSummary({ summary: QuestSummaryStub({ questId: 'q-exec' }) });
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
      // No chat-entry feed inside the right column.
      expect(queryByTestId('CHAT_MESSAGE')).toBe(null);
    });

    it('VALID: {quest at in_progress} => the verification summary JOINS the dumpster raccoon in the activity column rather than replacing it', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupMode({ mode: 'claude' });
      proxy.setupQuestSummary({
        summary: QuestSummaryStub({
          questId: 'q-exec-summary',
          flows: [
            QuestSummaryFlowStub({
              tracks: [
                QuestSummaryTrackCountsStub({
                  id: 'siegemaster',
                  confirmed: 0,
                  unconfirmable: 1,
                  outstanding: 9,
                }),
              ],
            }),
          ],
        }),
      });
      const guildId = GuildIdStub({ value: 'eeeeeeee-ffff-aaaa-bbbb-dddddddddddd' });
      const quest = QuestStub({
        id: 'q-exec-summary',
        status: 'in_progress',
      });

      const { queryByTestId, getByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatContentLayerWidget
              questId={'q-exec-summary' as never}
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
        expect(queryByTestId('QUEST_SUMMARY')?.getAttribute('data-testid')).toBe('QUEST_SUMMARY');
      });

      expect(queryByTestId('dumpster-raccoon-widget')?.getAttribute('data-testid')).toBe(
        'dumpster-raccoon-widget',
      );
      expect(queryByTestId('QUEST_SUMMARY_TRACK_OUTSTANDING')?.textContent).toBe('9 outstanding');

      // ORDER, not just presence. Both were already rendered when the raccoon sat underneath a
      // summary tall enough that reaching it meant scrolling past every flow the quest has — so an
      // assertion that only checks membership passes in either arrangement.
      // Siblings, so this is an exact code rather than a flag set: FOLLOWING alone (4) means the
      // summary comes after the raccoon and is not nested inside it.
      expect(
        getByTestId('dumpster-raccoon-widget').compareDocumentPosition(
          getByTestId('QUEST_SUMMARY'),
        ),
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
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

  describe('post-quest FOLLOW-UP + merge (execution phase)', () => {
    it('VALID: {quest at complete, FOLLOW-UP tab clicked} => QUEST_SUMMARY stays inside QUEST_CHAT_ACTIVITY', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupMode({ mode: 'claude' });
      proxy.setupQuestSummary({ summary: QuestSummaryStub({ questId: 'q-complete-summary' }) });
      const guildId = GuildIdStub({ value: 'aaaaaaa1-1111-2222-3333-444444444444' });
      const quest = QuestStub({ id: 'q-complete-summary', status: 'complete' });

      const { findByTestId, getByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatContentLayerWidget
              questId={'q-complete-summary' as never}
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

      await findByTestId('QUEST_SUMMARY');
      await proxy.clickFollowupButton();
      await findByTestId('CHAT_PANEL');

      expect(getByTestId('QUEST_CHAT_ACTIVITY').contains(getByTestId('QUEST_SUMMARY'))).toBe(true);
    });

    it('VALID: {FOLLOW-UP tab clicked} => mounts the CHAT_PANEL widget with CHAT_INPUT and SEND_BUTTON as descendants', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupMode({ mode: 'claude' });
      proxy.setupQuestSummary({ summary: QuestSummaryStub({ questId: 'q-followup-chat-panel' }) });
      const guildId = GuildIdStub({ value: 'aaaaaaa2-1111-2222-3333-444444444444' });
      const quest = QuestStub({ id: 'q-followup-chat-panel', status: 'complete' });

      const { findByTestId, getByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatContentLayerWidget
              questId={'q-followup-chat-panel' as never}
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

      await findByTestId('QUEST_SUMMARY');
      await proxy.clickFollowupButton();

      const chatPanel = await findByTestId('CHAT_PANEL');

      expect(chatPanel.contains(getByTestId('CHAT_INPUT'))).toBe(true);
      expect(chatPanel.contains(getByTestId('SEND_BUTTON'))).toBe(true);
    });

    it('VALID: {FOLLOW-UP tab, message typed and sent} => POSTs followup with the typed message', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupMode({ mode: 'claude' });
      proxy.setupQuestSummary({ summary: QuestSummaryStub({ questId: 'q-followup-post' }) });
      proxy.setupFollowup({ chatProcessId: ProcessIdStub({ value: 'proc-followup-post' }) });
      const guildId = GuildIdStub({ value: 'aaaaaaa3-1111-2222-3333-444444444444' });
      const quest = QuestStub({ id: 'q-followup-post', status: 'complete' });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatContentLayerWidget
              questId={'q-followup-post' as never}
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

      await screen.findByTestId('QUEST_SUMMARY');
      await proxy.clickFollowupButton();
      await screen.findByTestId('CHAT_PANEL');
      await proxy.typeFollowupMessage({ text: 'What broke?' });
      await proxy.clickFollowupSend();

      await waitFor(() => {
        expect(proxy.getFollowupRequestCount()).toBe(1);
      });

      expect(proxy.getFollowupRequestBody()).toStrictEqual({ message: 'What broke?' });
    });

    it('ERROR: {followup POST rejected with 400} => renders the exact server error text inside the FOLLOW-UP tab', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupMode({ mode: 'claude' });
      proxy.setupQuestSummary({ summary: QuestSummaryStub({ questId: 'q-followup-rejected' }) });
      proxy.setupFollowupRejected({
        error: 'Quest must be blocked, complete or merged for follow-up',
      });
      const guildId = GuildIdStub({ value: 'aaaaaaa4-1111-2222-3333-444444444444' });
      const quest = QuestStub({ id: 'q-followup-rejected', status: 'complete' });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatContentLayerWidget
              questId={'q-followup-rejected' as never}
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

      await screen.findByTestId('QUEST_SUMMARY');
      await proxy.clickFollowupButton();
      await screen.findByTestId('CHAT_PANEL');
      await proxy.typeFollowupMessage({ text: 'Ping the agent' });
      await proxy.clickFollowupSend();

      await waitFor(() => {
        expect(
          screen.queryAllByTestId('CHAT_MESSAGE').some((m) => m.textContent?.startsWith('ERROR')),
        ).toBe(true);
      });

      const errorMessage = screen
        .queryAllByTestId('CHAT_MESSAGE')
        .find((m) => m.textContent?.startsWith('ERROR'));

      expect(errorMessage?.textContent).toBe(
        'ERRORQuest must be blocked, complete or merged for follow-up',
      );
    });

    // The reported bug, at the surface the user actually looked at. The composer used to read the
    // quest-GLOBAL streaming flag, so any work item emitting on the quest flipped this control to
    // STOP over a tavernkeeper nobody had spoken to. Asserting the rendered control rather than the
    // binding flag is the point — the binding test proves the value, this proves the button.
    it('VALID: {FOLLOW-UP tab open, a NON-tavernkeeper work item streams} => the composer keeps SEND and never shows STOP', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupMode({ mode: 'claude' });
      proxy.setupQuestSummary({ summary: QuestSummaryStub({ questId: 'q-followup-scope' }) });
      const guildId = GuildIdStub({ value: 'aaaaaaa6-1111-2222-3333-444444444444' });
      const codeweaverWorkItemId = QuestWorkItemIdStub({
        value: '00000000-0000-4000-8000-0000000000d2',
      });
      const quest = QuestStub({
        id: 'q-followup-scope',
        status: 'blocked',
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: '00000000-0000-4000-8000-0000000000d1' }),
            role: 'tavernkeeper',
          }),
          WorkItemStub({ id: codeweaverWorkItemId, role: 'codeweaver' }),
        ],
      });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatContentLayerWidget
              questId={'q-followup-scope' as never}
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

      await proxy.clickFollowupButton();
      await screen.findByTestId('CHAT_PANEL');

      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              questId: quest.id,
              workItemId: codeweaverWorkItemId,
              chatProcessId: ProcessIdStub({ value: 'proc-codeweaver-scope' }),
              entries: [
                {
                  role: 'assistant',
                  type: 'text',
                  content: 'still building',
                  uuid: '00000000-0000-4000-8000-0000000000d3',
                  timestamp: '2025-01-01T00:00:01.000Z',
                },
              ],
            },
            timestamp: '2025-01-01T00:00:01.000Z',
          }),
        });
      });

      expect({
        stop: proxy.isFollowupStopButtonVisible(),
        send: proxy.isFollowupSendButtonVisible(),
      }).toStrictEqual({ stop: false, send: true });
    });

    // STOP on this tab kills the tavernkeeper alone. It used to POST the quest PAUSE route, which
    // halts the whole quest and flips its status — illegal from `complete`/`merged`, and from
    // `blocked` it succeeded and took the FOLLOW-UP tab away with the quest. Asserting the pause
    // count is 0 alongside is the half that catches a regression back to the old wiring.
    it('VALID: {FOLLOW-UP turn in flight, STOP clicked} => POSTs followup-stop once and never the quest pause route', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupMode({ mode: 'claude' });
      proxy.setupQuestSummary({ summary: QuestSummaryStub({ questId: 'q-followup-stop' }) });
      proxy.setupFollowup({ chatProcessId: ProcessIdStub({ value: 'proc-followup-stop' }) });
      proxy.setupFollowupStop({ stopped: true });
      proxy.setupPause();
      const guildId = GuildIdStub({ value: 'aaaaaaa7-1111-2222-3333-444444444444' });
      const quest = QuestStub({ id: 'q-followup-stop', status: 'complete' });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatContentLayerWidget
              questId={'q-followup-stop' as never}
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

      await screen.findByTestId('QUEST_SUMMARY');
      await proxy.clickFollowupButton();
      await screen.findByTestId('CHAT_PANEL');
      await proxy.typeFollowupMessage({ text: 'What broke?' });
      await proxy.clickFollowupSend();

      // The composer must actually be showing STOP before the click — a test that clicked a
      // control it never saw would pass on a tab stuck on SEND.
      await screen.findByTestId('STOP_BUTTON');
      await proxy.clickFollowupStop();

      await waitFor(() => {
        expect(proxy.getFollowupStopRequestCount()).toBe(1);
      });

      expect({
        followupStop: proxy.getFollowupStopRequestCount(),
        pause: proxy.getPauseRequestCount(),
        stopStillVisible: proxy.isFollowupStopButtonVisible(),
      }).toStrictEqual({ followupStop: 1, pause: 0, stopStillVisible: false });
    });

    it('VALID: {complete quest, MERGE button clicked} => POSTs quest-merge once', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupMode({ mode: 'claude' });
      proxy.setupQuestSummary({ summary: QuestSummaryStub({ questId: 'q-merge' }) });
      proxy.setupMerge({ merging: true });
      const guildId = GuildIdStub({ value: 'aaaaaaa5-1111-2222-3333-444444444444' });
      const quest = QuestStub({ id: 'q-merge', status: 'complete' });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatContentLayerWidget
              questId={'q-merge' as never}
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

      await screen.findByTestId('QUEST_SUMMARY');
      await proxy.clickMergeButton();

      await waitFor(() => {
        expect(proxy.getMergeRequestCount()).toBe(1);
      });

      expect(proxy.getMergeRequestCount()).toBe(1);
    });

    it('VALID: {quest at merging} => post-quest bar is gone but ABANDON QUEST stays, so a hung merge has an exit', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupMode({ mode: 'claude' });
      proxy.setupQuestSummary({ summary: QuestSummaryStub({ questId: 'q-merging' }) });
      const guildId = GuildIdStub({ value: 'aaaaaaa6-1111-2222-3333-444444444444' });
      const quest = QuestStub({ id: 'q-merging', status: 'merging' });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatContentLayerWidget
              questId={'q-merging' as never}
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

      await screen.findByTestId('QUEST_SUMMARY');

      expect({
        postQuestBar: screen.queryByTestId('execution-panel-post-quest-bar'),
        abandonVisible: proxy.hasAbandonButton(),
        header: screen.getByTestId('execution-panel-status-banner').textContent,
      }).toStrictEqual({ postQuestBar: null, abandonVisible: true, header: 'MERGING' });
    });
  });

  describe('Begin Quest failure surface', () => {
    // POST /start runs the whole git lifecycle synchronously, so on a real repo it is silent for
    // minutes. Closing the modal is the only thing a REFUSED start changes on screen, which makes
    // a rejection and a slow success look identical to a reader — the toast is the only thing that
    // tells them apart, and every rejection this endpoint issues names its own cause in the body.
    it('ERROR: {start POST rejected with 400} => raises a red toast carrying the exact server error text', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupMode({ mode: 'claude' });
      proxy.setupStartRejected({
        error: 'quest/add-auth-7bc217a1 already exists — name is in use by other work',
      });
      const guildId = GuildIdStub({ value: 'aaaaaaa7-1111-2222-3333-444444444444' });
      const quest = QuestStub({ id: 'q-begin-rejected', status: 'approved' });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatContentLayerWidget
              questId={'q-begin-rejected' as never}
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

      await screen.findByTestId('QUEST_APPROVED_MODAL_TITLE');
      await proxy.clickBeginQuest();

      await waitFor(() => {
        expect(proxy.getShownNotification()).toStrictEqual({
          message: 'quest/add-auth-7bc217a1 already exists — name is in use by other work',
          color: 'red',
        });
      });

      // One click, one POST. A refused Start must not quietly retry behind the reader.
      expect(proxy.getStartRequestCount()).toBe(1);
    });

    it('VALID: {start POST accepted} => raises no toast', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupMode({ mode: 'claude' });
      proxy.setupStart({ processId: 'proc-begin-ok' });
      const guildId = GuildIdStub({ value: 'aaaaaaa8-1111-2222-3333-444444444444' });
      const quest = QuestStub({ id: 'q-begin-ok', status: 'approved' });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatContentLayerWidget
              questId={'q-begin-ok' as never}
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

      await screen.findByTestId('QUEST_APPROVED_MODAL_TITLE');
      await proxy.clickBeginQuest();

      await waitFor(() => {
        expect(proxy.getStartRequestCount()).toBe(1);
      });

      // Pairs with the rejection case above: without it, a toast fired on EVERY start would still
      // pass that test.
      expect(proxy.getShownNotification()).toBe(undefined);
    });
  });

  describe('Begin Quest double-click guard', () => {
    it('EDGE: {click Begin Quest twice before the first POST resolves} => POSTs quest-start exactly once', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupMode({ mode: 'claude' });
      proxy.setupStart({ processId: 'proc-begin-double-click' });
      const guildId = GuildIdStub({ value: 'aaaaaaa9-1111-2222-3333-444444444444' });
      const quest = QuestStub({ id: 'q-begin-double-click', status: 'approved' });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatContentLayerWidget
              questId={'q-begin-double-click' as never}
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

      await screen.findByTestId('QUEST_APPROVED_MODAL_TITLE');
      await proxy.clickBeginQuest();
      await proxy.clickBeginQuest();

      await waitFor(() => {
        expect(proxy.getStartRequestCount()).toBe(1);
      });

      expect(proxy.getStartRequestCount()).toBe(1);
    });
  });

  describe('quest load failure surface', () => {
    it('ERROR: {quest-load-failed for this quest} => renders the parse reason instead of the awaiting surface', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupMode({ mode: 'claude' });
      const guildId = GuildIdStub({ value: '77777777-8888-9999-aaaa-bbbbbbbbbbbb' });

      const { queryByTestId, findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatContentLayerWidget
              questId={'q-broken' as never}
              guildId={guildId}
              guildSlug={'test-guild' as never}
            />
          </MemoryRouter>
        ),
      });

      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'quest-load-failed',
            payload: { questId: 'q-broken', error: PARSE_FAILURE_REASON },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await findByTestId('QUEST_LOAD_ERROR');

      // The reason has to name the rejected field verbatim — a generic "could not load" would send
      // the reader looking for a deleted quest instead of a bad field in quest.json.
      expect(queryByTestId('QUEST_LOAD_ERROR_REASON')?.textContent).toBe(PARSE_FAILURE_REASON);
      // The awaiting-activity surface reads as "still loading", so it must be gone once the load
      // has definitively failed.
      expect(queryByTestId('QUEST_CHAT_ACTIVITY')).toBe(null);
      expect(queryByTestId('QUEST_SPEC_PANEL')).toBe(null);
    });

    it('VALID: {quest-load-failed for a DIFFERENT quest} => leaves this route on the awaiting surface', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupMode({ mode: 'claude' });
      const guildId = GuildIdStub({ value: '88888888-9999-aaaa-bbbb-cccccccccccc' });

      const { queryByTestId, findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatContentLayerWidget
              questId={'q-mine' as never}
              guildId={guildId}
              guildSlug={'test-guild' as never}
            />
          </MemoryRouter>
        ),
      });

      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'quest-load-failed',
            payload: { questId: 'q-someone-else', error: PARSE_FAILURE_REASON },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await findByTestId('QUEST_CHAT_ACTIVITY');

      expect(queryByTestId('QUEST_LOAD_ERROR')).toBe(null);
    });

    it('VALID: {quest-load-failed then a quest-modified for the same quest} => the error clears and the spec panel renders', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupMode({ mode: 'claude' });
      const guildId = GuildIdStub({ value: '99999999-aaaa-bbbb-cccc-dddddddddd11' });
      const quest = QuestStub({ id: 'q-repaired', status: 'review_flows' });

      const { queryByTestId, findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatContentLayerWidget
              questId={'q-repaired' as never}
              guildId={guildId}
              guildSlug={'test-guild' as never}
            />
          </MemoryRouter>
        ),
      });

      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'quest-load-failed',
            payload: { questId: quest.id, error: PARSE_FAILURE_REASON },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await findByTestId('QUEST_LOAD_ERROR');

      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'quest-modified',
            payload: { questId: quest.id, quest },
            timestamp: '2025-01-01T00:00:01.000Z',
          }),
        });
      });

      await findByTestId('QUEST_SPEC_PANEL');

      expect(queryByTestId('QUEST_LOAD_ERROR')).toBe(null);
    });
  });
});
