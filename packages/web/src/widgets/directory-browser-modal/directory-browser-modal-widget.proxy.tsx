import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { DirectoryEntryStub } from '@dungeonmaster/shared/contracts';

import { useDirectoryBrowserBindingProxy } from '../../bindings/use-directory-browser/use-directory-browser-binding.proxy';

type DirectoryEntry = ReturnType<typeof DirectoryEntryStub>;

export const DirectoryBrowserModalWidgetProxy = (): {
  setupEntries: (params: { entries: DirectoryEntry[] }) => void;
  setupError: () => void;
  clickGoUp: () => Promise<void>;
  clickSelect: () => Promise<void>;
  clickCancel: () => Promise<void>;
  clickDirectoryEntry: (params: { name: string }) => Promise<void>;
  getCurrentPath: () => HTMLElement['textContent'];
  isGoUpDisabled: () => boolean;
} => {
  const browserProxy = useDirectoryBrowserBindingProxy();

  return {
    setupEntries: ({ entries }: { entries: DirectoryEntry[] }): void => {
      browserProxy.setupEntries({ entries });
    },
    setupError: (): void => {
      browserProxy.setupError();
    },
    clickGoUp: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('GO_UP_BUTTON'));
    },
    clickSelect: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('SELECT_DIRECTORY_BUTTON'));
    },
    clickCancel: async (): Promise<void> => {
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    },
    clickDirectoryEntry: async ({ name }: { name: string }): Promise<void> => {
      await userEvent.click(screen.getByTestId(`DIR_ENTRY_${name}`));
    },
    getCurrentPath: (): HTMLElement['textContent'] => {
      const element = screen.queryByTestId('CURRENT_PATH_DISPLAY');
      return element?.textContent ?? null;
    },
    isGoUpDisabled: (): boolean => {
      const button = screen.getByTestId('GO_UP_BUTTON');
      return button.hasAttribute('disabled') || button.getAttribute('data-disabled') === 'true';
    },
  };
};
