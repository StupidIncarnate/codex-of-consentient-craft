/**
 * PURPOSE: Renders the bare /:guildSlug/quest new-chat surface — empty chat panel that creates the quest server-side on first message and replace-navigates to the live workspace.
 *
 * USAGE:
 * <QuestNewChatLayerWidget guildId={guildId} guildSlug={guildSlug} />
 * // Returns the chat surface; on send, calls questNewBroker and navigates.
 */

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Box } from '@mantine/core';

import type { GuildId, UrlSlug, UserInput } from '@dungeonmaster/shared/contracts';
import { chatEntryContract, type ChatEntry } from '@dungeonmaster/shared/contracts';

import { questNewBroker } from '../../brokers/quest/new/quest-new-broker';
import { ChatPanelWidget } from '../chat-panel/chat-panel-widget';

export interface QuestNewChatLayerWidgetProps {
  guildId: GuildId;
  guildSlug: UrlSlug;
}

export const QuestNewChatLayerWidget = ({
  guildId,
  guildSlug,
}: QuestNewChatLayerWidgetProps): React.JSX.Element => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSend = useCallback(
    ({ message }: { message: UserInput }): void => {
      if (submitting) return;
      const userEntry = chatEntryContract.parse({ role: 'user', content: message });
      setEntries((prev) => [...prev, userEntry]);
      setSubmitting(true);
      questNewBroker({ guildId, message })
        .then(({ questId }) => {
          const result = navigate(`/${guildSlug}/quest/${questId}`, { replace: true });
          if (result instanceof Promise) {
            result.catch((navError: unknown) => {
              globalThis.console.error('[quest-chat] new-chat navigate failed', navError);
            });
          }
        })
        .catch((err: unknown) => {
          setSubmitting(false);
          const errorMessage = err instanceof Error ? err.message : String(err);
          const errorEntry = chatEntryContract.parse({
            role: 'system',
            type: 'error',
            content: errorMessage,
          });
          setEntries((prev) => [...prev, errorEntry]);
        });
    },
    [guildId, guildSlug, navigate, submitting],
  );

  return (
    <Box
      data-testid="QUEST_CHAT"
      style={{
        display: 'flex',
        flexDirection: 'row',
        flex: 1,
        minHeight: 0,
      }}
    >
      <Box style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <ChatPanelWidget entries={entries} isStreaming={submitting} onSendMessage={handleSend} />
      </Box>
    </Box>
  );
};
