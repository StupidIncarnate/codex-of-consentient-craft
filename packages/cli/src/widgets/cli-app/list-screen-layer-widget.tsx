/**
 * PURPOSE: Displays a list of all quests for the CLI app, sorted by newest first
 *
 * USAGE:
 * <ListScreenLayerWidget projectId={projectId} onBack={() => setScreen('menu')} />
 * // Renders list of quests with back navigation
 */
import React from 'react';

import type { ProjectId } from '@dungeonmaster/shared/contracts';

import { inkBoxAdapter } from '../../adapters/ink/box/ink-box-adapter';
import { inkTextAdapter } from '../../adapters/ink/text/ink-text-adapter';
import { inkUseInputAdapter } from '../../adapters/ink/use-input/ink-use-input-adapter';
import { useQuestsListBinding } from '../../bindings/use-quests-list/use-quests-list-binding';
import { cliStatics } from '../../statics/cli/cli-statics';

export interface ListScreenLayerWidgetProps {
  projectId: ProjectId;
  onBack: () => void;
}

export const ListScreenLayerWidget = ({
  projectId,
  onBack,
}: ListScreenLayerWidgetProps): React.JSX.Element => {
  const Box = inkBoxAdapter();
  const Text = inkTextAdapter();
  const { data: quests, loading, error } = useQuestsListBinding({ projectId });

  inkUseInputAdapter({
    handler: ({ input, key }) => {
      if (key.escape || input === 'q') {
        onBack();
      }
    },
  });

  return (
    <Box flexDirection="column">
      <Text bold>Quests</Text>
      <Text> </Text>
      {loading && <Text dimColor>Loading quests...</Text>}
      {error && <Text color="red">Error: {error.message}</Text>}
      {!loading && !error && quests.length === 0 && (
        <Text dimColor>{cliStatics.messages.noQuests}</Text>
      )}
      {!loading &&
        !error &&
        quests.map((quest) => (
          <Box key={quest.id} flexDirection="row">
            <Text color={quest.status === 'complete' ? 'green' : 'yellow'}>
              [{quest.status === 'complete' ? 'done' : quest.status}]{' '}
            </Text>
            <Text>{quest.title} </Text>
            <Text dimColor>({quest.folder})</Text>
          </Box>
        ))}
      <Text> </Text>
      <Text dimColor>Press Escape or 'q' to go back</Text>
    </Box>
  );
};
