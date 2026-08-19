/**
 * PURPOSE: Defines the /health route mapping to the health responder
 *
 * USAGE:
 * HealthFlow()
 * // Returns <Route path="/health" element={<AppHealthResponder />} />
 */

import { Route } from 'react-router-dom';

import { AppHealthResponder } from '../../responders/app/health/app-health-responder';

export const HealthFlow = (): React.JSX.Element => (
  <Route path="/health" element={<AppHealthResponder />} />
);
