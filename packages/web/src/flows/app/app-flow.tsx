/**
 * PURPOSE: Composes child flows into a complete route tree with shared layout
 *
 * USAGE:
 * <AppFlow />
 * // Renders Routes with AppLayoutResponder wrapping HomeFlow, QuestChatFlow, and SessionViewFlow
 */

import { Route, Routes } from 'react-router-dom';

import { AppLayoutResponder } from '../../responders/app/layout/app-layout-responder';
import { HomeFlow } from '../home/home-flow';
import { QuestChatFlow } from '../quest-chat/quest-chat-flow';
import { SessionViewFlow } from '../session-view/session-view-flow';

export const AppFlow = (): React.JSX.Element => (
  <Routes>
    <Route element={<AppLayoutResponder />}>
      {HomeFlow()}
      {QuestChatFlow()}
      {SessionViewFlow()}
    </Route>
  </Routes>
);
