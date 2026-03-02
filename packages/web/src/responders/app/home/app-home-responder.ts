/**
 * PURPOSE: Provides the home page content as a route element
 *
 * USAGE:
 * <Route path="/" element={<AppHomeResponder />} />
 * // Renders the home content with guild selection and session list
 */

import { HomeContentWidget } from '../../../widgets/home-content/home-content-widget';

export const AppHomeResponder = HomeContentWidget;
