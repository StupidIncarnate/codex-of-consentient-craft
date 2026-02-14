import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { GuildAddModalWidget } from './guild-add-modal-widget';
import { GuildAddModalWidgetProxy } from './guild-add-modal-widget.proxy';

describe('GuildAddModalWidget', () => {
  describe('rendering', () => {
    it('VALID: {opened: true} => renders modal with Add Guild title', () => {
      GuildAddModalWidgetProxy();

      mantineRenderAdapter({
        ui: <GuildAddModalWidget opened={true} onClose={jest.fn()} onSubmit={jest.fn()} />,
      });

      expect(screen.getByText('Add Guild')).toBeInTheDocument();
    });

    it('VALID: {opened: true} => renders guild name input', () => {
      GuildAddModalWidgetProxy();

      mantineRenderAdapter({
        ui: <GuildAddModalWidget opened={true} onClose={jest.fn()} onSubmit={jest.fn()} />,
      });

      expect(screen.getByTestId('GUILD_NAME_INPUT')).toBeInTheDocument();
    });

    it('VALID: {opened: true} => renders Browse button', () => {
      GuildAddModalWidgetProxy();

      mantineRenderAdapter({
        ui: <GuildAddModalWidget opened={true} onClose={jest.fn()} onSubmit={jest.fn()} />,
      });

      expect(screen.getByTestId('BROWSE_BUTTON')).toBeInTheDocument();
    });

    it('VALID: {opened: true} => renders path input with empty value', () => {
      const proxy = GuildAddModalWidgetProxy();

      mantineRenderAdapter({
        ui: <GuildAddModalWidget opened={true} onClose={jest.fn()} onSubmit={jest.fn()} />,
      });

      expect(proxy.getPathDisplay()).toBe('');
    });

    it('VALID: {opened: true} => renders Create button disabled initially', () => {
      const proxy = GuildAddModalWidgetProxy();

      mantineRenderAdapter({
        ui: <GuildAddModalWidget opened={true} onClose={jest.fn()} onSubmit={jest.fn()} />,
      });

      expect(proxy.isCreateDisabled()).toBe(true);
    });
  });

  describe('interactions', () => {
    it('VALID: {type name only} => Create button remains disabled', async () => {
      const proxy = GuildAddModalWidgetProxy();

      mantineRenderAdapter({
        ui: <GuildAddModalWidget opened={true} onClose={jest.fn()} onSubmit={jest.fn()} />,
      });

      await proxy.typeName({ name: 'My Guild' });

      expect(proxy.isCreateDisabled()).toBe(true);
    });

    it('VALID: {click cancel} => calls onClose', async () => {
      const proxy = GuildAddModalWidgetProxy();
      const onClose = jest.fn();

      mantineRenderAdapter({
        ui: <GuildAddModalWidget opened={true} onClose={onClose} onSubmit={jest.fn()} />,
      });

      await proxy.clickCancel();

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
