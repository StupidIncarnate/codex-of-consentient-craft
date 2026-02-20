/**
 * PURPOSE: Root application layout with URL routing and animated map frame transitions
 *
 * USAGE:
 * <AppWidget />
 * // Renders the full Dungeonmaster web UI with routes for guild selection (/), guild chat (/:guildSlug/quest), and quest chat (/:guildSlug/quest/:questSlug)
 */

import { Route, Routes, useLocation } from 'react-router-dom';

import { Box, Center } from '@mantine/core';

import { cssPixelsContract } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { isQuestRouteGuard } from '../../guards/is-quest-route/is-quest-route-guard';
import { mapFrameStatics } from '../../statics/map-frame/map-frame-statics';
import { LogoWidget } from '../logo/logo-widget';
import { MapFrameWidget } from '../map-frame/map-frame-widget';
import { QuestChatWidget } from '../quest-chat/quest-chat-widget';
import { HomeContentLayerWidget } from './home-content-layer-widget';

const TRANSITION_DURATION = '0.4s';
const TRANSITION_EASING = 'ease-out';
const QUEST_TOP_PADDING = 40;

const defaultMaxWidth = cssPixelsContract.parse(mapFrameStatics.defaultMaxWidth);
const unrestrictedMaxWidth = cssPixelsContract.parse(mapFrameStatics.unrestrictedMaxWidth);

export const AppWidget = (): React.JSX.Element => {
  const location = useLocation();
  const isQuestRoute = isQuestRouteGuard({ pathname: location.pathname });
  const { colors } = emberDepthsThemeStatics;

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

      {/* Logo: always horizontally centered */}
      <Box py="sm">
        <Center>
          <LogoWidget />
        </Center>
      </Box>

      {/* Map frame container: constrained on home, fills remaining space on quest */}
      <div
        data-testid="APP_MAP_CONTAINER"
        style={{
          flex: isQuestRoute ? '1 1 0px' : '0 0 auto',
          display: 'flex',
          justifyContent: 'center',
          padding: isQuestRoute ? '0 16px 16px 16px' : '0 16px',
          minHeight: 0,
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
            <Routes>
              <Route path="/" element={<HomeContentLayerWidget />} />
              <Route path="/:guildSlug/quest" element={<QuestChatWidget />} />
              <Route path="/:guildSlug/quest/:sessionId" element={<QuestChatWidget />} />
            </Routes>
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
    </div>
  );
};
