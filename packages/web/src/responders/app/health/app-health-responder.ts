/**
 * PURPOSE: Provides the server health page content as a route element
 *
 * USAGE:
 * <Route path="/health" element={<AppHealthResponder />} />
 * // Renders the server health snapshot page
 */

import { HealthPageWidget } from '../../../widgets/health-page/health-page-widget';

export const AppHealthResponder = HealthPageWidget;
