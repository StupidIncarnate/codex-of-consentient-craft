import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DirectoryBrowserModalWidgetProxy } from '../directory-browser-modal/directory-browser-modal-widget.proxy';

export const GuildAddModalWidgetProxy = (): {
  typeName: (params: { name: string }) => Promise<void>;
  clickBrowse: () => Promise<void>;
  clickCreate: () => Promise<void>;
  clickCancel: () => Promise<void>;
  isCreateDisabled: () => boolean;
  getPathDisplay: () => HTMLElement['textContent'];
  clickDirectoryBrowserSelect: () => Promise<void>;
  clickDirectoryBrowserCancel: () => Promise<void>;
  clickDirectoryBrowserGoUp: () => Promise<void>;
  getDirectoryBrowserCurrentPath: () => HTMLElement['textContent'];
} => {
  const directoryBrowserProxy = DirectoryBrowserModalWidgetProxy();

  return {
    typeName: async ({ name }: { name: string }): Promise<void> => {
      const input = screen.getByTestId('GUILD_NAME_INPUT');
      await userEvent.clear(input);
      await userEvent.type(input, name);
    },
    clickBrowse: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('BROWSE_BUTTON'));
    },
    clickCreate: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('CREATE_GUILD_BUTTON'));
    },
    clickCancel: async (): Promise<void> => {
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    },
    isCreateDisabled: (): boolean => {
      const button = screen.getByTestId('CREATE_GUILD_BUTTON');
      return button.hasAttribute('disabled') || button.getAttribute('data-disabled') === 'true';
    },
    getPathDisplay: (): HTMLElement['textContent'] => {
      const wrapper = screen.queryByTestId('GUILD_PATH_DISPLAY');

      if (!wrapper) return null;

      const input = wrapper.querySelector('input');

      return input?.value ?? '';
    },
    clickDirectoryBrowserSelect: async (): Promise<void> => {
      await directoryBrowserProxy.clickSelect();
    },
    clickDirectoryBrowserCancel: async (): Promise<void> => {
      await directoryBrowserProxy.clickCancel();
    },
    clickDirectoryBrowserGoUp: async (): Promise<void> => {
      await directoryBrowserProxy.clickGoUp();
    },
    getDirectoryBrowserCurrentPath: (): HTMLElement['textContent'] =>
      directoryBrowserProxy.getCurrentPath(),
  };
};
