import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DirectoryBrowserModalWidgetProxy } from '../directory-browser-modal/directory-browser-modal-widget.proxy';

export const ProjectAddModalWidgetProxy = (): {
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
      const input = screen.getByTestId('PROJECT_NAME_INPUT');
      await userEvent.clear(input);
      await userEvent.type(input, name);
    },
    clickBrowse: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('BROWSE_BUTTON'));
    },
    clickCreate: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('CREATE_PROJECT_BUTTON'));
    },
    clickCancel: async (): Promise<void> => {
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    },
    isCreateDisabled: (): boolean => {
      const button = screen.getByTestId('CREATE_PROJECT_BUTTON');
      return button.hasAttribute('disabled') || button.getAttribute('data-disabled') === 'true';
    },
    getPathDisplay: (): HTMLElement['textContent'] => {
      const element = screen.queryByTestId('PROJECT_PATH_DISPLAY');
      return element?.textContent ?? null;
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
