/**
 * PURPOSE: Defines the execution queue route mapping to the queue responder
 *
 * USAGE:
 * QueueFlow()
 * // Returns <Route path="/queue" element={<AppQueueResponder />} />
 */

import { Route } from 'react-router-dom';

import { AppQueueResponder } from '../../responders/app/queue/app-queue-responder';

export const QueueFlow = (): React.JSX.Element => (
  <Route path="/queue" element={<AppQueueResponder />} />
);
