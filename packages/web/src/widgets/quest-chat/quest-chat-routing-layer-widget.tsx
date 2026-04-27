/**
 * PURPOSE: Routes the /:guildSlug/quest[/* :questId] surface to NOT_FOUND (no guild), live workspace (questId present), new-chat panel (no questId, guild matched), or loading raccoon (guild loading).
 *
 * USAGE:
 * <QuestChatRoutingLayerWidget questId={...} matchedGuild={...} matchedGuildId={...} guildsLoading={...} />
 * // Returns the routed JSX for the live quest workspace.
 */

import { Box, Text } from '@mantine/core';

import type { Guild, GuildId, QuestId } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { DumpsterRaccoonWidget } from '../dumpster-raccoon/dumpster-raccoon-widget';
import { QuestLiveWorkspaceLayerWidget } from './quest-live-workspace-layer-widget';
import { QuestNewChatLayerWidget } from './quest-new-chat-layer-widget';

export interface QuestChatRoutingLayerWidgetProps {
  questId: QuestId | null | undefined;
  matchedGuild: Guild | undefined;
  matchedGuildId: GuildId | null;
  guildsLoading: boolean;
}

export const QuestChatRoutingLayerWidget = ({
  questId,
  matchedGuild,
  matchedGuildId,
  guildsLoading,
}: QuestChatRoutingLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

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
