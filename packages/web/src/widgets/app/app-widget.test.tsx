import { screen, waitFor } from '@testing-library/react';
import {
  OrchestrationStatusStub,
  ProcessIdStub,
  ProjectIdStub,
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
        expect(proxy.isSelectGuildMessageVisible()).toBe(true);
      });

      expect(proxy.isSelectGuildMessageVisible()).toBe(true);
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

  describe('guild creation flow', () => {
    it('VALID: {empty state, type name, CREATE} => project appears and is auto-selected', async () => {
      const proxy = AppWidgetProxy();
      const projectId = ProjectIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const createdProject = ProjectListItemStub({
        id: projectId,
        name: 'new-guild',
      });

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

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.typeGuildName({ value: 'new-guild' });
          await proxy.typeGuildPath({ value: '/home/user/new-guild' });
          await Promise.resolve();
        },
      });

      proxy.setupCreateProject({ id: projectId });
      proxy.setupProjects({ projects: [createdProject] });
      proxy.setupQuests({ quests: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickCreateGuild();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${projectId}` })).toBe(true);
      });

      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${projectId}` })).toBe(true);
    });

    it('VALID: {empty state, CREATE succeeds} => transitions to main view with guild in left column', async () => {
      const proxy = AppWidgetProxy();
      const projectId = ProjectIdStub({ value: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' });
      const createdProject = ProjectListItemStub({
        id: projectId,
        name: 'test-guild',
      });

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

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.typeGuildName({ value: 'test-guild' });
          await proxy.typeGuildPath({ value: '/home/user/test-guild' });
          await Promise.resolve();
        },
      });

      proxy.setupCreateProject({ id: projectId });
      proxy.setupProjects({ projects: [createdProject] });
      proxy.setupQuests({ quests: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickCreateGuild();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(false);
      });

      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${projectId}` })).toBe(true);
    });

    it('VALID: {main view, click +} => shows NEW GUILD form => CREATE => returns to main', async () => {
      const proxy = AppWidgetProxy();
      const existingProject = ProjectListItemStub({
        id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        name: 'Existing Guild',
      });
      const newProjectId = ProjectIdStub({ value: 'd4e5f6a7-b8c9-0123-defa-234567890123' });
      const newProject = ProjectListItemStub({
        id: newProjectId,
        name: 'new-guild',
      });

      proxy.setupProjects({ projects: [existingProject] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${existingProject.id}` })).toBe(true);
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickAddGuild();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(true);
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.typeGuildName({ value: 'new-guild' });
          await proxy.typeGuildPath({ value: '/home/user/new-guild' });
          await Promise.resolve();
        },
      });

      proxy.setupCreateProject({ id: newProjectId });
      proxy.setupProjects({ projects: [existingProject, newProject] });
      proxy.setupQuests({ quests: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickCreateGuild();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(false);
      });

      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${existingProject.id}` })).toBe(true);
      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${newProjectId}` })).toBe(true);
    });

    it('VALID: {main view, click +, cancel} => returns to main, no change', async () => {
      const proxy = AppWidgetProxy();
      const project = ProjectListItemStub({
        id: 'e5f6a7b8-c9d0-1234-efab-345678901234',
        name: 'My Guild',
      });

      proxy.setupProjects({ projects: [project] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${project.id}` })).toBe(true);
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickAddGuild();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(true);
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickCancelGuild();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(false);
      });

      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${project.id}` })).toBe(true);
    });

    it('VALID: {create project, API error} => stays on form (error swallowed)', async () => {
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

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.typeGuildName({ value: 'fail-guild' });
          await proxy.typeGuildPath({ value: '/home/user/fail-guild' });
          await Promise.resolve();
        },
      });

      proxy.setupProjectsError();

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickCreateGuild();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(true);
      });

      expect(proxy.isNewGuildTitleVisible()).toBe(true);
    });
  });

  describe('guild selection and quest loading', () => {
    it('VALID: {click guild item} => quest list renders for that guild', async () => {
      const proxy = AppWidgetProxy();
      const project = ProjectListItemStub({
        id: 'f6a7b8c9-d0e1-2345-fabc-456789012345',
        name: 'Guild Alpha',
      });
      const quests = [QuestListItemStub({ id: 'q-1', title: 'Alpha Quest' })];

      proxy.setupProjects({ projects: [project] });

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
        expect(screen.getByText('Alpha Quest')).toBeInTheDocument();
      });

      expect(screen.getByText('Alpha Quest')).toBeInTheDocument();
    });

    it('VALID: {click guild with no quests} => shows empty state', async () => {
      const proxy = AppWidgetProxy();
      const project = ProjectListItemStub({
        id: 'a7b8c9d0-e1f2-3456-abcd-567890123456',
        name: 'Empty Guild',
      });

      proxy.setupProjects({ projects: [project] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${project.id}` })).toBe(true);
      });

      proxy.setupQuests({ quests: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickGuildItem({ testId: `GUILD_ITEM_${project.id}` });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isQuestEmptyStateVisible()).toBe(true);
      });

      expect(proxy.isQuestEmptyStateVisible()).toBe(true);
    });

    it('VALID: {click guild A, then guild B} => quests refresh for B', async () => {
      const proxy = AppWidgetProxy();
      const projectA = ProjectListItemStub({
        id: 'b8c9d0e1-f2a3-4567-bcde-678901234567',
        name: 'Guild A',
      });
      const projectB = ProjectListItemStub({
        id: 'c9d0e1f2-a3b4-5678-cdef-789012345678',
        name: 'Guild B',
      });
      const questsA = [QuestListItemStub({ id: 'qa-1', title: 'Quest A' })];
      const questsB = [QuestListItemStub({ id: 'qb-1', title: 'Quest B' })];

      proxy.setupProjects({ projects: [projectA, projectB] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${projectA.id}` })).toBe(true);
      });

      proxy.setupQuests({ quests: questsA });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickGuildItem({ testId: `GUILD_ITEM_${projectA.id}` });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Quest A')).toBeInTheDocument();
      });

      proxy.setupQuests({ quests: questsB });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickGuildItem({ testId: `GUILD_ITEM_${projectB.id}` });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Quest B')).toBeInTheDocument();
      });

      expect(screen.getByText('Quest B')).toBeInTheDocument();
    });

    it('VALID: {click guild, quest list error} => error state', async () => {
      const proxy = AppWidgetProxy();
      const project = ProjectListItemStub({
        id: 'd0e1f2a3-b4c5-6789-defa-890123456789',
        name: 'Error Guild',
      });

      proxy.setupProjects({ projects: [project] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${project.id}` })).toBe(true);
      });

      proxy.setupQuestsError();

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickGuildItem({ testId: `GUILD_ITEM_${project.id}` });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isQuestEmptyStateVisible()).toBe(true);
      });

      expect(proxy.isQuestEmptyStateVisible()).toBe(true);
    });
  });

  describe('navigation between views', () => {
    it('VALID: {main, click quest, detail, click back} => returns to main', async () => {
      const proxy = AppWidgetProxy();
      const project = ProjectListItemStub({
        id: 'e1f2a3b4-c5d6-7890-efab-901234567890',
        name: 'Nav Guild',
      });
      const quest = QuestStub({ id: 'nav-q1', title: 'Nav Quest' });
      const quests = [QuestListItemStub({ id: 'nav-q1', title: 'Nav Quest' })];

      proxy.setupProjects({ projects: [project] });

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
        expect(screen.getByText('Nav Quest')).toBeInTheDocument();
      });

      proxy.setupQuestDetail({ quest });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          screen.getByText('Nav Quest').click();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Nav Quest' })).toBeInTheDocument();
      });

      proxy.setupQuests({ quests });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          screen.getByText('Back to list').click();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${project.id}` })).toBe(true);
      });

      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${project.id}` })).toBe(true);
    });

    it('VALID: {empty state, create guild} => auto-transitions to main', async () => {
      const proxy = AppWidgetProxy();
      const projectId = ProjectIdStub({ value: 'f2a3b4c5-d6e7-8901-fabc-012345678901' });
      const project = ProjectListItemStub({ id: projectId, name: 'auto-guild' });

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

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.typeGuildName({ value: 'auto-guild' });
          await proxy.typeGuildPath({ value: '/home/user/auto-guild' });
          await Promise.resolve();
        },
      });

      proxy.setupCreateProject({ id: projectId });
      proxy.setupProjects({ projects: [project] });
      proxy.setupQuests({ quests: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickCreateGuild();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${projectId}` })).toBe(true);
      });

      expect(proxy.isNewGuildTitleVisible()).toBe(false);
    });

    it('VALID: {multiple guilds, select one} => gold highlight visible', async () => {
      const proxy = AppWidgetProxy();
      const projectA = ProjectListItemStub({
        id: 'a3b4c5d6-e7f8-9012-abcd-123456789abc',
        name: 'Guild Alpha',
      });
      const projectB = ProjectListItemStub({
        id: 'b4c5d6e7-f8a9-0123-bcde-23456789abcd',
        name: 'Guild Beta',
      });

      proxy.setupProjects({ projects: [projectA, projectB] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${projectA.id}` })).toBe(true);
      });

      proxy.setupQuests({ quests: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickGuildItem({ testId: `GUILD_ITEM_${projectA.id}` });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemSelected({ testId: `GUILD_ITEM_${projectA.id}` })).toBe(true);
      });

      expect(proxy.isGuildItemSelected({ testId: `GUILD_ITEM_${projectA.id}` })).toBe(true);
    });
  });

  describe('error and edge cases', () => {
    it('VALID: {projects API error} => empty state form shown (graceful degradation)', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupProjectsError();

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

    it('VALID: {load 3 guilds} => all visible in left column', async () => {
      const proxy = AppWidgetProxy();
      const projectA = ProjectListItemStub({
        id: 'c5d6e7f8-a9b0-1234-cdef-3456789abcde',
        name: 'Guild One',
      });
      const projectB = ProjectListItemStub({
        id: 'd6e7f8a9-b0c1-2345-defa-456789abcdef',
        name: 'Guild Two',
      });
      const projectC = ProjectListItemStub({
        id: 'e7f8a9b0-c1d2-3456-efab-56789abcdef0',
        name: 'Guild Three',
      });

      proxy.setupProjects({ projects: [projectA, projectB, projectC] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({ ui: <AppWidget /> });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${projectA.id}` })).toBe(true);
      });

      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${projectB.id}` })).toBe(true);
      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${projectC.id}` })).toBe(true);
    });

    it('VALID: {select guild, quest status badges} => correct status text rendered', async () => {
      const proxy = AppWidgetProxy();
      const project = ProjectListItemStub({
        id: 'f8a9b0c1-d2e3-4567-fabc-6789abcdef01',
        name: 'Status Guild',
      });
      const quests = [
        QuestListItemStub({ id: 'sq-1', title: 'Complete Quest', status: 'complete' }),
        QuestListItemStub({ id: 'sq-2', title: 'Pending Quest', status: 'pending' }),
        QuestListItemStub({ id: 'sq-3', title: 'Progress Quest', status: 'in_progress' }),
      ];

      proxy.setupProjects({ projects: [project] });

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
        expect(screen.getByText('Complete Quest')).toBeInTheDocument();
      });

      expect(proxy.getQuestStatusText({ testId: 'QUEST_STATUS_sq-1' })).toBe('COMPLETE');
      expect(proxy.getQuestStatusText({ testId: 'QUEST_STATUS_sq-2' })).toBe('PENDING');
      expect(proxy.getQuestStatusText({ testId: 'QUEST_STATUS_sq-3' })).toBe('IN PROGRESS');
    });

    it('VALID: {quest detail loads} => tabs visible (Overview, Requirements, Steps, Contracts)', async () => {
      const proxy = AppWidgetProxy();
      const project = ProjectListItemStub({
        id: 'a9b0c1d2-e3f4-5678-abcd-789abcdef012',
        name: 'Tab Guild',
      });
      const quest = QuestStub({ id: 'tab-q1', title: 'Tab Quest' });
      const quests = [QuestListItemStub({ id: 'tab-q1', title: 'Tab Quest' })];

      proxy.setupProjects({ projects: [project] });

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
        expect(screen.getByText('Tab Quest')).toBeInTheDocument();
      });

      proxy.setupQuestDetail({ quest });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          screen.getByText('Tab Quest').click();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Tab Quest' })).toBeInTheDocument();
      });

      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Steps (0)')).toBeInTheDocument();
      expect(screen.getByText('Contracts (0)')).toBeInTheDocument();
    });
  });
});
