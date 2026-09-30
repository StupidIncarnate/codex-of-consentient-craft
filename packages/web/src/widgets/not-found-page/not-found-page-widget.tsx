/**
 * PURPOSE: The page for a URL no route claims. Reach for this over the guild/session NOT_FOUND
 * panels, which say a matched route's guild or session is missing; this one says the path itself
 * matched nothing, and names it.
 *
 * USAGE:
 * <Route path="*" element={<NotFoundPageWidget />} />
 * // Renders NOT FOUND, the unmatched path, and a link back to /
 */

import { Link, useLocation } from '#gateway/npm/react-router-dom';

import { Box, Text } from '#gateway/npm/mantine__core';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

export const NotFoundPageWidget = (): React.JSX.Element => {
  const { pathname } = useLocation();
  const { colors } = emberDepthsThemeStatics;

  return (
    <Box
      data-testid="NOT_FOUND_PAGE"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        gap: 8,
        padding: 16,
      }}
    >
      <Text ff="monospace" size="lg" data-testid="NOT_FOUND_TITLE" style={{ color: colors.danger }}>
        NOT FOUND
      </Text>
      <Text
        ff="monospace"
        size="xs"
        data-testid="NOT_FOUND_PATH"
        style={{ color: colors['text-dim'], overflowWrap: 'anywhere' }}
      >
        {pathname}
      </Text>
      <Text ff="monospace" size="xs" style={{ color: colors['text-dim'] }}>
        No page exists at this address.
      </Text>
      <Link
        to="/"
        data-testid="NOT_FOUND_HOME_LINK"
        style={{ color: colors.primary, fontFamily: 'monospace', fontSize: 12 }}
      >
        BACK TO HOME
      </Link>
    </Box>
  );
};
