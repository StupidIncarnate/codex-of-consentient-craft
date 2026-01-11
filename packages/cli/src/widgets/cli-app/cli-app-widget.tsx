/**
 * PURPOSE: Main orchestrator widget for the CLI app managing screen state and navigation
 *
 * USAGE:
 * <CliAppWidget
 *   initialScreen="menu"
 *   onSpawnChaoswhisperer={({userInput}) => spawnAgent(userInput)}
 *   onExit={() => process.exit(0)}
 * />
 * // Renders the appropriate screen based on state and handles navigation
 */
import React, { useState } from 'react';

import type { UserInput, InstallContext } from '@dungeonmaster/shared/contracts';
import { HelpScreenLayerWidget } from './help-screen-layer-widget';
import { InitScreenLayerWidget } from './init-screen-layer-widget';
import { ListScreenLayerWidget } from './list-screen-layer-widget';
import { AddScreenLayerWidget } from './add-screen-layer-widget';
import { MenuScreenLayerWidget } from './menu-screen-layer-widget';

export type CliAppScreen = 'menu' | 'add' | 'help' | 'list' | 'init';

export interface CliAppWidgetProps {
  initialScreen: CliAppScreen;
  onSpawnChaoswhisperer: ({ userInput }: { userInput: UserInput }) => void;
  onExit: () => void;
  installContext: InstallContext;
}

export const CliAppWidget = ({
  initialScreen,
  onSpawnChaoswhisperer,
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
