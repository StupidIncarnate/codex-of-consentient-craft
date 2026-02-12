import { screen, within } from '@testing-library/react';
import { QuestListItemStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { testingLibraryActAsyncAdapter } from '../../adapters/testing-library/act-async/testing-library-act-async-adapter';
import { AppWidget } from './app-widget';
import { AppWidgetProxy } from './app-widget.proxy';

describe('AppWidget', () => {
  describe('initial render', () => {
    it('VALID: {} => renders Dungeonmaster title', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupQuests({ quests: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      expect(screen.getByText('Dungeonmaster')).toBeInTheDocument();
    });

    it('VALID: {} => renders Quests nav link', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupQuests({ quests: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      const nav = screen.getByRole('navigation');

      expect(within(nav).getByText('Quests')).toBeInTheDocument();
    });
  });

  describe('quest list view', () => {
    it('VALID: {quests loaded} => shows quest list by default', async () => {
      const proxy = AppWidgetProxy();
      const quests = [
        QuestListItemStub({ id: 'quest-1', title: 'First Quest' }),
        QuestListItemStub({ id: 'quest-2', title: 'Second Quest' }),
      ];

      proxy.setupQuests({ quests });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      expect(screen.getByText('First Quest')).toBeInTheDocument();
      expect(screen.getByText('Second Quest')).toBeInTheDocument();
    });

    it('EMPTY: {no quests} => shows empty state', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupQuests({ quests: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      expect(
        screen.getByText('No quests found. Create a quest to get started.'),
      ).toBeInTheDocument();
    });
  });
});
