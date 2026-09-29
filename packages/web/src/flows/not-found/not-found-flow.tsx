/**
 * PURPOSE: Defines the catch-all route, mapping any path no sibling route matches to the not-found responder
 *
 * USAGE:
 * NotFoundFlow()
 * // Returns <Route path="*" element={<AppNotFoundResponder />} />
 */

import { Route } from 'react-router-dom';

import { AppNotFoundResponder } from '../../responders/app/not-found/app-not-found-responder';

export const NotFoundFlow = (): React.JSX.Element => (
  <Route path="*" element={<AppNotFoundResponder />} />
);
