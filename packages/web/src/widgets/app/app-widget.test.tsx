import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import {
  OrchestrationStatusStub,
  ProcessIdStub,
  ProjectListItemStub,
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

      proxy.setupProjects({ projects: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      expect(screen.getByText('Dungeonmaster')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('VALID: {no projects} => shows welcome empty state', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupProjects({ projects: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isWelcomeVisible()).toBe(true);
      });
    });
  });

  describe('project sidebar', () => {
    it('VALID: {projects loaded} => shows projects in sidebar', async () => {
      const proxy = AppWidgetProxy();
      const projects = [
        ProjectListItemStub({ name: 'Project One' }),
        ProjectListItemStub({ name: 'Project Two' }),
      ];

      proxy.setupProjects({ projects });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        const nav = screen.getByRole('navigation');

        expect(within(nav).getByText('Project One')).toBeInTheDocument();
      });

      const nav = screen.getByRole('navigation');

      expect(within(nav).getByText('Project Two')).toBeInTheDocument();
    });

    it('VALID: {projects loaded} => shows Add Project button in sidebar', async () => {
      const proxy = AppWidgetProxy();
      const projects = [ProjectListItemStub({ name: 'My Project' })];

      proxy.setupProjects({ projects });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('ADD_PROJECT_BUTTON')).toBeInTheDocument();
      });
    });
  });

  describe('quest list view', () => {
    it('VALID: {project selected, quests loaded} => shows quest list', async () => {
      const proxy = AppWidgetProxy();
      const projects = [ProjectListItemStub({ name: 'My Project' })];
      const quests = [
        QuestListItemStub({ id: 'quest-1', title: 'First Quest' }),
        QuestListItemStub({ id: 'quest-2', title: 'Second Quest' }),
      ];

      proxy.setupProjects({ projects });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(screen.getByText('My Project')).toBeInTheDocument();
      });

      proxy.setupQuests({ quests });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickProject({ name: 'My Project' });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(screen.getByText('First Quest')).toBeInTheDocument();
      });

      expect(screen.getByText('Second Quest')).toBeInTheDocument();
    });
  });

  describe('navigation between views', () => {
    it('VALID: {click quest row} => navigates to detail view', async () => {
      const proxy = AppWidgetProxy();
      const projects = [ProjectListItemStub({ name: 'My Project' })];
      const quest = QuestStub({ id: 'quest-1', title: 'My Quest' });
      const quests = [QuestListItemStub({ id: 'quest-1', title: 'My Quest' })];

      proxy.setupProjects({ projects });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(screen.getByText('My Project')).toBeInTheDocument();
      });

      proxy.setupQuests({ quests });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickProject({ name: 'My Project' });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(screen.getByText('My Quest')).toBeInTheDocument();
      });

      proxy.setupQuestDetail({ quest });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          fireEvent.click(screen.getByText('My Quest'));
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Back to list')).toBeInTheDocument();
      });
    });

    it('VALID: {in detail view, click back} => returns to list view', async () => {
      const proxy = AppWidgetProxy();
      const projects = [ProjectListItemStub({ name: 'My Project' })];
      const quest = QuestStub({ id: 'quest-1', title: 'My Quest' });
      const quests = [QuestListItemStub({ id: 'quest-1', title: 'My Quest' })];

      proxy.setupProjects({ projects });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(screen.getByText('My Project')).toBeInTheDocument();
      });

      proxy.setupQuests({ quests });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickProject({ name: 'My Project' });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(screen.getByText('My Quest')).toBeInTheDocument();
      });

      proxy.setupQuestDetail({ quest });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          fireEvent.click(screen.getByText('My Quest'));
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Back to list')).toBeInTheDocument();
      });

      proxy.setupQuests({ quests: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          fireEvent.click(screen.getByText('Back to list'));
          await Promise.resolve();
        },
      });

      expect(screen.queryByText('Back to list')).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Quests' })).toBeInTheDocument();
    });
  });

  describe('error states', () => {
    it('ERROR: {quest list fetch fails} => shows error alert in list view', async () => {
      const proxy = AppWidgetProxy();
      const projects = [ProjectListItemStub({ name: 'My Project' })];

      proxy.setupProjects({ projects });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(screen.getByText('My Project')).toBeInTheDocument();
      });

      proxy.setupQuestsError({ error: new Error('Network failure') });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickProject({ name: 'My Project' });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Network failure')).toBeInTheDocument();
      });
    });
  });

  describe('execution', () => {
    it('VALID: {start quest execution} => starts execution and refreshes quest detail', async () => {
      const proxy = AppWidgetProxy();
      const processId = ProcessIdStub({ value: 'proc-123' });
      const status = OrchestrationStatusStub({ processId, phase: 'codeweaver' });
      const projects = [ProjectListItemStub({ name: 'My Project' })];
      const quest = QuestStub({ id: 'quest-1', title: 'My Quest' });
      const quests = [QuestListItemStub({ id: 'quest-1', title: 'My Quest' })];

      proxy.setupProjects({ projects });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(screen.getByText('My Project')).toBeInTheDocument();
      });

      proxy.setupQuests({ quests });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickProject({ name: 'My Project' });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(screen.getByText('My Quest')).toBeInTheDocument();
      });

      proxy.setupQuestDetail({ quest });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          fireEvent.click(screen.getByText('My Quest'));
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Start Quest')).toBeInTheDocument();
      });

      proxy.setupExecutionStart({ processId });
      proxy.setupExecutionStatus({ status });
      proxy.setupQuestDetail({ quest });

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
