/**
 * PURPOSE: Defines the readonly session view route mapping the per-session URL to the session view responder
 *
 * USAGE:
 * SessionViewFlow()
 * // Returns <Route path="/:guildSlug/session/:sessionId" element={<AppSessionViewResponder />} />
 */

import { Route } from 'react-router-dom';

import { AppSessionViewResponder } from '../../responders/app/session-view/app-session-view-responder';

export const SessionViewFlow = (): React.JSX.Element => (
  <Route path="/:guildSlug/session/:sessionId" element={<AppSessionViewResponder />} />
);
