/**
 * PURPOSE: Initializes the web application by delegating to the app mount flow
 *
 * USAGE:
 * StartApp();
 * // Mounts React app into #root DOM element
 */

import { AppMountFlow } from '../flows/app-mount/app-mount-flow';

export const StartApp = (): void => {
  AppMountFlow();
};
