/**
 * PURPOSE: Provides the quest chat interface as a route element
 *
 * USAGE:
 * <Route path="/:guildSlug/session/:sessionId" element={<AppQuestChatResponder />} />
 * // Renders the quest chat split panel interface
 */

import { QuestChatWidget } from '../../../widgets/quest-chat/quest-chat-widget';

export const AppQuestChatResponder = QuestChatWidget;
