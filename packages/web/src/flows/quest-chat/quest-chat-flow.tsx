/**
 * PURPOSE: Defines quest chat routes mapping guild-scoped paths to the quest chat responder
 *
 * USAGE:
 * QuestChatFlow()
 * // Returns Route elements for /:guildSlug/quest and /:guildSlug/quest/:questId
 */

import { Route } from 'react-router-dom';

import { AppQuestChatResponder } from '../../responders/app/quest-chat/app-quest-chat-responder';

export const QuestChatFlow = (): React.JSX.Element => (
  <>
    <Route path="/:guildSlug/quest" element={<AppQuestChatResponder />} />
    <Route path="/:guildSlug/quest/:questId" element={<AppQuestChatResponder />} />
  </>
);
