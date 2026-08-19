/**
 * PURPOSE: Frame for the /health route's server-snapshot page. A later session extends this
 * same file with the health table, error panel and retry control rather than creating a second
 * page widget — reach for QueuePageWidget instead only when the page is listing cross-guild quest
 * entries rather than showing a single diagnostic snapshot.
 *
 * USAGE:
 * <HealthPageWidget />
 * // Renders the health page frame inside the app layout.
 */

import { Stack, Text } from '@mantine/core';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

const PAGE_PADDING = 16;

export const HealthPageWidget = (): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <Stack
      gap="md"
      data-testid="HEALTH_PAGE"
      style={{
        padding: PAGE_PADDING,
        color: colors.text,
        fontFamily: 'monospace',
      }}
    >
      <Text
        size="md"
        ff="monospace"
        fw={700}
        c={colors['loot-gold']}
        data-testid="HEALTH_PAGE_TITLE"
      >
        SERVER HEALTH
      </Text>
    </Stack>
  );
};
