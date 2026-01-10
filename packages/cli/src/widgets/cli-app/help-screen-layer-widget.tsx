/**
 * PURPOSE: Displays help text and available commands for the CLI app
 *
 * USAGE:
 * <HelpScreenLayerWidget onBack={() => setScreen('menu')} />
 * // Renders help screen with command list and back instructions
 */
import React from 'react';

import { inkBoxAdapter } from '../../adapters/ink/box/ink-box-adapter';
import { inkTextAdapter } from '../../adapters/ink/text/ink-text-adapter';
import { inkUseInputAdapter } from '../../adapters/ink/use-input/ink-use-input-adapter';
import { cliStatics } from '../../statics/cli/cli-statics';

export interface HelpScreenLayerWidgetProps {
  onBack: () => void;
}

export const HelpScreenLayerWidget = ({
  onBack,
}: HelpScreenLayerWidgetProps): React.JSX.Element => {
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
      <Text bold>{cliStatics.meta.name}</Text>
      <Text>{cliStatics.meta.description}</Text>
      <Text> </Text>
      <Text bold>Available Commands:</Text>
      {cliStatics.menu.options.map((option) => (
        <Text key={option.id}>
          {option.label} - {option.description}
        </Text>
      ))}
      <Text> </Text>
      <Text dimColor>Press Escape or 'q' to go back</Text>
    </Box>
  );
};
