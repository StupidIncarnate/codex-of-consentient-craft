import { fireEvent, screen, within } from '@testing-library/react';
import {
  OrchestrationStatusStub,
  ProcessIdStub,
  QuestListItemStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

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

  describe('navigation between views', () => {
    it('VALID: {click quest row} => navigates to detail view', async () => {
      const proxy = AppWidgetProxy();
      const quest = QuestStub({ id: 'quest-1', title: 'My Quest' });
      const quests = [QuestListItemStub({ id: 'quest-1', title: 'My Quest' })];

      proxy.setupQuests({ quests });
      proxy.setupQuestDetail({ quest });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          fireEvent.click(screen.getByText('My Quest'));
          await Promise.resolve();
        },
      });

      expect(screen.getByText('Back to list')).toBeInTheDocument();
    });

    it('VALID: {detail view with quest} => renders QuestDetailWidget', async () => {
      const proxy = AppWidgetProxy();
      const quest = QuestStub({ id: 'quest-1', title: 'My Quest' });
      const quests = [QuestListItemStub({ id: 'quest-1', title: 'My Quest' })];

      proxy.setupQuests({ quests });
      proxy.setupQuestDetail({ quest });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          fireEvent.click(screen.getByText('My Quest'));
          await Promise.resolve();
        },
      });

      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Requirements/u })).toBeInTheDocument();
    });

    it('VALID: {in detail view, click back} => returns to list view and refreshes', async () => {
      const proxy = AppWidgetProxy();
      const quest = QuestStub({ id: 'quest-1', title: 'My Quest' });
      const quests = [QuestListItemStub({ id: 'quest-1', title: 'My Quest' })];

      proxy.setupQuests({ quests });
      proxy.setupQuestDetail({ quest });
      proxy.setupQuests({ quests: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          fireEvent.click(screen.getByText('My Quest'));
          await Promise.resolve();
        },
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          fireEvent.click(screen.getByText('Back to list'));
          await Promise.resolve();
        },
      });

      expect(screen.queryByText('Back to list')).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Quests' })).toBeInTheDocument();
    });

    it('VALID: {quest selected and loaded} => shows quest title in navbar', async () => {
      const proxy = AppWidgetProxy();
      const quest = QuestStub({ id: 'quest-1', title: 'My Quest' });
      const quests = [QuestListItemStub({ id: 'quest-1', title: 'My Quest' })];

      proxy.setupQuests({ quests });
      proxy.setupQuestDetail({ quest });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          fireEvent.click(screen.getByText('My Quest'));
          await Promise.resolve();
        },
      });

      const nav = screen.getByRole('navigation');

      expect(within(nav).getByText('My Quest')).toBeInTheDocument();
    });

    it('VALID: {click Quests nav link} => returns to list view', async () => {
      const proxy = AppWidgetProxy();
      const quest = QuestStub({ id: 'quest-1', title: 'My Quest' });
      const quests = [QuestListItemStub({ id: 'quest-1', title: 'My Quest' })];

      proxy.setupQuests({ quests });
      proxy.setupQuestDetail({ quest });
      proxy.setupQuests({ quests: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          fireEvent.click(screen.getByText('My Quest'));
          await Promise.resolve();
        },
      });

      const nav = screen.getByRole('navigation');

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          fireEvent.click(within(nav).getByText('Quests'));
          await Promise.resolve();
        },
      });

      expect(screen.queryByText('Back to list')).not.toBeInTheDocument();
      expect(
        screen.getByText('No quests found. Create a quest to get started.'),
      ).toBeInTheDocument();
    });
  });

  describe('error states', () => {
    it('ERROR: {quest list fetch fails} => shows error alert in list view', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupQuestsError({ error: new Error('Network failure') });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      expect(screen.getByText('Network failure')).toBeInTheDocument();
    });

    it('ERROR: {quest detail fetch fails} => shows error in detail view', async () => {
      const proxy = AppWidgetProxy();
      const quests = [QuestListItemStub({ id: 'quest-1', title: 'My Quest' })];

      proxy.setupQuests({ quests });
      proxy.setupQuestDetailError({ error: new Error('Quest not found') });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          fireEvent.click(screen.getByText('My Quest'));
          await Promise.resolve();
        },
      });

      expect(screen.getByText('Quest not found')).toBeInTheDocument();
    });

    it('ERROR: {execution fails} => shows execution error in detail view', async () => {
      const proxy = AppWidgetProxy();
      const processId = ProcessIdStub({ value: 'proc-123' });
      const quest = QuestStub({ id: 'quest-1', title: 'My Quest' });
      const quests = [QuestListItemStub({ id: 'quest-1', title: 'My Quest' })];

      proxy.setupQuests({ quests });
      proxy.setupQuestDetail({ quest });
      proxy.setupExecutionStart({ processId });
      proxy.setupExecutionStatusError({ error: new Error('Execution failed') });
      proxy.setupQuestDetail({ quest });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          fireEvent.click(screen.getByText('My Quest'));
          await Promise.resolve();
        },
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          fireEvent.click(screen.getByText('Start Quest'));
          await Promise.resolve();
        },
      });

      expect(screen.getByText('Execution failed')).toBeInTheDocument();
    });

    it('ERROR: {both quest and execution errors} => shows questError (first in ?? chain)', async () => {
      const proxy = AppWidgetProxy();
      const quests = [QuestListItemStub({ id: 'quest-1', title: 'My Quest' })];

      proxy.setupQuests({ quests });
      proxy.setupQuestDetailError({ error: new Error('Quest load error') });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          fireEvent.click(screen.getByText('My Quest'));
          await Promise.resolve();
        },
      });

      expect(screen.getByText('Quest load error')).toBeInTheDocument();
    });
  });

  describe('slot outputs and execution', () => {
    it('VALID: {executionSlotOutputs has entries} => passes executionSlotOutputs to detail', async () => {
      const proxy = AppWidgetProxy();
      const processId = ProcessIdStub({ value: 'proc-123' });
      const status = OrchestrationStatusStub({ processId, phase: 'codeweaver' });
      const quest = QuestStub({ id: 'quest-1', title: 'My Quest' });
      const quests = [QuestListItemStub({ id: 'quest-1', title: 'My Quest' })];

      proxy.setupQuests({ quests });
      proxy.setupQuestDetail({ quest });
      proxy.setupExecutionStart({ processId });
      proxy.setupExecutionStatus({ status });
      proxy.setupQuestDetail({ quest });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          fireEvent.click(screen.getByText('My Quest'));
          await Promise.resolve();
        },
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          fireEvent.click(screen.getByText('Start Quest'));
          await Promise.resolve();
        },
      });

      expect(screen.getByText('Back to list')).toBeInTheDocument();
    });

    it('VALID: {executionSlotOutputs empty} => passes agentSlotOutputs to detail', async () => {
      const proxy = AppWidgetProxy();
      const quest = QuestStub({ id: 'quest-1', title: 'My Quest' });
      const quests = [QuestListItemStub({ id: 'quest-1', title: 'My Quest' })];

      proxy.setupQuests({ quests });
      proxy.setupQuestDetail({ quest });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          fireEvent.click(screen.getByText('My Quest'));
          await Promise.resolve();
        },
      });

      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'My Quest' })).toBeInTheDocument();
    });

    it('VALID: {start quest execution} => starts execution and refreshes quest detail', async () => {
      const proxy = AppWidgetProxy();
      const processId = ProcessIdStub({ value: 'proc-123' });
      const status = OrchestrationStatusStub({ processId, phase: 'codeweaver' });
      const quest = QuestStub({ id: 'quest-1', title: 'My Quest' });
      const quests = [QuestListItemStub({ id: 'quest-1', title: 'My Quest' })];

      proxy.setupQuests({ quests });
      proxy.setupQuestDetail({ quest });
      proxy.setupExecutionStart({ processId });
      proxy.setupExecutionStatus({ status });
      proxy.setupQuestDetail({ quest });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          fireEvent.click(screen.getByText('My Quest'));
          await Promise.resolve();
        },
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          fireEvent.click(screen.getByText('Start Quest'));
          await Promise.resolve();
        },
      });

      expect(screen.getByRole('heading', { name: 'My Quest' })).toBeInTheDocument();
    });
  });
});
