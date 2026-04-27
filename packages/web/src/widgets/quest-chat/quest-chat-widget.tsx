/**
 * PURPOSE: Thin wrapper that reads URL params and delegates routing to QuestChatRoutingLayerWidget. Mounted on /:guildSlug/quest and /:guildSlug/quest/:questId; the routing layer owns NOT_FOUND, new-chat, live workspace, and loading branches.
 *
 * USAGE:
 * <QuestChatWidget />
 * // Reads useParams() and resolves the matched guild from useGuildsBinding before delegating.
 */

import { useParams } from 'react-router-dom';

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { useGuildsBinding } from '../../bindings/use-guilds/use-guilds-binding';
import { QuestChatRoutingLayerWidget } from './quest-chat-routing-layer-widget';

export const QuestChatWidget = (): React.JSX.Element => {
  const params = useParams();
  const { guildSlug } = params;
  const questId = (params.questId as QuestId | undefined) ?? null;

  const { guilds, loading: guildsLoading } = useGuildsBinding();
  const matchedGuild = guilds.find(
    (guild) => guild.urlSlug === guildSlug || guild.id === guildSlug,
  );
  const matchedGuildId = matchedGuild?.id ?? null;

  return (
    <QuestChatRoutingLayerWidget
      questId={questId}
      matchedGuild={matchedGuild}
      matchedGuildId={matchedGuildId}
      guildsLoading={guildsLoading}
    />
  );
};
