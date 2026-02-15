/**
 * PURPOSE: Tests for QuestChatWidget - split panel layout with chat and activity
 */

import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QuestChatWidget } from './quest-chat-widget';
import { QuestChatWidgetProxy } from './quest-chat-widget.proxy';

describe('QuestChatWidget', () => {
  describe('layout structure', () => {
    it('VALID: {questId in URL} => renders ChatPanelWidget', () => {
      const proxy = QuestChatWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/guild/test-guild/quest/chat-q1']}>
            <Routes>
              <Route path="/guild/:guildSlug/quest/:questSlug" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      expect(proxy.hasChatPanel()).toBe(true);
    });

    it('VALID: {questId in URL} => renders vertical divider', () => {
      const proxy = QuestChatWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/guild/test-guild/quest/chat-q2']}>
            <Routes>
              <Route path="/guild/:guildSlug/quest/:questSlug" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      expect(proxy.hasDivider()).toBe(true);
    });
  });

  describe('right panel', () => {
    it('VALID: {questId in URL} => renders activity placeholder text', () => {
      const proxy = QuestChatWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/guild/test-guild/quest/chat-q3']}>
            <Routes>
              <Route path="/guild/:guildSlug/quest/:questSlug" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      expect(proxy.hasActivityPlaceholder()).toBe(true);
      expect(proxy.getActivityText()).toBe('Awaiting quest activity...');
    });
  });
});
