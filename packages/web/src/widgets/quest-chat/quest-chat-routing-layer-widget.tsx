/**
 * PURPOSE: Picks the Stage 4 quest-route branch (live workspace by questId, or new-chat panel) for /:guildSlug/quest[/* :questId]; returns null when the URL is not a quest path so the parent can fall through to legacy session handling.
 *
 * USAGE:
 * <QuestChatRoutingLayerWidget isQuestPath={...} questId={...} matchedGuildId={...} matchedGuildSlug={...} guildsLoading={...} />
 * // Returns the routed JSX, or null when none of the Stage 4 quest branches apply.
 */

import { Box, Text } from '@mantine/core';

import type { Guild, GuildId, QuestId } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { DumpsterRaccoonWidget } from '../dumpster-raccoon/dumpster-raccoon-widget';
import { QuestLiveWorkspaceLayerWidget } from './quest-live-workspace-layer-widget';
import { QuestNewChatLayerWidget } from './quest-new-chat-layer-widget';

export interface QuestChatRoutingLayerWidgetProps {
  isQuestPath: boolean;
  questId: QuestId | null | undefined;
  matchedGuild: Guild | undefined;
  matchedGuildId: GuildId | null;
  guildsLoading: boolean;
}

export const QuestChatRoutingLayerWidget = ({
  isQuestPath,
  questId,
  matchedGuild,
  matchedGuildId,
  guildsLoading,
}: QuestChatRoutingLayerWidgetProps): React.JSX.Element | null => {
  const { colors } = emberDepthsThemeStatics;
  if (!isQuestPath) return null;

  const resolvedQuestId = questId ?? null;
  const matchedGuildSlug = matchedGuild?.urlSlug;
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

  if (resolvedQuestId !== null) {
    return (
      <QuestLiveWorkspaceLayerWidget
        questId={resolvedQuestId}
        {...(matchedGuildSlug ? { guildSlug: matchedGuildSlug } : {})}
      />
    );
  }

  if (matchedGuildId !== null && matchedGuildSlug !== undefined) {
    return <QuestNewChatLayerWidget guildId={matchedGuildId} guildSlug={matchedGuildSlug} />;
  }

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
};
