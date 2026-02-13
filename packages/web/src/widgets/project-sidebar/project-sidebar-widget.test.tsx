import { screen } from '@testing-library/react';
import { ProjectIdStub, ProjectListItemStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ProjectSidebarWidget } from './project-sidebar-widget';
import { ProjectSidebarWidgetProxy } from './project-sidebar-widget.proxy';

describe('ProjectSidebarWidget', () => {
  describe('with projects', () => {
    it('VALID: {projects} => renders project names', () => {
      ProjectSidebarWidgetProxy();
      const projects = [
        ProjectListItemStub({
          id: ProjectIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567801' }),
          name: 'Project Alpha',
          valid: true,
          questCount: 2,
        }),
        ProjectListItemStub({
          id: ProjectIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567802' }),
          name: 'Project Beta',
          valid: true,
          questCount: 0,
        }),
      ];

      mantineRenderAdapter({
        ui: (
          <ProjectSidebarWidget
            projects={projects}
            selectedProjectId={null}
            selectedQuestId={null}
            onSelectProject={jest.fn()}
            onSelectQuest={jest.fn()}
            onAddProject={jest.fn()}
          />
        ),
      });

      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
    });

    it('VALID: {click project} => calls onSelectProject with project id', async () => {
      const proxy = ProjectSidebarWidgetProxy();
      const projectId = ProjectIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567801' });
      const projects = [ProjectListItemStub({ id: projectId, name: 'Project Alpha', valid: true })];
      const onSelectProject = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ProjectSidebarWidget
            projects={projects}
            selectedProjectId={null}
            selectedQuestId={null}
            onSelectProject={onSelectProject}
            onSelectQuest={jest.fn()}
            onAddProject={jest.fn()}
          />
        ),
      });

      await proxy.clickProject({ name: 'Project Alpha' });

      expect(onSelectProject).toHaveBeenCalledWith({ id: projectId });
    });

    it('VALID: {broken project} => renders with orange color', () => {
      ProjectSidebarWidgetProxy();
      const projects = [
        ProjectListItemStub({
          id: ProjectIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567801' }),
          name: 'Broken Project',
          valid: false,
        }),
      ];

      mantineRenderAdapter({
        ui: (
          <ProjectSidebarWidget
            projects={projects}
            selectedProjectId={null}
            selectedQuestId={null}
            onSelectProject={jest.fn()}
            onSelectQuest={jest.fn()}
            onAddProject={jest.fn()}
          />
        ),
      });

      expect(screen.getByText('Broken Project')).toBeInTheDocument();
    });

    it('VALID: {valid project} => renders without orange color attribute', () => {
      ProjectSidebarWidgetProxy();
      const projects = [
        ProjectListItemStub({
          id: ProjectIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567801' }),
          name: 'Valid Project',
          valid: true,
        }),
      ];

      mantineRenderAdapter({
        ui: (
          <ProjectSidebarWidget
            projects={projects}
            selectedProjectId={null}
            selectedQuestId={null}
            onSelectProject={jest.fn()}
            onSelectQuest={jest.fn()}
            onAddProject={jest.fn()}
          />
        ),
      });

      expect(screen.getByText('Valid Project')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('EMPTY: {no projects} => renders only Add Project button', () => {
      ProjectSidebarWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ProjectSidebarWidget
            projects={[]}
            selectedProjectId={null}
            selectedQuestId={null}
            onSelectProject={jest.fn()}
            onSelectQuest={jest.fn()}
            onAddProject={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('ADD_PROJECT_BUTTON')).toBeInTheDocument();
    });
  });

  describe('add project button', () => {
    it('VALID: {click Add Project} => calls onAddProject', async () => {
      const proxy = ProjectSidebarWidgetProxy();
      const onAddProject = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ProjectSidebarWidget
            projects={[]}
            selectedProjectId={null}
            selectedQuestId={null}
            onSelectProject={jest.fn()}
            onSelectQuest={jest.fn()}
            onAddProject={onAddProject}
          />
        ),
      });

      await proxy.clickAddProject();

      expect(onAddProject).toHaveBeenCalledTimes(1);
    });
  });

  describe('selection state', () => {
    it('VALID: {selectedProjectId matches, no selectedQuestId} => project is active', () => {
      ProjectSidebarWidgetProxy();
      const projectId = ProjectIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567801' });
      const projects = [
        ProjectListItemStub({ id: projectId, name: 'Selected Project', valid: true }),
      ];

      mantineRenderAdapter({
        ui: (
          <ProjectSidebarWidget
            projects={projects}
            selectedProjectId={projectId}
            selectedQuestId={null}
            onSelectProject={jest.fn()}
            onSelectQuest={jest.fn()}
            onAddProject={jest.fn()}
          />
        ),
      });

      expect(screen.getByText('Selected Project')).toBeInTheDocument();
    });

    it('VALID: {selectedProjectId matches, selectedQuestId set} => project is not active', () => {
      ProjectSidebarWidgetProxy();
      const projectId = ProjectIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567801' });
      const questId = QuestIdStub({ value: 'quest-1' });
      const projects = [ProjectListItemStub({ id: projectId, name: 'With Quest', valid: true })];

      mantineRenderAdapter({
        ui: (
          <ProjectSidebarWidget
            projects={projects}
            selectedProjectId={projectId}
            selectedQuestId={questId}
            onSelectProject={jest.fn()}
            onSelectQuest={jest.fn()}
            onAddProject={jest.fn()}
          />
        ),
      });

      expect(screen.getByText('With Quest')).toBeInTheDocument();
    });
  });
});
