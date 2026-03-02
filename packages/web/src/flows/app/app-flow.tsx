/**
 * PURPOSE: Composes child flows into a complete route tree with shared layout
 *
 * USAGE:
 * <AppFlow />
 * // Renders Routes with AppLayoutResponder wrapping HomeFlow and QuestChatFlow
 */

import { Route, Routes } from 'react-router-dom';

import { AppLayoutResponder } from '../../responders/app/layout/app-layout-responder';
import { HomeFlow } from '../home/home-flow';
import { QuestChatFlow } from '../quest-chat/quest-chat-flow';

export const AppFlow = (): React.JSX.Element => (
  <Routes>
    <Route element={<AppLayoutResponder />}>
      {HomeFlow()}
      {QuestChatFlow()}
    </Route>
  </Routes>
);
