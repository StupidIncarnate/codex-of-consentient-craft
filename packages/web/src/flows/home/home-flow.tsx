/**
 * PURPOSE: Defines the home route mapping to the home responder
 *
 * USAGE:
 * HomeFlow()
 * // Returns <Route path="/" element={<AppHomeResponder />} />
 */

import { Route } from '#gateway/npm/react-router-dom';

import { AppHomeResponder } from '../../responders/app/home/app-home-responder';

export const HomeFlow = (): React.JSX.Element => <Route path="/" element={<AppHomeResponder />} />;
