import { render, screen } from '#gateway/npm/testing-library__react';

import { GuildEmptyStateWidget } from './guild-empty-state-widget';
import { GuildEmptyStateWidgetProxy } from './guild-empty-state-widget.proxy';

describe('GuildEmptyStateWidget', () => {
  describe('rendering', () => {
    it('VALID: {} => renders NEW GUILD title', () => {
      const proxy = GuildEmptyStateWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });

      render({
        ui: <GuildEmptyStateWidget onAddGuild={jest.fn()} />,
      });

      expect(proxy.isNewGuildTitleVisible()).toBe(true);
    });

    it('VALID: {} => renders name input', () => {
      const proxy = GuildEmptyStateWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });

      render({
        ui: <GuildEmptyStateWidget onAddGuild={jest.fn()} />,
      });

      expect(screen.getByTestId('GUILD_NAME_INPUT')).toBeInTheDocument();
    });

    it('VALID: {} => renders path input', () => {
      const proxy = GuildEmptyStateWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });

      render({
        ui: <GuildEmptyStateWidget onAddGuild={jest.fn()} />,
      });

      expect(screen.getByTestId('GUILD_PATH_INPUT')).toBeInTheDocument();
    });

    it('VALID: {no onCancel} => does not render CANCEL button', () => {
      const proxy = GuildEmptyStateWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });

      render({
        ui: <GuildEmptyStateWidget onAddGuild={jest.fn()} />,
      });

      expect(proxy.isCancelVisible()).toBe(false);
    });

    it('VALID: {onCancel provided} => renders CANCEL button', () => {
      const proxy = GuildEmptyStateWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });

      render({
        ui: <GuildEmptyStateWidget onAddGuild={jest.fn()} onCancel={jest.fn()} />,
      });

      expect(proxy.isCancelVisible()).toBe(true);
    });

    it('VALID: {} => renders BROWSE button', () => {
      const proxy = GuildEmptyStateWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });

      render({
        ui: <GuildEmptyStateWidget onAddGuild={jest.fn()} />,
      });

      expect(proxy.isBrowseVisible()).toBe(true);
    });

    it('VALID: {} => the name input and the path input sit in sibling rows of one alignment container', () => {
      const proxy = GuildEmptyStateWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });

      render({
        ui: <GuildEmptyStateWidget onAddGuild={jest.fn()} />,
      });

      const alignmentGroup = screen.getByTestId('GUILD_INPUT_ALIGNMENT_GROUP');
      const nameInput = screen.getByTestId('GUILD_NAME_INPUT');
      const pathInput = screen.getByTestId('GUILD_PATH_INPUT');
      const [nameRow, pathRow] = Array.from(alignmentGroup.children);

      expect(nameRow?.contains(nameInput)).toBe(true);
      expect(pathRow?.contains(pathInput)).toBe(true);
      expect(pathRow?.contains(nameInput)).toBe(false);
    });
  });

  describe('interactions', () => {
    it('VALID: {click CANCEL} => calls onCancel', async () => {
      const proxy = GuildEmptyStateWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });
      const onCancel = jest.fn();

      render({
        ui: <GuildEmptyStateWidget onAddGuild={jest.fn()} onCancel={onCancel} />,
      });

      await proxy.clickCancel();

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('VALID: {name, absolute path, click CREATE} => calls onAddGuild with both and shows no path error', async () => {
      const proxy = GuildEmptyStateWidgetProxy();
      const onAddGuild = jest.fn();

      proxy.setupDirectoryBrowse({ entries: [] });
      render({
        ui: <GuildEmptyStateWidget onAddGuild={onAddGuild} />,
      });

      await proxy.typeGuildName({ value: 'jod' });
      await proxy.typeGuildPath({ value: '/home/user/jo' });
      await proxy.clickCreate();

      expect(onAddGuild).toHaveBeenCalledTimes(1);
      expect(onAddGuild).toHaveBeenCalledWith({ name: 'jod', path: '/home/user/jo' });
      expect(proxy.getGuildPathError()).toBe(null);
    });

    it('INVALID: {relative path "jo", click CREATE} => shows the path error and never calls onAddGuild', async () => {
      const proxy = GuildEmptyStateWidgetProxy();
      const onAddGuild = jest.fn();

      proxy.setupDirectoryBrowse({ entries: [] });
      render({
        ui: <GuildEmptyStateWidget onAddGuild={onAddGuild} />,
      });

      await proxy.typeGuildName({ value: 'jod' });
      await proxy.typeGuildPath({ value: 'jo' });
      await proxy.clickCreate();

      expect(proxy.getGuildPathError()).toBe(
        'Path must be absolute (start with / or C:\\ on Windows)',
      );
      expect(onAddGuild).toHaveBeenCalledTimes(0);
    });

    it('VALID: {path error shown, then path edited} => clears the path error', async () => {
      const proxy = GuildEmptyStateWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });
      render({
        ui: <GuildEmptyStateWidget onAddGuild={jest.fn()} />,
      });

      await proxy.typeGuildName({ value: 'jod' });
      await proxy.typeGuildPath({ value: 'jo' });
      await proxy.clickCreate();
      await proxy.typeGuildPath({ value: 'x' });

      expect(proxy.getGuildPathError()).toBe(null);
    });
  });

  describe('button test ids', () => {
    it('VALID: {onCancel provided} => BROWSE, CREATE and CANCEL each carry their own id', () => {
      const proxy = GuildEmptyStateWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });
      render({
        ui: <GuildEmptyStateWidget onAddGuild={jest.fn()} onCancel={jest.fn()} />,
      });

      expect(screen.getByTestId('GUILD_BROWSE_BUTTON').textContent).toBe('BROWSE');
      expect(screen.getByTestId('GUILD_CREATE_BUTTON').textContent).toBe('CREATE');
      expect(screen.getByTestId('GUILD_CANCEL_BUTTON').textContent).toBe('CANCEL');
      expect(screen.queryAllByTestId('PIXEL_BTN')).toStrictEqual([]);
    });
  });
});
