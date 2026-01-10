/**
 * PURPOSE: Displays text input screen for adding a new quest
 *
 * USAGE:
 * <AddScreenLayerWidget
 *   onSubmit={({userInput}) => spawnChaoswhisperer(userInput)}
 *   onCancel={() => setScreen('menu')}
 * />
 * // Renders text input for quest description
 */
import React, { useState } from 'react';

import type { UserInput } from '@dungeonmaster/shared/contracts';
import { userInputContract } from '@dungeonmaster/shared/contracts';

import { inkBoxAdapter } from '../../adapters/ink/box/ink-box-adapter';
import { inkTextAdapter } from '../../adapters/ink/text/ink-text-adapter';
import { inkUseInputAdapter } from '../../adapters/ink/use-input/ink-use-input-adapter';
import { cliStatics } from '../../statics/cli/cli-statics';

export interface AddScreenLayerWidgetProps {
  onSubmit: ({ userInput }: { userInput: UserInput }) => void;
  onCancel: () => void;
}

export const AddScreenLayerWidget = ({
  onSubmit,
  onCancel,
}: AddScreenLayerWidgetProps): React.JSX.Element => {
  const Box = inkBoxAdapter();
  const Text = inkTextAdapter();

  const [inputValue, setInputValue] = useState<UserInput>(userInputContract.parse(''));

  inkUseInputAdapter({
    handler: ({ input, key }) => {
      if (key.escape) {
        onCancel();
      } else if (key.return) {
        const trimmed = inputValue.trim();
        if (trimmed.length > 0) {
          onSubmit({ userInput: userInputContract.parse(trimmed) });
        }
      } else if (key.backspace || key.delete) {
        // Handle both backspace (\b/ctrl+H) and delete (\x7f) since terminals vary
        setInputValue((prev) => userInputContract.parse(prev.slice(0, -1)));
      } else if (input && !key.ctrl && !key.meta) {
        setInputValue((prev) => userInputContract.parse(prev + input));
      }
    },
  });

  return (
    <Box flexDirection="column">
      <Text bold>{cliStatics.messages.addPrompt}</Text>
      <Text> </Text>
      <Box>
        <Text color="cyan">&gt; </Text>
        <Text>{inputValue}</Text>
        <Text color="gray">_</Text>
      </Box>
      <Text> </Text>
      <Text dimColor>Press Enter to submit, Escape to cancel</Text>
    </Box>
  );
};
