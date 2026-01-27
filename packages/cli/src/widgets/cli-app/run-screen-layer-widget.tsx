/**
 * PURPOSE: Displays a list of incomplete quests for selection and execution
 *
 * USAGE:
 * <RunScreenLayerWidget
 *   startPath={targetProjectRoot}
 *   onRunQuest={({questId, questFolder}) => executeQuest(questId, questFolder)}
 *   onBack={() => setScreen('menu')}
 * />
 * // Renders quest selection with arrow key navigation
 */
import React, { useState } from 'react';

import type { FilePath, Quest, QuestId } from '@dungeonmaster/shared/contracts';

import { inkBoxAdapter } from '../../adapters/ink/box/ink-box-adapter';
import { inkTextAdapter } from '../../adapters/ink/text/ink-text-adapter';
import { inkUseInputAdapter } from '../../adapters/ink/use-input/ink-use-input-adapter';
import { useQuestsListBinding } from '../../bindings/use-quests-list/use-quests-list-binding';
import { questSelectionIndexContract } from '../../contracts/quest-selection-index/quest-selection-index-contract';
import type { QuestSelectionIndex } from '../../contracts/quest-selection-index/quest-selection-index-contract';

type QuestFolder = Quest['folder'];

export interface RunScreenLayerWidgetProps {
  startPath: FilePath;
  onRunQuest: ({ questId, questFolder }: { questId: QuestId; questFolder: QuestFolder }) => void;
  onBack: () => void;
}

export const RunScreenLayerWidget = ({
  startPath,
  onRunQuest,
  onBack,
}: RunScreenLayerWidgetProps): React.JSX.Element => {
  const Box = inkBoxAdapter();
  const Text = inkTextAdapter();
  const { data: quests, loading, error } = useQuestsListBinding({ startPath });

  const [selectedIndex, setSelectedIndex] = useState<QuestSelectionIndex>(
    questSelectionIndexContract.parse(0),
  );

  // Filter to incomplete quests only
  const incompleteQuests = quests.filter((quest) => quest.status !== 'complete');

  inkUseInputAdapter({
    handler: ({ input, key }) => {
      if (key.upArrow) {
        setSelectedIndex((prev) =>
          questSelectionIndexContract.parse(
            prev > 0 ? prev - 1 : Math.max(0, incompleteQuests.length - 1),
          ),
        );
      } else if (key.downArrow) {
        setSelectedIndex((prev) =>
          questSelectionIndexContract.parse(prev < incompleteQuests.length - 1 ? prev + 1 : 0),
        );
      } else if (key.return) {
        const selectedQuest = incompleteQuests[selectedIndex];
        if (selectedQuest) {
          onRunQuest({
            questId: selectedQuest.id,
            questFolder: selectedQuest.folder,
          });
        }
      } else if (input === 'q' || key.escape) {
        onBack();
      }
    },
  });

  return (
    <Box flexDirection="column">
      <Text bold>Run Quest</Text>
      <Text> </Text>
      {loading && <Text dimColor>Loading quests...</Text>}
      {error && <Text color="red">Error: {error.message}</Text>}
      {!loading && !error && incompleteQuests.length === 0 && (
        <Text dimColor>No incomplete quests available to run.</Text>
      )}
      {!loading &&
        !error &&
        incompleteQuests.map((quest, index) =>
          index === selectedIndex ? (
            <Box key={quest.id} flexDirection="row">
              <Text color="cyan">{'> '}</Text>
              <Text color="cyan">
                [{quest.status}] {quest.title}
              </Text>
              <Text dimColor> ({quest.folder})</Text>
            </Box>
          ) : (
            <Box key={quest.id} flexDirection="row">
              <Text>{'  '}</Text>
              <Text color="yellow">
                [{quest.status}] {quest.title}
              </Text>
              <Text dimColor> ({quest.folder})</Text>
            </Box>
          ),
        )}
      <Text> </Text>
      <Text dimColor>Use arrow keys to navigate, Enter to run, Escape or 'q' to go back</Text>
    </Box>
  );
};
