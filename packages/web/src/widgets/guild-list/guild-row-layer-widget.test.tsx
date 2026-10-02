import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { GuildListItemStub } from '@dungeonmaster/shared/contracts/guild-list-item/guild-list-item.stub';

import { render } from '#gateway/npm/testing-library__react';
import { GuildRowLayerWidget } from './guild-row-layer-widget';
import { GuildRowLayerWidgetProxy } from './guild-row-layer-widget.proxy';

describe('GuildRowLayerWidget', () => {
  describe('rendering', () => {
    it('VALID: {guild} => renders the guild name', () => {
      const proxy = GuildRowLayerWidgetProxy();
      const guildId = GuildIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const guild = GuildListItemStub({ id: guildId, name: 'Test Guild' });

      render({
        ui: <GuildRowLayerWidget guild={guild} selectedGuildId={null} onSelect={jest.fn()} />,
      });

      expect(proxy.getItemName({ testId: `GUILD_ITEM_${guildId}` })).toBe('Test Guild');
      expect(proxy.getInvalidMarkerText({ testId: `GUILD_ITEM_INVALID_${guildId}` })).toBe(null);
    });

    it('VALID: {guild with valid false} => renders the name followed by an invalid path marker', () => {
      const proxy = GuildRowLayerWidgetProxy();
      const guildId = GuildIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const guild = GuildListItemStub({ id: guildId, name: 'jod', path: 'jo', valid: false });

      render({
        ui: <GuildRowLayerWidget guild={guild} selectedGuildId={null} onSelect={jest.fn()} />,
      });

      expect(proxy.getItemName({ testId: `GUILD_ITEM_${guildId}` })).toBe('jod(invalid path)');
      expect(proxy.getInvalidMarkerText({ testId: `GUILD_ITEM_INVALID_${guildId}` })).toBe(
        '(invalid path)',
      );
    });
  });

  describe('selection', () => {
    it('VALID: {selectedGuildId matches guild.id} => renders the row selected', () => {
      const proxy = GuildRowLayerWidgetProxy();
      const guildId = GuildIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const guild = GuildListItemStub({ id: guildId, name: 'Selected Guild' });

      render({
        ui: <GuildRowLayerWidget guild={guild} selectedGuildId={guildId} onSelect={jest.fn()} />,
      });

      expect(proxy.isItemSelected({ testId: `GUILD_ITEM_${guildId}` })).toBe(true);
    });

    it('VALID: {selectedGuildId does not match guild.id} => renders the row unselected', () => {
      const proxy = GuildRowLayerWidgetProxy();
      const guildId = GuildIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const otherId = GuildIdStub({ value: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' });
      const guild = GuildListItemStub({ id: guildId, name: 'Unselected Guild' });

      render({
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

      render({
        ui: <GuildRowLayerWidget guild={guild} selectedGuildId={null} onSelect={onSelect} />,
      });

      await proxy.clickItem({ testId: `GUILD_ITEM_${guildId}` });

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith({ id: guildId });
    });
  });
});
