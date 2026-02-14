/**
 * PURPOSE: Root application layout managing guild selection, quest list, and quest detail views
 *
 * USAGE:
 * <AppWidget />
 * // Renders the full Dungeonmaster web UI with guild list, quest views, and project management
 */

import { useState } from 'react';

import { Box, Center, Group, Stack, Text } from '@mantine/core';

import type { ProjectId, ProjectName, ProjectPath, QuestId } from '@dungeonmaster/shared/contracts';

import { useAgentOutputBinding } from '../../bindings/use-agent-output/use-agent-output-binding';
import { useExecutionBinding } from '../../bindings/use-execution/use-execution-binding';
import { useProjectsBinding } from '../../bindings/use-projects/use-projects-binding';
import { useQuestDetailBinding } from '../../bindings/use-quest-detail/use-quest-detail-binding';
import { useQuestsBinding } from '../../bindings/use-quests/use-quests-binding';
import { projectCreateBroker } from '../../brokers/project/create/project-create-broker';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { GuildListWidget } from '../guild-list/guild-list-widget';
import { GuildQuestListWidget } from '../guild-quest-list/guild-quest-list-widget';
import { LogoWidget } from '../logo/logo-widget';
import { MapFrameWidget } from '../map-frame/map-frame-widget';
import { ProjectAddModalWidget } from '../project-add-modal/project-add-modal-widget';
import { ProjectEmptyStateWidget } from '../project-empty-state/project-empty-state-widget';
import { QuestDetailWidget } from '../quest-detail/quest-detail-widget';

type View = 'main' | 'new-project' | 'detail';

export const AppWidget = (): React.JSX.Element => {
  const [currentView, setCurrentView] = useState<View>('main');
  const [selectedProjectId, setSelectedProjectId] = useState<ProjectId | null>(null);
  const [selectedQuestId, setSelectedQuestId] = useState<QuestId | null>(null);
  const [addProjectModalOpened, setAddProjectModalOpened] = useState(false);

  const { projects, loading: projectsLoading, refresh: refreshProjects } = useProjectsBinding();

  const { data: quests, refresh } = useQuestsBinding({ projectId: selectedProjectId });

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

  const { colors } = emberDepthsThemeStatics;
  const hasProjects = projects.length > 0;

  return (
    <div style={{ background: colors['bg-deep'], color: colors.text, minHeight: '100vh' }}>
      <Center h="100vh">
        <Stack align="center" gap="md" w="100%" maw={800} px="md">
          <LogoWidget />
          <MapFrameWidget>
            {(!hasProjects && !projectsLoading) || currentView === 'new-project' ? (
              <Center style={{ height: 250 }}>
                <ProjectEmptyStateWidget
                  onAddProject={({ name, path }) => {
                    projectCreateBroker({ name: String(name), path: String(path) })
                      .then(async ({ id }) => {
                        await refreshProjects();
                        setSelectedProjectId(id);
                        setCurrentView('main');
                      })
                      .catch(() => undefined);
                  }}
                  onCancel={
                    hasProjects
                      ? () => {
                          setCurrentView('main');
                        }
                      : undefined
                  }
                />
              </Center>
            ) : currentView === 'detail' ? (
              <QuestDetailWidget
                quest={quest}
                loading={questLoading}
                error={questError ?? executionError}
                onBack={() => {
                  setCurrentView('main');
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
            ) : (
              <Group align="flex-start" gap="xl" wrap="nowrap" style={{ minHeight: 200 }}>
                <Box
                  style={{
                    flex: '0 0 200px',
                    borderRight: `1px solid ${colors.border}`,
                    paddingRight: 16,
                  }}
                >
                  <GuildListWidget
                    projects={projects}
                    selectedProjectId={selectedProjectId}
                    onSelect={({ id }: { id: ProjectId }) => {
                      setSelectedProjectId(id);
                      setSelectedQuestId(null);
                    }}
                    onAdd={() => {
                      setCurrentView('new-project');
                    }}
                  />
                </Box>
                <Box style={{ flex: 1 }}>
                  {selectedProjectId ? (
                    <GuildQuestListWidget
                      quests={quests}
                      onSelect={({ questId }: { questId: QuestId }) => {
                        setSelectedQuestId(questId);
                        setCurrentView('detail');
                      }}
                      onAdd={() => {
                        refresh().catch(() => undefined);
                      }}
                    />
                  ) : (
                    <Center h={200}>
                      <Text ff="monospace" size="sm" style={{ color: colors['text-dim'] }}>
                        Select a guild
                      </Text>
                    </Center>
                  )}
                </Box>
              </Group>
            )}
          </MapFrameWidget>
        </Stack>
      </Center>

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
    </div>
  );
};
