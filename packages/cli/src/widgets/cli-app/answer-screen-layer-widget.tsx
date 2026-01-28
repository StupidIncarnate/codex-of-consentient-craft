/**
 * PURPOSE: Displays answer screen for responding to agent questions
 *
 * USAGE:
 * <AnswerScreenLayerWidget
 *   question={SignalQuestionStub()}
 *   context={SignalContextStub()}
 *   onSubmit={({answer}) => resumeAgent(answer)}
 *   onCancel={() => setScreen('menu')}
 * />
 * // Renders question display and text input for user answer
 */
import React, { useState } from 'react';

import type { UserInput } from '@dungeonmaster/shared/contracts';
import { userInputContract } from '@dungeonmaster/shared/contracts';

import { inkBoxAdapter } from '../../adapters/ink/box/ink-box-adapter';
import { inkTextAdapter } from '../../adapters/ink/text/ink-text-adapter';
import { inkUseInputAdapter } from '../../adapters/ink/use-input/ink-use-input-adapter';
import type { SignalQuestion } from '../../contracts/signal-question/signal-question-contract';
import type { SignalContext } from '../../contracts/signal-context/signal-context-contract';

export interface AnswerScreenLayerWidgetProps {
  question: SignalQuestion;
  context: SignalContext;
  onSubmit: ({ answer }: { answer: UserInput }) => void;
  onCancel: () => void;
}

export const AnswerScreenLayerWidget = ({
  question,
  context,
  onSubmit,
  onCancel,
}: AnswerScreenLayerWidgetProps): React.JSX.Element => {
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
          onSubmit({ answer: userInputContract.parse(trimmed) });
        }
      } else if (key.backspace || key.delete) {
        setInputValue((prev) => userInputContract.parse(prev.slice(0, -1)));
      } else if (input && !key.ctrl && !key.meta) {
        setInputValue((prev) => userInputContract.parse(prev + input));
      }
    },
  });

  return (
    <Box flexDirection="column">
      <Text bold color="yellow">
        Agent needs your input
      </Text>
      <Text> </Text>
      <Text dimColor>Context: {context}</Text>
      <Text> </Text>
      <Text bold>{question}</Text>
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
