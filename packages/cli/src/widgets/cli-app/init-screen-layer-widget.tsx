/**
 * PURPOSE: Displays initialization screen for setting up dungeonmaster in a project
 *
 * USAGE:
 * <InitScreenLayerWidget onBack={() => setScreen('menu')} />
 * // Renders init screen with back navigation
 */
import React from 'react';

import { inkBoxAdapter } from '../../adapters/ink/box/ink-box-adapter';
import { inkTextAdapter } from '../../adapters/ink/text/ink-text-adapter';
import { inkUseInputAdapter } from '../../adapters/ink/use-input/ink-use-input-adapter';

export interface InitScreenLayerWidgetProps {
  onBack: () => void;
}

export const InitScreenLayerWidget = ({
  onBack,
}: InitScreenLayerWidgetProps): React.JSX.Element => {
  const Box = inkBoxAdapter();
  const Text = inkTextAdapter();

  inkUseInputAdapter({
    handler: ({ input, key }) => {
      if (key.escape || input === 'q') {
        onBack();
      }
    },
  });

  return (
    <Box flexDirection="column">
      <Text bold>Initialize Dungeonmaster</Text>
      <Text> </Text>
      <Text>This will set up dungeonmaster in your project.</Text>
      <Text dimColor>(Initialization logic to be implemented)</Text>
      <Text> </Text>
      <Text dimColor>Press Escape or 'q' to go back</Text>
    </Box>
  );
};
