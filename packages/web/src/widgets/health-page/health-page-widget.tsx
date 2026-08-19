/**
 * PURPOSE: Frame for the /health route's server-snapshot page. Owns the three-way branch between
 * the first-fetch loading line, the snapshot table, and the error panel, and wires the shared
 * health binding's WebSocket-driven ticks and socket-loss recovery through a single call — reach
 * for QueuePageWidget instead only when the page is listing cross-guild quest entries rather than
 * showing a single diagnostic snapshot.
 *
 * USAGE:
 * <HealthPageWidget />
 * // Renders HEALTH_PAGE_LOADING while the first GET /api/health is in flight, then either
 * // HEALTH_PAGE_TABLE or HEALTH_PAGE_ERROR — never both — refetching on every health-updated tick
 * // and whenever the reader clicks RETRY.
 */

import { Stack, Text } from '@mantine/core';

import { errorMessageContract } from '@dungeonmaster/shared/contracts';

import { useHealthBinding } from '../../bindings/use-health/use-health-binding';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { HealthErrorLayerWidget } from './health-error-layer-widget';
import { HealthTableLayerWidget } from './health-table-layer-widget';

const PAGE_PADDING = 16;

const FALLBACK_ERROR_MESSAGE = errorMessageContract.parse('Unknown error');

export const HealthPageWidget = (): React.JSX.Element => {
  const { snapshot, isLoading, error, refresh } = useHealthBinding();
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

      {isLoading ? (
        <Text size="xs" ff="monospace" c={colors['text-dim']} data-testid="HEALTH_PAGE_LOADING">
          Loading health snapshot...
        </Text>
      ) : snapshot === null ? (
        <HealthErrorLayerWidget
          message={error ?? FALLBACK_ERROR_MESSAGE}
          onRetry={(): void => {
            refresh().catch((caughtError: unknown) => {
              globalThis.console.error('[health-page-widget]', caughtError);
            });
          }}
        />
      ) : (
        <HealthTableLayerWidget snapshot={snapshot} />
      )}
    </Stack>
  );
};
