/**
 * PURPOSE: Renders the top-bar health badge: one control, in every one of its four states,
 * carrying the exact label text and hover title the operator reads to tell whether the server
 * behind the interface is still answering. Reach for this over composing useHealthStatusBinding
 * directly when the caller wants the rendered surface rather than the raw badge state.
 *
 * USAGE:
 * <HealthBadgeWidget />
 * // Renders a button carrying data-testid HEALTH_BADGE, its label text and its hover title
 */

import { UnstyledButton } from '@mantine/core';

import { useHealthStatusBinding } from '../../bindings/use-health-status/use-health-status-binding';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { healthBadgeStatics } from '../../statics/health-badge/health-badge-statics';
import { healthBadgeLabelTransformer } from '../../transformers/health-badge-label/health-badge-label-transformer';
import { healthBadgeTitleTransformer } from '../../transformers/health-badge-title/health-badge-title-transformer';

const FONT_SIZE = 11;
const BORDER_RADIUS = 2;
const PADDING = '4px 12px';

export const HealthBadgeWidget = (): React.JSX.Element => {
  const { badgeState, retry } = useHealthStatusBinding();
  const { colors } = emberDepthsThemeStatics;

  return (
    <UnstyledButton
      data-testid={healthBadgeStatics.testId}
      title={healthBadgeTitleTransformer({ badgeState })}
      onClick={retry}
      style={{
        fontFamily: emberDepthsThemeStatics.typography.font,
        fontSize: FONT_SIZE,
        color: colors.text,
        backgroundColor: colors['bg-raised'],
        border: `1px solid ${colors.border}`,
        borderRadius: BORDER_RADIUS,
        padding: PADDING,
        cursor: 'pointer',
      }}
    >
      {healthBadgeLabelTransformer({ badgeState })}
    </UnstyledButton>
  );
};
