/**
 * PURPOSE: Main orchestrator widget for the CLI app managing screen state and navigation
 *
 * USAGE:
 * <CliAppWidget
 *   initialScreen="menu"
 *   onSpawnChaoswhisperer={({userInput}) => spawnAgent(userInput)}
 *   onRunQuest={({questId, questFolder}) => executeQuest(questId, questFolder)}
 *   onExit={() => process.exit(0)}
 * />
 * // Renders the appropriate screen based on state and handles navigation
 */
import React, { useState } from 'react';

import type { UserInput, InstallContext, Quest, QuestId } from '@dungeonmaster/shared/contracts';
import { HelpScreenLayerWidget } from './help-screen-layer-widget';
import { InitScreenLayerWidget } from './init-screen-layer-widget';
import { ListScreenLayerWidget } from './list-screen-layer-widget';
import { AddScreenLayerWidget } from './add-screen-layer-widget';
import { MenuScreenLayerWidget } from './menu-screen-layer-widget';
import { RunScreenLayerWidget } from './run-screen-layer-widget';

type QuestFolder = Quest['folder'];

export type CliAppScreen = 'menu' | 'add' | 'help' | 'list' | 'init' | 'run';

export interface CliAppWidgetProps {
  initialScreen: CliAppScreen;
  onSpawnChaoswhisperer: ({ userInput }: { userInput: UserInput }) => void;
  onRunQuest: ({ questId, questFolder }: { questId: QuestId; questFolder: QuestFolder }) => void;
  onExit: () => void;
  installContext: InstallContext;
}

export const CliAppWidget = ({
  initialScreen,
  onSpawnChaoswhisperer,
  onRunQuest,
  onExit,
  installContext,
}: CliAppWidgetProps): React.JSX.Element => {
  const [screen, setScreen] = useState<CliAppScreen>(initialScreen);

  if (screen === 'help') {
    return (
      <HelpScreenLayerWidget
        onBack={() => {
          setScreen('menu');
        }}
      />
    );
  }

  if (screen === 'list') {
    return (
      <ListScreenLayerWidget
        startPath={installContext.targetProjectRoot}
        onBack={() => {
          setScreen('menu');
        }}
      />
    );
  }

  if (screen === 'init') {
    return (
      <InitScreenLayerWidget
        onBack={() => {
          setScreen('menu');
        }}
        installContext={installContext}
      />
    );
  }

  if (screen === 'add') {
    return (
      <AddScreenLayerWidget
        onSubmit={({ userInput }) => {
          onSpawnChaoswhisperer({ userInput });
        }}
        onCancel={() => {
          setScreen('menu');
        }}
      />
    );
  }

  if (screen === 'run') {
    return (
      <RunScreenLayerWidget
        startPath={installContext.targetProjectRoot}
        onRunQuest={({ questId, questFolder }) => {
          onRunQuest({ questId, questFolder });
        }}
        onBack={() => {
          setScreen('menu');
        }}
      />
    );
  }

  // Default: menu screen
  return (
    <MenuScreenLayerWidget
      onSelect={({ option }) => {
        setScreen(option as CliAppScreen);
      }}
      onExit={onExit}
    />
  );
};
