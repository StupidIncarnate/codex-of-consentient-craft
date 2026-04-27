/**
 * PURPOSE: Readonly composer that renders any session's JSONL contents flat via the existing ChatPanelWidget readOnly mode
 *
 * USAGE:
 * <SessionViewWidget />
 * // Reads :sessionId and :guildSlug from URL params, mounts useSessionReplayBinding, renders ChatPanelWidget readOnly
 */

import { useParams } from 'react-router-dom';

import type { SessionId } from '@dungeonmaster/shared/contracts';

import { useGuildsBinding } from '../../bindings/use-guilds/use-guilds-binding';
import { useSessionReplayBinding } from '../../bindings/use-session-replay/use-session-replay-binding';
import { ChatPanelWidget } from '../chat-panel/chat-panel-widget';
import { DumpsterRaccoonWidget } from '../dumpster-raccoon/dumpster-raccoon-widget';

export const SessionViewWidget = (): React.JSX.Element => {
  const params = useParams();
  const sessionId = (params.sessionId as SessionId | undefined) ?? null;
  const { guildSlug } = params;

  const { guilds } = useGuildsBinding();
  const matchedGuild = guilds.find(
    (guild) => guild.urlSlug === guildSlug || guild.id === guildSlug,
  );
  const guildId = matchedGuild?.id ?? null;

  const { entries, isLoading, sessionNotFound } = useSessionReplayBinding({
    sessionId,
    guildId,
  });

  if (sessionNotFound) {
    return <div data-testid="SESSION_VIEW_NOT_FOUND">Session not found</div>;
  }

  if (isLoading) {
    return <DumpsterRaccoonWidget />;
  }

  return <ChatPanelWidget entries={entries} isStreaming={false} readOnly />;
};
