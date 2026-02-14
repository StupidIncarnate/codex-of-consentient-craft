/**
 * PURPOSE: Main orchestrator widget for the CLI app managing screen state and navigation
 *
 * USAGE:
 * <CliAppWidget
 *   initialScreen="menu"
 *   onRunQuest={({questId, questFolder}) => executeQuest(questId, questFolder)}
 *   onExit={() => process.exit(0)}
 * />
 * // Renders the appropriate screen based on state and handles navigation
 */
import React, { useState } from 'react';

import type { GuildId, InstallContext, Quest, QuestId } from '@dungeonmaster/shared/contracts';
import { HelpScreenLayerWidget } from './help-screen-layer-widget';
import { InitScreenLayerWidget } from './init-screen-layer-widget';
import { ListScreenLayerWidget } from './list-screen-layer-widget';
import { MenuScreenLayerWidget } from './menu-screen-layer-widget';
import { RunScreenLayerWidget } from './run-screen-layer-widget';

type QuestFolder = Quest['folder'];

export type CliAppScreen = 'menu' | 'help' | 'list' | 'init' | 'run';

export interface CliAppWidgetProps {
  initialScreen: CliAppScreen;
  onRunQuest: ({ questId, questFolder }: { questId: QuestId; questFolder: QuestFolder }) => void;
  onExit: () => void;
  installContext: InstallContext;
  guildId: GuildId;
}

export const CliAppWidget = ({
  initialScreen,
  onRunQuest,
  onExit,
  installContext,
  guildId,
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
        guildId={guildId}
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

  if (screen === 'run') {
    return (
      <RunScreenLayerWidget
        guildId={guildId}
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
