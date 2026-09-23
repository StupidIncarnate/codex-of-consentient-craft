/**
 * PURPOSE: Renders the back-edge badge naming the row `workItem.mintedBy` points to (27f) — the
 * panel's own resolved four-tier label (T2-1), never a raw id. A layer file so the empty-label null
 * check sits outside ExecutionRowLayerWidget's own function body, which is already at the repo's
 * `complexity: max 50` ceiling.
 *
 * USAGE:
 * <ExecutionRowMintedByBadgeLayerWidget mintedByLabel={mintedByLabel} />
 * // Renders "↩ walk pt: 1", or nothing when mintedByLabel is undefined
 */

import { Text } from '@mantine/core';

import type { DisplayLabel } from '../../contracts/display-label/display-label-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

const FONT_SIZE = 9;
const ARROW = '↩';

export interface ExecutionRowMintedByBadgeLayerWidgetProps {
  // A REQUIRED prop typed `| undefined`, not `?:` — the caller (ExecutionRowLayerWidget) is at the
  // repo's `complexity: max 50` ceiling, and `exactOptionalPropertyTypes` would otherwise force it
  // to wrap every call in a `{...(x === undefined ? {} : {mintedByLabel: x})}` spread, which costs a
  // branch there. Passing `undefined` straight through to a required prop costs nothing.
  mintedByLabel: DisplayLabel | undefined;
}

export const ExecutionRowMintedByBadgeLayerWidget = ({
  mintedByLabel,
}: ExecutionRowMintedByBadgeLayerWidgetProps): React.JSX.Element | null => {
  const { colors } = emberDepthsThemeStatics;
  if (mintedByLabel === undefined) {
    return null;
  }
  return (
    <Text
      ff="monospace"
      data-testid="execution-row-minted-by-badge"
      style={{ fontSize: FONT_SIZE, color: colors['text-dim'], flexShrink: 0 }}
    >
      {ARROW} {mintedByLabel}
    </Text>
  );
};
