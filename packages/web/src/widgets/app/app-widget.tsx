/**
 * PURPOSE: Root application layout with navigation between quest list and detail views
 *
 * USAGE:
 * <AppWidget />
 * // Renders the full Dungeonmaster web UI with AppShell, navbar, and main content
 */

import { useState } from 'react';

import { AppShell, Container, NavLink, Title } from '@mantine/core';

import type { QuestId } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';

import { useAgentOutputBinding } from '../../bindings/use-agent-output/use-agent-output-binding';
import { useExecutionBinding } from '../../bindings/use-execution/use-execution-binding';
import { useQuestDetailBinding } from '../../bindings/use-quest-detail/use-quest-detail-binding';
import { useQuestsBinding } from '../../bindings/use-quests/use-quests-binding';
import { QuestDetailWidget } from '../quest-detail/quest-detail-widget';
import { QuestListWidget } from '../quest-list/quest-list-widget';

type View = 'list' | 'detail';

export const AppWidget = (): React.JSX.Element => {
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedQuestId, setSelectedQuestId] = useState<QuestId | null>(null);

  const { data: quests, loading: questsLoading, error: questsError, refresh } = useQuestsBinding();

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

  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 220, breakpoint: 'sm' }} padding="md">
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
        <NavLink
          label="Quests"
          active={currentView === 'list'}
          onClick={() => {
            setCurrentView('list');
            setSelectedQuestId(null);
            refresh().catch(() => undefined);
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
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="lg">
          {currentView === 'list' && (
            <QuestListWidget
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
              slotOutputs={executionSlotOutputs.size > 0 ? executionSlotOutputs : agentSlotOutputs}
            />
          )}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};
