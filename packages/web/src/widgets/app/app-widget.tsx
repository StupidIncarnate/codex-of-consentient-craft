/**
 * PURPOSE: Root application layout with URL routing and animated map frame transitions
 *
 * USAGE:
 * <AppWidget />
 * // Renders the full Dungeonmaster web UI with routes for guild selection (/), guild chat (/:guildSlug/quest), and quest chat (/:guildSlug/quest/:questSlug)
 */

import { Link, Outlet, useLocation } from 'react-router-dom';

import { Center } from '@mantine/core';

import { cssPixelsContract } from '@dungeonmaster/shared/contracts';

import { useSmoketestRunBinding } from '../../bindings/use-smoketest-run/use-smoketest-run-binding';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { isSessionRouteGuard } from '../../guards/is-session-route/is-session-route-guard';
import { mapFrameStatics } from '../../statics/map-frame/map-frame-statics';
import { LogoWidget } from '../logo/logo-widget';
import { MapFrameWidget } from '../map-frame/map-frame-widget';
import { SmoketestDrawerWidget } from '../smoketest-drawer/smoketest-drawer-widget';
import { ToolingDropdownWidget } from '../tooling-dropdown/tooling-dropdown-widget';

const TRANSITION_DURATION = '0.4s';
const TRANSITION_EASING = 'ease-out';
const QUEST_TOP_PADDING = 40;

const defaultMaxWidth = cssPixelsContract.parse(mapFrameStatics.defaultMaxWidth);
const unrestrictedMaxWidth = cssPixelsContract.parse(mapFrameStatics.unrestrictedMaxWidth);

export const AppWidget = (): React.JSX.Element => {
  const location = useLocation();
  const isQuestRoute = isSessionRouteGuard({ pathname: location.pathname });
  const { colors } = emberDepthsThemeStatics;
  const smoketest = useSmoketestRunBinding();

  const transition = `all ${TRANSITION_DURATION} ${TRANSITION_EASING}`;

  return (
    <div
      style={{
        background: colors['bg-deep'],
        color: colors.text,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top spacer: flex-grows on home to push content to center, collapses on quest */}
      <div
        data-testid="APP_SPACER_TOP"
        style={{
          flex: isQuestRoute ? `0 0 ${QUEST_TOP_PADDING}px` : '1 1 0px',
          transition,
        }}
      />

      {/* Logo: always horizontally centered, links to home */}
      <div style={{ padding: '12px 0' }}>
        <Center>
          <Link to="/" style={{ textDecoration: 'none' }} data-testid="LOGO_LINK">
            <LogoWidget />
          </Link>
        </Center>
      </div>

      {/* Map frame container: constrained on home, fills remaining space on quest */}
      <div
        data-testid="APP_MAP_CONTAINER"
        style={{
          flex: isQuestRoute ? '1 1 0px' : '0 0 auto',
          display: 'flex',
          justifyContent: 'center',
          padding: isQuestRoute ? '0 16px 16px 16px' : '0 16px',
          minHeight: 0,
          maxHeight: isQuestRoute ? undefined : '80vh',
          overflow: isQuestRoute ? undefined : 'hidden',
          transition,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: isQuestRoute ? undefined : defaultMaxWidth,
            display: 'flex',
            flexDirection: 'column',
            flex: isQuestRoute ? 1 : undefined,
            transition: `max-width ${TRANSITION_DURATION} ${TRANSITION_EASING}`,
          }}
        >
          <MapFrameWidget maxWidth={isQuestRoute ? unrestrictedMaxWidth : defaultMaxWidth}>
            <Outlet />
          </MapFrameWidget>
        </div>
      </div>

      {/* Bottom spacer: matches top spacer on home, collapses on quest */}
      <div
        data-testid="APP_SPACER_BOTTOM"
        style={{
          flex: isQuestRoute ? '0 0 0px' : '1 1 0px',
          transition,
        }}
      />

      <SmoketestDrawerWidget
        opened={smoketest.opened}
        onClose={smoketest.close}
        runId={smoketest.runId}
        total={smoketest.total}
        currentCase={smoketest.currentCase}
        results={smoketest.results}
        running={smoketest.running}
      />

      {!isQuestRoute && (
        <div
          data-testid="APP_TOOLING_SLOT"
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          <ToolingDropdownWidget
            onRun={smoketest.run}
            onReopen={smoketest.open}
            running={smoketest.running}
          />
        </div>
      )}
    </div>
  );
};
