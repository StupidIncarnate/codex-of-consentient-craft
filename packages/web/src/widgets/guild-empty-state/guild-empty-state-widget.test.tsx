import { screen } from '@testing-library/react';

import { mantineRenderMiddleware } from '@dungeonmaster/testing/middleware/mantine-render';
import { GuildEmptyStateWidget } from './guild-empty-state-widget';
import { GuildEmptyStateWidgetProxy } from './guild-empty-state-widget.proxy';

describe('GuildEmptyStateWidget', () => {
  describe('rendering', () => {
    it('VALID: {} => renders NEW GUILD title', () => {
      const proxy = GuildEmptyStateWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });

      mantineRenderMiddleware({
        ui: <GuildEmptyStateWidget onAddGuild={jest.fn()} />,
      });

      expect(proxy.isNewGuildTitleVisible()).toBe(true);
    });

    it('VALID: {} => renders name input', () => {
      const proxy = GuildEmptyStateWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });

      mantineRenderMiddleware({
        ui: <GuildEmptyStateWidget onAddGuild={jest.fn()} />,
      });

      expect(screen.getByTestId('GUILD_NAME_INPUT')).toBeInTheDocument();
    });

    it('VALID: {} => renders path input', () => {
      const proxy = GuildEmptyStateWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });

      mantineRenderMiddleware({
        ui: <GuildEmptyStateWidget onAddGuild={jest.fn()} />,
      });

      expect(screen.getByTestId('GUILD_PATH_INPUT')).toBeInTheDocument();
    });

    it('VALID: {no onCancel} => does not render CANCEL button', () => {
      const proxy = GuildEmptyStateWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });

      mantineRenderMiddleware({
        ui: <GuildEmptyStateWidget onAddGuild={jest.fn()} />,
      });

      expect(proxy.isCancelVisible()).toBe(false);
    });

    it('VALID: {onCancel provided} => renders CANCEL button', () => {
      const proxy = GuildEmptyStateWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });

      mantineRenderMiddleware({
        ui: <GuildEmptyStateWidget onAddGuild={jest.fn()} onCancel={jest.fn()} />,
      });

      expect(proxy.isCancelVisible()).toBe(true);
    });

    it('VALID: {} => renders BROWSE button', () => {
      const proxy = GuildEmptyStateWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });

      mantineRenderMiddleware({
        ui: <GuildEmptyStateWidget onAddGuild={jest.fn()} />,
      });

      expect(proxy.isBrowseVisible()).toBe(true);
    });

    it('VALID: {} => the name input and the path input sit in sibling rows of one alignment container', () => {
      const proxy = GuildEmptyStateWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });

      mantineRenderMiddleware({
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

      mantineRenderMiddleware({
        ui: <GuildEmptyStateWidget onAddGuild={jest.fn()} onCancel={onCancel} />,
      });

      await proxy.clickCancel();

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });
});
