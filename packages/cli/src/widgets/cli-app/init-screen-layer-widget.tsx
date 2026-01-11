/**
 * PURPOSE: Displays initialization screen for setting up dungeonmaster in a project
 *
 * USAGE:
 * <InitScreenLayerWidget onBack={() => setScreen('menu')} installContext={context} />
 * // Renders init screen with back navigation and runs installation
 */
import React from 'react';

import type { InstallContext } from '@dungeonmaster/shared/contracts';

import { inkBoxAdapter } from '../../adapters/ink/box/ink-box-adapter';
import { inkTextAdapter } from '../../adapters/ink/text/ink-text-adapter';
import { inkUseInputAdapter } from '../../adapters/ink/use-input/ink-use-input-adapter';
import { useInstallBinding } from '../../bindings/use-install/use-install-binding';

export interface InitScreenLayerWidgetProps {
  onBack: () => void;
  installContext: InstallContext;
}

export const InitScreenLayerWidget = ({
  onBack,
  installContext,
}: InitScreenLayerWidgetProps): React.JSX.Element => {
  const Box = inkBoxAdapter();
  const Text = inkTextAdapter();

  const { data, loading, error } = useInstallBinding({
    context: installContext,
  });

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
      {loading && <Text color="yellow">Installing...</Text>}
      {error && <Text color="red">Error: {error.message}</Text>}
      {!loading && !error && data.length > 0 && (
        <>
          <Text color="green">Installation complete!</Text>
          <Text> </Text>
          {data.map((result, index) => (
            <Text key={index}>
              {result.success ? '✓' : '✗'} {result.packageName} -{' '}
              {result.message ?? result.error ?? result.action}
            </Text>
          ))}
        </>
      )}
      {!loading && !error && data.length === 0 && <Text dimColor>No packages to install</Text>}
      <Text> </Text>
      <Text dimColor>Press Escape or 'q' to go back</Text>
    </Box>
  );
};
