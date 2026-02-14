import { GuildIdStub, GuildListItemStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { GuildListWidget } from './guild-list-widget';
import { GuildListWidgetProxy } from './guild-list-widget.proxy';

describe('GuildListWidget', () => {
  describe('rendering', () => {
    it('VALID: {guilds} => renders GUILDS header', () => {
      const proxy = GuildListWidgetProxy();
      const onSelect = jest.fn();
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: (
          <GuildListWidget guilds={[]} selectedGuildId={null} onSelect={onSelect} onAdd={onAdd} />
        ),
      });

      expect(proxy.hasHeader()).toBe(true);
    });

    it('VALID: {guilds with items} => renders guild names', () => {
      const proxy = GuildListWidgetProxy();
      const guildId = GuildIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const guild = GuildListItemStub({ id: guildId, name: 'Test Guild' });
      const onSelect = jest.fn();
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: (
          <GuildListWidget
            guilds={[guild]}
            selectedGuildId={null}
            onSelect={onSelect}
            onAdd={onAdd}
          />
        ),
      });

      expect(proxy.isItemVisible({ testId: `GUILD_ITEM_${guildId}` })).toBe(true);
    });
  });

  describe('selection', () => {
    it('VALID: {selectedGuildId matches} => renders item as selected', () => {
      const proxy = GuildListWidgetProxy();
      const guildId = GuildIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const guild = GuildListItemStub({ id: guildId, name: 'Selected Guild' });
      const onSelect = jest.fn();
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: (
          <GuildListWidget
            guilds={[guild]}
            selectedGuildId={guildId}
            onSelect={onSelect}
            onAdd={onAdd}
          />
        ),
      });

      expect(proxy.isItemSelected({ testId: `GUILD_ITEM_${guildId}` })).toBe(true);
    });

    it('VALID: {selectedGuildId does not match} => renders item as unselected', () => {
      const proxy = GuildListWidgetProxy();
      const guildId = GuildIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const otherId = GuildIdStub({ value: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' });
      const guild = GuildListItemStub({ id: guildId, name: 'Unselected Guild' });
      const onSelect = jest.fn();
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: (
          <GuildListWidget
            guilds={[guild]}
            selectedGuildId={otherId}
            onSelect={onSelect}
            onAdd={onAdd}
          />
        ),
      });

      expect(proxy.isItemSelected({ testId: `GUILD_ITEM_${guildId}` })).toBe(false);
    });
  });

  describe('interaction', () => {
    it('VALID: {click item} => calls onSelect with guild id', async () => {
      const proxy = GuildListWidgetProxy();
      const guildId = GuildIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const guild = GuildListItemStub({ id: guildId, name: 'Clickable Guild' });
      const onSelect = jest.fn();
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: (
          <GuildListWidget
            guilds={[guild]}
            selectedGuildId={null}
            onSelect={onSelect}
            onAdd={onAdd}
          />
        ),
      });

      await proxy.clickItem({ testId: `GUILD_ITEM_${guildId}` });

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith({ id: guildId });
    });

    it('VALID: {click add button} => calls onAdd', async () => {
      const proxy = GuildListWidgetProxy();
      const onSelect = jest.fn();
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: (
          <GuildListWidget guilds={[]} selectedGuildId={null} onSelect={onSelect} onAdd={onAdd} />
        ),
      });

      await proxy.clickAddButton();

      expect(onAdd).toHaveBeenCalledTimes(1);
    });
  });

  describe('empty state', () => {
    it('EMPTY: {no guilds} => renders only header', () => {
      const proxy = GuildListWidgetProxy();
      const onSelect = jest.fn();
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: (
          <GuildListWidget guilds={[]} selectedGuildId={null} onSelect={onSelect} onAdd={onAdd} />
        ),
      });

      expect(proxy.hasHeader()).toBe(true);
    });
  });
});
