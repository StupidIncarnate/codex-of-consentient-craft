/**
 * PURPOSE: Renders one package chip on a flow node card, resolving the chip's accent colour from
 * the package's kind. Layer widget for FlowNodeCardLayerWidget's package row `.map` — the accent
 * lookup this chip needs is a `const` a rendering `.map` callback may not declare.
 *
 * USAGE:
 * <FlowNodePackageChipLayerWidget pkg={{ name: 'storefront-ui', packageType: 'frontend-react' }} />
 * // Renders FLOW_NODE_PACKAGE_CHIP outlined in the resolved accent colour
 */

import type { ReactFlowPackageChip } from '../../contracts/react-flow-package-chip/react-flow-package-chip-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { packageChipAccentTransformer } from '../../transformers/package-chip-accent/package-chip-accent-transformer';

export interface FlowNodePackageChipLayerWidgetProps {
  pkg: ReactFlowPackageChip;
}

const { colors } = emberDepthsThemeStatics;

// Outlined rather than filled, matching the flow-type badge and the assertion card's outcome tag.
// A filled chip at this size reads as a status pill, and a card carrying two of them would
// out-shout the label the reader is actually scanning.
const PACKAGE_CHIP_STYLE = {
  border: '1px solid',
  borderRadius: 3,
  background: colors['bg-raised'],
  fontSize: 9,
  padding: '0px 4px',
  letterSpacing: '0.5px',
  whiteSpace: 'nowrap' as const,
};

export const FlowNodePackageChipLayerWidget = ({
  pkg,
}: FlowNodePackageChipLayerWidgetProps): React.JSX.Element => {
  const accent = packageChipAccentTransformer(
    pkg.packageType === undefined ? {} : { packageType: pkg.packageType },
  );

  return (
    <span
      data-testid="FLOW_NODE_PACKAGE_CHIP"
      {...(pkg.packageType === undefined ? {} : { 'data-package-type': pkg.packageType })}
      // The resolved token, stated as data rather than only as CSS: a browser reports the
      // applied colour as `rgb(...)` and jsdom rewrites it too, so an assertion against the
      // palette would be comparing two different notations.
      data-package-accent={accent}
      style={{ ...PACKAGE_CHIP_STYLE, borderColor: accent, color: accent }}
    >
      {pkg.name}
    </span>
  );
};
