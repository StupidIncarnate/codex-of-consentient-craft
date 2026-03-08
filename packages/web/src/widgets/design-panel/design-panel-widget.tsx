/**
 * PURPOSE: Renders the design sandbox panel with either an iframe to the Vite dev server or a placeholder message
 *
 * USAGE:
 * <DesignPanelWidget designPort={5173} />
 * // Renders iframe pointing to localhost:5173
 */

import { Box, Text } from '@mantine/core';

import type { Quest } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

export const DesignPanelWidget = ({
  designPort,
}: {
  designPort?: Quest['designPort'];
}): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  if (!designPort) {
    return (
      <Box
        data-testid="DESIGN_PANEL_PLACEHOLDER"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text ff="monospace" size="xs" style={{ color: colors['text-dim'] }}>
          Design sandbox not started
        </Text>
      </Box>
    );
  }

  return (
    <iframe
      data-testid="DESIGN_IFRAME"
      src={`http://localhost:${String(designPort)}`}
      style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
      title="Design Prototype"
    />
  );
};
