import { MemoryRouter } from 'react-router-dom';

import { GuildIdStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QuestChatRoutingLayerWidget } from './quest-chat-routing-layer-widget';
import { QuestChatRoutingLayerWidgetProxy } from './quest-chat-routing-layer-widget.proxy';

describe('QuestChatRoutingLayerWidget', () => {
  describe('quest path branches', () => {
    it('VALID: {no guild matched} => renders NOT FOUND', () => {
      QuestChatRoutingLayerWidgetProxy();

      const probe = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatRoutingLayerWidget
              questId={null}
              matchedGuildId={null}
              matchedGuild={undefined}
              guildsLoading={false}
            />
          </MemoryRouter>
        ),
      });

      const node = probe.queryByTestId('NOT_FOUND');

      expect(node?.getAttribute('data-testid')).toBe('NOT_FOUND');
    });

    it('VALID: {no questId, guildSlug matched} => renders new-chat panel', () => {
      QuestChatRoutingLayerWidgetProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });

      const probe = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatRoutingLayerWidget
              questId={null}
              matchedGuildId={guildId}
              matchedGuild={{ urlSlug: 'test-guild' } as never}
              guildsLoading={false}
            />
          </MemoryRouter>
        ),
      });

      const chatPanel = probe.queryByTestId('CHAT_PANEL');

      expect(chatPanel?.getAttribute('data-testid')).toBe('CHAT_PANEL');
    });

    it('VALID: {questId} => renders live workspace loading state until quest arrives', () => {
      QuestChatRoutingLayerWidgetProxy();
      const guildId = GuildIdStub({ value: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff' });

      const probe = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatRoutingLayerWidget
              questId={'live-q-routing' as never}
              matchedGuildId={guildId}
              matchedGuild={{ urlSlug: 'test-guild' } as never}
              guildsLoading={false}
            />
          </MemoryRouter>
        ),
      });

      const loading = probe.queryByTestId('QUEST_CHAT_LOADING');

      expect(loading?.getAttribute('data-testid')).toBe('QUEST_CHAT_LOADING');
    });

    it('VALID: {guildsLoading and no match yet} => renders loading raccoon (no NOT_FOUND yet)', () => {
      QuestChatRoutingLayerWidgetProxy();

      const probe = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatRoutingLayerWidget
              questId={null}
              matchedGuildId={null}
              matchedGuild={undefined}
              guildsLoading={true}
            />
          </MemoryRouter>
        ),
      });

      expect(probe.queryByTestId('NOT_FOUND')).toBe(null);
      expect(probe.queryByTestId('QUEST_CHAT_LOADING')?.getAttribute('data-testid')).toBe(
        'QUEST_CHAT_LOADING',
      );
    });
  });
});
