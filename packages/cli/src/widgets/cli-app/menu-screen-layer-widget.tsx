/**
 * PURPOSE: Displays the main menu with navigation options for the CLI app
 *
 * USAGE:
 * <MenuScreenLayerWidget
 *   onSelect={({option}) => setScreen(option)}
 *   onExit={() => process.exit(0)}
 * />
 * // Renders menu with arrow key navigation
 */
import React, { useState } from 'react';

import { inkBoxAdapter } from '../../adapters/ink/box/ink-box-adapter';
import { inkTextAdapter } from '../../adapters/ink/text/ink-text-adapter';
import { inkUseInputAdapter } from '../../adapters/ink/use-input/ink-use-input-adapter';
import { menuIndexContract } from '../../contracts/menu-index/menu-index-contract';
import type { MenuIndex } from '../../contracts/menu-index/menu-index-contract';
import { cliStatics } from '../../statics/cli/cli-statics';
import { getBuildTimestampTransformer } from '../../transformers/get-build-timestamp/get-build-timestamp-transformer';

export interface MenuScreenLayerWidgetProps {
  onSelect: ({ option }: { option: string }) => void;
  onExit: () => void;
}

export const MenuScreenLayerWidget = ({
  onSelect,
  onExit,
}: MenuScreenLayerWidgetProps): React.JSX.Element => {
  const Box = inkBoxAdapter();
  const Text = inkTextAdapter();

  const [selectedIndex, setSelectedIndex] = useState<MenuIndex>(menuIndexContract.parse(0));

  const { options } = cliStatics.menu;

  inkUseInputAdapter({
    handler: ({ input, key }) => {
      if (key.upArrow) {
        setSelectedIndex((prev) =>
          menuIndexContract.parse(prev > 0 ? prev - 1 : options.length - 1),
        );
      } else if (key.downArrow) {
        setSelectedIndex((prev) =>
          menuIndexContract.parse(prev < options.length - 1 ? prev + 1 : 0),
        );
      } else if (key.return) {
        const selectedOption = options[selectedIndex];
        if (selectedOption) {
          onSelect({ option: selectedOption.id });
        }
      } else if (input === 'q' || key.escape) {
        onExit();
      }
    },
  });

  return (
    <Box flexDirection="column">
      <Text bold>{cliStatics.meta.name}</Text>
      <Text>{cliStatics.meta.description}</Text>
      <Text dimColor>Built: {getBuildTimestampTransformer()}</Text>
      <Text> </Text>
      {options.map((option, index) =>
        index === selectedIndex ? (
          <Text key={option.id} color="cyan">
            {'> '}
            {option.label} - {option.description}
          </Text>
        ) : (
          <Text key={option.id}>
            {'  '}
            {option.label} - {option.description}
          </Text>
        ),
      )}
      <Text> </Text>
      <Text dimColor>Use arrow keys to navigate, Enter to select, q to quit</Text>
    </Box>
  );
};
