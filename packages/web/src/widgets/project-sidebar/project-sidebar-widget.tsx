/**
 * PURPOSE: Left navbar content showing project tree with nested quests
 *
 * USAGE:
 * <ProjectSidebarWidget projects={projects} selectedProjectId={id} selectedQuestId={questId} onSelectProject={fn} onSelectQuest={fn} onAddProject={fn} />
 * // Renders project tree with nested quest links, add project button, and broken project warnings
 */

import { Button, NavLink, Stack } from '@mantine/core';

import type { ProjectId, ProjectListItem, QuestId } from '@dungeonmaster/shared/contracts';

export interface ProjectSidebarWidgetProps {
  projects: ProjectListItem[];
  selectedProjectId: ProjectId | null;
  selectedQuestId: QuestId | null;
  onSelectProject: (params: { id: ProjectId }) => void;
  onSelectQuest: (params: { id: QuestId }) => void;
  onAddProject: () => void;
}

export const ProjectSidebarWidget = ({
  projects,
  selectedProjectId,
  selectedQuestId,
  onSelectProject,
  onSelectQuest: _onSelectQuest,
  onAddProject,
}: ProjectSidebarWidgetProps): React.JSX.Element => (
  <Stack gap="xs">
    <Button variant="light" fullWidth onClick={onAddProject} data-testid="ADD_PROJECT_BUTTON">
      Add Project
    </Button>
    {projects.map((project) => (
      <NavLink
        key={project.id}
        label={project.name}
        active={selectedProjectId === project.id && selectedQuestId === null}
        opened
        {...(!project.valid && { color: 'orange' })}
        data-testid={`PROJECT_${project.id}`}
        onClick={() => {
          onSelectProject({ id: project.id });
        }}
      />
    ))}
  </Stack>
);
