/**
 * PURPOSE: Provides the catch-all page for a URL no other route claims, as a route element
 *
 * USAGE:
 * <Route path="*" element={<AppNotFoundResponder />} />
 * // Renders the not-found page with the unmatched path and a link home
 */

import { NotFoundPageWidget } from '../../../widgets/not-found-page/not-found-page-widget';

export const AppNotFoundResponder = NotFoundPageWidget;
