import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { GuildEmptyStateWidget } from './guild-empty-state-widget';
import { GuildEmptyStateWidgetProxy } from './guild-empty-state-widget.proxy';

describe('GuildEmptyStateWidget', () => {
  describe('rendering', () => {
    it('VALID: {} => renders NEW GUILD title', () => {
      const proxy = GuildEmptyStateWidgetProxy();

      mantineRenderAdapter({
        ui: <GuildEmptyStateWidget onAddGuild={jest.fn()} />,
      });

      expect(proxy.isNewGuildTitleVisible()).toBe(true);
    });

    it('VALID: {} => renders name input', () => {
      GuildEmptyStateWidgetProxy();

      mantineRenderAdapter({
        ui: <GuildEmptyStateWidget onAddGuild={jest.fn()} />,
      });

      expect(screen.getByTestId('GUILD_NAME_INPUT')).toBeInTheDocument();
    });

    it('VALID: {} => renders path input', () => {
      GuildEmptyStateWidgetProxy();

      mantineRenderAdapter({
        ui: <GuildEmptyStateWidget onAddGuild={jest.fn()} />,
      });

      expect(screen.getByTestId('GUILD_PATH_INPUT')).toBeInTheDocument();
    });

    it('VALID: {no onCancel} => does not render CANCEL button', () => {
      const proxy = GuildEmptyStateWidgetProxy();

      mantineRenderAdapter({
        ui: <GuildEmptyStateWidget onAddGuild={jest.fn()} />,
      });

      expect(proxy.isCancelVisible()).toBe(false);
    });

    it('VALID: {onCancel provided} => renders CANCEL button', () => {
      const proxy = GuildEmptyStateWidgetProxy();

      mantineRenderAdapter({
        ui: <GuildEmptyStateWidget onAddGuild={jest.fn()} onCancel={jest.fn()} />,
      });

      expect(proxy.isCancelVisible()).toBe(true);
    });

    it('VALID: {} => renders BROWSE button', () => {
      const proxy = GuildEmptyStateWidgetProxy();

      mantineRenderAdapter({
        ui: <GuildEmptyStateWidget onAddGuild={jest.fn()} />,
      });

      expect(proxy.isBrowseVisible()).toBe(true);
    });
  });

  describe('interactions', () => {
    it('VALID: {click CANCEL} => calls onCancel', async () => {
      const proxy = GuildEmptyStateWidgetProxy();
      const onCancel = jest.fn();

      mantineRenderAdapter({
        ui: <GuildEmptyStateWidget onAddGuild={jest.fn()} onCancel={onCancel} />,
      });

      await proxy.clickCancel();

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });
});
