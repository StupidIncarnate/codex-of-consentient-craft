import { act, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { GuildIdStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QuestChatContentLayerWidget } from './quest-chat-content-layer-widget';
import { QuestChatContentLayerWidgetProxy } from './quest-chat-content-layer-widget.proxy';

const LocationProbe = (): React.JSX.Element => {
  const loc = useLocation();
  return <div data-testid="LOCATION_PATHNAME">{loc.pathname}</div>;
};

describe('QuestChatContentLayerWidget', () => {
  describe('new-chat surface (questId null)', () => {
    it('VALID: {questId null} => renders chat panel + awaiting activity divider', async () => {
      QuestChatContentLayerWidgetProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });

      const { findByTestId, queryByTestId } = mantineRenderAdapter({
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

      expect(queryByTestId('CHAT_PANEL')?.getAttribute('data-testid')).toBe('CHAT_PANEL');
      expect(queryByTestId('QUEST_CHAT_DIVIDER')?.getAttribute('data-testid')).toBe(
        'QUEST_CHAT_DIVIDER',
      );
      expect(queryByTestId('QUEST_CHAT_ACTIVITY')?.getAttribute('data-testid')).toBe(
        'QUEST_CHAT_ACTIVITY',
      );
    });

    it('VALID: {first message sent} => POSTs questNew and replace-navigates to /:guildSlug/quest/:questId', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
      const guildId = GuildIdStub({ value: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff' });
      proxy.setupQuestNew({
        questId: 'new-q-99' as never,
        chatProcessId: 'proc-99' as never,
      });

      const { findByTestId, getByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/quest']}>
            <Routes>
              <Route
                path="/test-guild/quest"
                element={
                  <>
                    <QuestChatContentLayerWidget
                      questId={null}
                      guildId={guildId}
                      guildSlug={'test-guild' as never}
                    />
                    <LocationProbe />
                  </>
                }
              />
              <Route
                path="/test-guild/quest/:questId"
                element={
                  <>
                    <QuestChatContentLayerWidget
                      questId={'new-q-99' as never}
                      guildId={guildId}
                      guildSlug={'test-guild' as never}
                    />
                    <LocationProbe />
                  </>
                }
              />
            </Routes>
          </MemoryRouter>
        ),
      });

      await findByTestId('CHAT_PANEL');

      await proxy.typeMessage({ text: 'hello' });
      await proxy.clickSend();

      await waitFor(() => {
        expect(getByTestId('LOCATION_PATHNAME').textContent).toBe('/test-guild/quest/new-q-99');
      });

      expect(getByTestId('LOCATION_PATHNAME').textContent).toBe('/test-guild/quest/new-q-99');
    });
  });

  describe('live workspace (questId set)', () => {
    it('VALID: {no quest yet from binding} => renders new-chat-style awaiting surface', () => {
      QuestChatContentLayerWidgetProxy();
      const guildId = GuildIdStub({ value: 'cccccccc-dddd-eeee-ffff-aaaaaaaaaaaa' });

      const { queryByTestId } = mantineRenderAdapter({
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

      expect(queryByTestId('QUEST_CHAT_ACTIVITY')?.getAttribute('data-testid')).toBe(
        'QUEST_CHAT_ACTIVITY',
      );
      expect(queryByTestId('CHAT_PANEL')?.getAttribute('data-testid')).toBe('CHAT_PANEL');
    });

    it('VALID: {quest at review_flows} => renders chat panel + spec panel', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
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
        proxy.receiveWsMessage({
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

    it('VALID: {quest at in_progress} => renders execution panel + flat activity', async () => {
      const proxy = QuestChatContentLayerWidgetProxy();
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
        proxy.receiveWsMessage({
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
    });
  });
});
