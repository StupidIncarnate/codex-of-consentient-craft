import { MemoryRouter } from 'react-router-dom';

import { GuildIdStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QuestChatRoutingLayerWidget } from './quest-chat-routing-layer-widget';
import { QuestChatRoutingLayerWidgetProxy } from './quest-chat-routing-layer-widget.proxy';

describe('QuestChatRoutingLayerWidget', () => {
  describe('non-quest path', () => {
    it('VALID: {isQuestPath false} => renders no recognizable test markers', () => {
      QuestChatRoutingLayerWidgetProxy();

      const probe = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatRoutingLayerWidget
              isQuestPath={false}
              questId={null}
              matchedGuildId={null}
              matchedGuild={undefined}
              guildsLoading={false}
            />
          </MemoryRouter>
        ),
      });

      expect(probe.queryByTestId('NOT_FOUND')).toBe(null);
      expect(probe.queryByTestId('QUEST_CHAT_LOADING')).toBe(null);
      expect(probe.queryByTestId('CHAT_PANEL')).toBe(null);
    });
  });

  describe('quest path branches', () => {
    it('VALID: {isQuestPath, no guild matched} => renders NOT FOUND', () => {
      QuestChatRoutingLayerWidgetProxy();

      const probe = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatRoutingLayerWidget
              isQuestPath
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

    it('VALID: {isQuestPath, no questId, guildSlug matched} => renders new-chat panel', () => {
      QuestChatRoutingLayerWidgetProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });

      const probe = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatRoutingLayerWidget
              isQuestPath
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

    it('VALID: {isQuestPath, questId} => renders live workspace loading state until quest arrives', () => {
      QuestChatRoutingLayerWidgetProxy();
      const guildId = GuildIdStub({ value: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff' });

      const probe = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestChatRoutingLayerWidget
              isQuestPath
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
  });
});
