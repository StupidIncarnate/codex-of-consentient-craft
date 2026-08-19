/**
 * PURPOSE: Renders the /health page's 7-row snapshot table from an already-parsed `HealthSnapshot`.
 * Split from `HealthPageWidget` because this layer takes the snapshot as a prop and calls no
 * binding — the page widget owns the fetch and hands the parsed value down, so this layer stays a
 * pure function of its props and is trivial to test with a stub.
 *
 * USAGE:
 * <HealthTableLayerWidget snapshot={snapshot} />
 * // Renders one row per healthPageRowsStatics entry, each value rendered verbatim via String(...)
 */

import { Stack } from '@mantine/core';

import type { HealthSnapshot } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { healthPageRowsStatics } from '../../statics/health-page-rows/health-page-rows-statics';

export interface HealthTableLayerWidgetProps {
  snapshot: HealthSnapshot;
}

const BORDER_WIDTH = 1;
const ROW_PADDING_Y = 8;
const ROW_PADDING_X = 12;
const ROW_GAP = 12;
const ROW_FONT_SIZE = 13;

export const HealthTableLayerWidget = ({
  snapshot,
}: HealthTableLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <Stack
      gap={0}
      data-testid="HEALTH_PAGE_TABLE"
      style={{
        border: `${BORDER_WIDTH}px solid ${colors.border}`,
        backgroundColor: colors['bg-surface'],
        fontFamily: 'monospace',
      }}
    >
      {healthPageRowsStatics.rows.map((row) => (
        <div
          key={row.rowTestId}
          data-testid={row.rowTestId}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: ROW_GAP,
            padding: `${ROW_PADDING_Y}px ${ROW_PADDING_X}px`,
            borderBottom: `${BORDER_WIDTH}px solid ${colors.border}`,
            fontSize: ROW_FONT_SIZE,
          }}
        >
          <span style={{ color: colors['text-dim'] }}>{row.label}</span>
          <span data-testid={row.valueTestId} style={{ color: colors.text }}>
            {String(snapshot[row.field])}
          </span>
        </div>
      ))}
    </Stack>
  );
};
