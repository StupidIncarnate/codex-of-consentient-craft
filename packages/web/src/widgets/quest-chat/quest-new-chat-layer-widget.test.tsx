import { waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { GuildIdStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QuestNewChatLayerWidget } from './quest-new-chat-layer-widget';
import { QuestNewChatLayerWidgetProxy } from './quest-new-chat-layer-widget.proxy';

const LocationProbe = (): React.JSX.Element => {
  const loc = useLocation();
  return <div data-testid="LOCATION_PATHNAME">{loc.pathname}</div>;
};

describe('QuestNewChatLayerWidget', () => {
  describe('initial render', () => {
    it('VALID: {} => renders empty chat panel', async () => {
      QuestNewChatLayerWidgetProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });

      const { queryByTestId, findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestNewChatLayerWidget guildId={guildId} guildSlug={'test-guild' as never} />
          </MemoryRouter>
        ),
      });

      const panel = await findByTestId('CHAT_PANEL');

      expect(panel.getAttribute('data-testid')).toBe('CHAT_PANEL');

      // queryByTestId proves it stays mounted after find
      expect(queryByTestId('CHAT_PANEL')?.getAttribute('data-testid')).toBe('CHAT_PANEL');
    });
  });

  describe('first send', () => {
    it('VALID: {send first message} => POSTs questNew and replace-navigates to /:guildSlug/quest/:questId', async () => {
      const proxy = QuestNewChatLayerWidgetProxy();
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
                    <QuestNewChatLayerWidget guildId={guildId} guildSlug={'test-guild' as never} />
                    <LocationProbe />
                  </>
                }
              />
              <Route
                path="/test-guild/quest/:questId"
                element={
                  <>
                    <QuestNewChatLayerWidget guildId={guildId} guildSlug={'test-guild' as never} />
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
});
