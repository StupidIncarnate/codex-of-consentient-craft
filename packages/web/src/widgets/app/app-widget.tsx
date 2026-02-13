/**
 * PURPOSE: Root application layout managing project selection, quest list, and quest detail views
 *
 * USAGE:
 * <AppWidget />
 * // Renders the full Dungeonmaster web UI with project sidebar, quest views, and project management modals
 */

import { useState } from 'react';

import { AppShell, Container, NavLink, Text, Title } from '@mantine/core';

import type { ProjectId, ProjectName, ProjectPath, QuestId } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';

import { useAgentOutputBinding } from '../../bindings/use-agent-output/use-agent-output-binding';
import { useExecutionBinding } from '../../bindings/use-execution/use-execution-binding';
import { useProjectsBinding } from '../../bindings/use-projects/use-projects-binding';
import { useQuestDetailBinding } from '../../bindings/use-quest-detail/use-quest-detail-binding';
import { useQuestsBinding } from '../../bindings/use-quests/use-quests-binding';
import { projectCreateBroker } from '../../brokers/project/create/project-create-broker';
import { ProjectAddModalWidget } from '../project-add-modal/project-add-modal-widget';
import { ProjectEmptyStateWidget } from '../project-empty-state/project-empty-state-widget';
import { ProjectSidebarWidget } from '../project-sidebar/project-sidebar-widget';
import { QuestDetailWidget } from '../quest-detail/quest-detail-widget';
import { QuestListWidget } from '../quest-list/quest-list-widget';

type View = 'list' | 'detail';

export const AppWidget = (): React.JSX.Element => {
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedProjectId, setSelectedProjectId] = useState<ProjectId | null>(null);
  const [selectedQuestId, setSelectedQuestId] = useState<QuestId | null>(null);
  const [addProjectModalOpened, setAddProjectModalOpened] = useState(false);

  const { projects, loading: projectsLoading, refresh: refreshProjects } = useProjectsBinding();

  const {
    data: quests,
    loading: questsLoading,
    error: questsError,
    refresh,
  } = useQuestsBinding({ projectId: selectedProjectId });

  const {
    data: quest,
    loading: questLoading,
    error: questError,
    refresh: refreshQuest,
  } = useQuestDetailBinding({
    questId: currentView === 'detail' ? selectedQuestId : null,
  });

  const {
    processStatus,
    isRunning,
    error: executionError,
    startExecution,
    slotOutputs: executionSlotOutputs,
  } = useExecutionBinding();

  const { slotOutputs: agentSlotOutputs } = useAgentOutputBinding();

  const hasProjects = projects.length > 0;

  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 280, breakpoint: 'sm' }} padding="md">
      <AppShell.Header
        style={{
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 16,
        }}
      >
        <Title order={3}>Dungeonmaster</Title>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        {hasProjects ? (
          <>
            <ProjectSidebarWidget
              projects={projects}
              selectedProjectId={selectedProjectId}
              selectedQuestId={selectedQuestId}
              onSelectProject={({ id }) => {
                setSelectedProjectId(id);
                setSelectedQuestId(null);
                setCurrentView('list');
              }}
              onSelectQuest={({ id }) => {
                setSelectedQuestId(id);
                setCurrentView('detail');
              }}
              onAddProject={() => {
                setAddProjectModalOpened(true);
              }}
            />
            {selectedQuestId && quest && (
              <NavLink
                label={quest.title}
                active={currentView === 'detail'}
                onClick={() => {
                  setCurrentView('detail');
                }}
                style={{ paddingLeft: 24 }}
              />
            )}
          </>
        ) : (
          !projectsLoading && <NavLink label="No projects" disabled />
        )}
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="lg">
          {!hasProjects && !projectsLoading ? (
            <ProjectEmptyStateWidget
              onAddProject={() => {
                setAddProjectModalOpened(true);
              }}
            />
          ) : (
            <>
              {currentView === 'list' && !selectedProjectId && (
                <Text c="dimmed" ta="center" p="xl">
                  Select a project from the sidebar to view its quests.
                </Text>
              )}
              {currentView === 'list' && selectedProjectId && (
                <QuestListWidget
                  projectId={selectedProjectId}
                  quests={quests}
                  loading={questsLoading}
                  error={questsError ? errorMessageContract.parse(questsError.message) : null}
                  onRefresh={() => {
                    refresh().catch(() => undefined);
                  }}
                  onSelectQuest={({ questId }) => {
                    setSelectedQuestId(questId);
                    setCurrentView('detail');
                  }}
                />
              )}
              {currentView === 'detail' && (
                <QuestDetailWidget
                  quest={quest}
                  loading={questLoading}
                  error={questError ?? executionError}
                  onBack={() => {
                    setCurrentView('list');
                    setSelectedQuestId(null);
                    refresh().catch(() => undefined);
                  }}
                  onStartQuest={({ questId }) => {
                    startExecution({ questId })
                      .then(async () => refreshQuest())
                      .catch(() => undefined);
                  }}
                  isRunning={isRunning}
                  processStatus={processStatus}
                  slotOutputs={
                    executionSlotOutputs.size > 0 ? executionSlotOutputs : agentSlotOutputs
                  }
                />
              )}
            </>
          )}
        </Container>
      </AppShell.Main>

      <ProjectAddModalWidget
        opened={addProjectModalOpened}
        onClose={() => {
          setAddProjectModalOpened(false);
        }}
        onSubmit={({ name, path }: { name: ProjectName; path: ProjectPath }) => {
          projectCreateBroker({ name: String(name), path: String(path) })
            .then(async ({ id }) => {
              setAddProjectModalOpened(false);
              await refreshProjects();
              setSelectedProjectId(id);
            })
            .catch(() => undefined);
        }}
      />
    </AppShell>
  );
};
