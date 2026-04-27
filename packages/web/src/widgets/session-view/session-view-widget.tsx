/**
 * PURPOSE: Readonly composer that renders any session's JSONL contents flat via the existing ChatPanelWidget readOnly mode
 *
 * USAGE:
 * <SessionViewWidget />
 * // Reads :sessionId and :guildSlug from URL params, mounts useSessionReplayBinding, renders ChatPanelWidget readOnly
 */

import { useParams } from 'react-router-dom';

import { Box, Text } from '@mantine/core';

import type { SessionId } from '@dungeonmaster/shared/contracts';

import { useGuildsBinding } from '../../bindings/use-guilds/use-guilds-binding';
import { useSessionReplayBinding } from '../../bindings/use-session-replay/use-session-replay-binding';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { ChatPanelWidget } from '../chat-panel/chat-panel-widget';
import { DumpsterRaccoonWidget } from '../dumpster-raccoon/dumpster-raccoon-widget';

export const SessionViewWidget = (): React.JSX.Element => {
  const params = useParams();
  const sessionId = (params.sessionId as SessionId | undefined) ?? null;
  const { guildSlug } = params;

  const { guilds, loading: guildsLoading } = useGuildsBinding();
  const matchedGuild = guilds.find(
    (guild) => guild.urlSlug === guildSlug || guild.id === guildSlug,
  );
  const guildId = matchedGuild?.id ?? null;

  const { entries, isLoading, sessionNotFound } = useSessionReplayBinding({
    sessionId,
    guildId,
  });

  const { colors } = emberDepthsThemeStatics;
  const showNotFound = (!guildsLoading && guildId === null) || sessionNotFound;

  if (showNotFound) {
    return (
      <Box
        data-testid="NOT_FOUND"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          gap: 8,
        }}
      >
        <Text ff="monospace" size="lg" style={{ color: colors.danger }}>
          NOT FOUND
        </Text>
        <Text ff="monospace" size="xs" style={{ color: colors['text-dim'] }}>
          The guild or session you are looking for does not exist.
        </Text>
      </Box>
    );
  }

  if (isLoading) {
    return <DumpsterRaccoonWidget />;
  }

  return <ChatPanelWidget entries={entries} isStreaming={false} readOnly />;
};
