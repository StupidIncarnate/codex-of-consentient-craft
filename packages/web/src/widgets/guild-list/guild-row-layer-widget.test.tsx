import { GuildIdStub, GuildListItemStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { GuildRowLayerWidget } from './guild-row-layer-widget';
import { GuildRowLayerWidgetProxy } from './guild-row-layer-widget.proxy';

describe('GuildRowLayerWidget', () => {
  describe('rendering', () => {
    it('VALID: {guild} => renders the guild name', () => {
      const proxy = GuildRowLayerWidgetProxy();
      const guildId = GuildIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const guild = GuildListItemStub({ id: guildId, name: 'Test Guild' });

      mantineRenderAdapter({
        ui: <GuildRowLayerWidget guild={guild} selectedGuildId={null} onSelect={jest.fn()} />,
      });

      expect(proxy.getItemName({ testId: `GUILD_ITEM_${guildId}` })).toBe('Test Guild');
    });
  });

  describe('selection', () => {
    it('VALID: {selectedGuildId matches guild.id} => renders the row selected', () => {
      const proxy = GuildRowLayerWidgetProxy();
      const guildId = GuildIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const guild = GuildListItemStub({ id: guildId, name: 'Selected Guild' });

      mantineRenderAdapter({
        ui: <GuildRowLayerWidget guild={guild} selectedGuildId={guildId} onSelect={jest.fn()} />,
      });

      expect(proxy.isItemSelected({ testId: `GUILD_ITEM_${guildId}` })).toBe(true);
    });

    it('VALID: {selectedGuildId does not match guild.id} => renders the row unselected', () => {
      const proxy = GuildRowLayerWidgetProxy();
      const guildId = GuildIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const otherId = GuildIdStub({ value: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' });
      const guild = GuildListItemStub({ id: guildId, name: 'Unselected Guild' });

      mantineRenderAdapter({
        ui: <GuildRowLayerWidget guild={guild} selectedGuildId={otherId} onSelect={jest.fn()} />,
      });

      expect(proxy.isItemSelected({ testId: `GUILD_ITEM_${guildId}` })).toBe(false);
    });
  });

  describe('interaction', () => {
    it('VALID: {click item} => calls onSelect with the guild id', async () => {
      const proxy = GuildRowLayerWidgetProxy();
      const guildId = GuildIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const guild = GuildListItemStub({ id: guildId, name: 'Clickable Guild' });
      const onSelect = jest.fn();

      mantineRenderAdapter({
        ui: <GuildRowLayerWidget guild={guild} selectedGuildId={null} onSelect={onSelect} />,
      });

      await proxy.clickItem({ testId: `GUILD_ITEM_${guildId}` });

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith({ id: guildId });
    });
  });
});
