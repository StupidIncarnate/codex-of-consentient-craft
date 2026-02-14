import { screen, waitFor } from '@testing-library/react';
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
  describe('empty state', () => {
    it('VALID: {no projects} => shows NEW GUILD form', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupProjects({ projects: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(true);
      });

      expect(proxy.isNewGuildTitleVisible()).toBe(true);
    });
  });

  describe('guild list view', () => {
    it('VALID: {projects loaded} => shows guild items', async () => {
      const proxy = AppWidgetProxy();
      const project = ProjectListItemStub({ name: 'Project One' });
      const projects = [project];

      proxy.setupProjects({ projects });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${project.id}` })).toBe(true);
      });

      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${project.id}` })).toBe(true);
    });

    it('VALID: {no project selected} => shows select a guild message', async () => {
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
        expect(screen.getByText('Select a guild')).toBeInTheDocument();
      });

      expect(screen.getByText('Select a guild')).toBeInTheDocument();
    });
  });

  describe('quest list view', () => {
    it('VALID: {project selected, quests loaded} => shows quest list', async () => {
      const proxy = AppWidgetProxy();
      const project = ProjectListItemStub({ name: 'My Project' });
      const projects = [project];
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
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${project.id}` })).toBe(true);
      });

      proxy.setupQuests({ quests });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickGuildItem({ testId: `GUILD_ITEM_${project.id}` });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(screen.getByText('First Quest')).toBeInTheDocument();
      });

      expect(screen.getByText('Second Quest')).toBeInTheDocument();
    });
  });

  describe('execution', () => {
    it('VALID: {start quest execution} => starts execution and refreshes quest detail', async () => {
      const proxy = AppWidgetProxy();
      const processId = ProcessIdStub({ value: 'proc-123' });
      const status = OrchestrationStatusStub({ processId, phase: 'codeweaver' });
      const project = ProjectListItemStub({ name: 'My Project' });
      const projects = [project];
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
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${project.id}` })).toBe(true);
      });

      proxy.setupQuests({ quests });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickGuildItem({ testId: `GUILD_ITEM_${project.id}` });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(screen.getByText('My Quest')).toBeInTheDocument();
      });

      proxy.setupQuestDetail({ quest });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          screen.getByText('My Quest').click();
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
          screen.getByText('Start Quest').click();
          await Promise.resolve();
        },
      });

      expect(screen.getByRole('heading', { name: 'My Quest' })).toBeInTheDocument();
    });
  });
});
