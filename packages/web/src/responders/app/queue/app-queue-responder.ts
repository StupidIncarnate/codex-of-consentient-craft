/**
 * PURPOSE: Provides the execution queue page content as a route element
 *
 * USAGE:
 * <Route path="/queue" element={<AppQueueResponder />} />
 * // Renders the full queue list with the Node dispatcher play/pause toggle
 */

import { QueuePageWidget } from '../../../widgets/queue-page/queue-page-widget';

export const AppQueueResponder = QueuePageWidget;
