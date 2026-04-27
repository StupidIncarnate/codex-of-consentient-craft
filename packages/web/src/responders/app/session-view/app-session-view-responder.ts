/**
 * PURPOSE: Provides the readonly session viewer interface as a route element
 *
 * USAGE:
 * <Route path="/:guildSlug/session/:sessionId" element={<AppSessionViewResponder />} />
 * // Renders the readonly session view widget
 */

import { SessionViewWidget } from '../../../widgets/session-view/session-view-widget';

export const AppSessionViewResponder = SessionViewWidget;
