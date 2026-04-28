/**
 * PURPOSE: Mounts on `/:guildSlug/quest` and `/:guildSlug/quest/:questId`. Reads URL params, resolves the matched guild, and either renders NOT_FOUND, the loading raccoon, or delegates to QuestChatContentLayerWidget which handles BOTH the new-chat (no questId) and live-workspace (with questId) surfaces in the same component instance — preserving local state across the URL replace-navigate that fires after first-message quest creation.
 *
 * USAGE:
 * <QuestChatWidget />
 * // Rendered by routes; reads useParams() and useGuildsBinding() to resolve routing branches.
 */

import { useParams } from 'react-router-dom';

import { Box, Text } from '@mantine/core';

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { useGuildsBinding } from '../../bindings/use-guilds/use-guilds-binding';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { DumpsterRaccoonWidget } from '../dumpster-raccoon/dumpster-raccoon-widget';
import { QuestChatContentLayerWidget } from './quest-chat-content-layer-widget';

export const QuestChatWidget = (): React.JSX.Element => {
  const params = useParams();
  const { guildSlug } = params;
  const questId = (params.questId as QuestId | undefined) ?? null;

  const { guilds, loading: guildsLoading } = useGuildsBinding();
  const matchedGuild = guilds.find(
    (guild) => guild.urlSlug === guildSlug || guild.id === guildSlug,
  );
  const matchedGuildId = matchedGuild?.id ?? null;
  const matchedGuildSlug = matchedGuild?.urlSlug;

  const { colors } = emberDepthsThemeStatics;

  if (!guildsLoading && matchedGuildId === null) {
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
          The guild you are looking for does not exist.
        </Text>
      </Box>
    );
  }

  if (matchedGuildId === null || matchedGuildSlug === undefined) {
    return (
      <Box
        data-testid="QUEST_CHAT_LOADING"
        style={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
        }}
      >
        <DumpsterRaccoonWidget />
      </Box>
    );
  }

  return (
    <QuestChatContentLayerWidget
      questId={questId}
      guildId={matchedGuildId}
      guildSlug={matchedGuildSlug}
    />
  );
};
