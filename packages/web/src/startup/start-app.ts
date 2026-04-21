/**
 * PURPOSE: Initializes the web application by delegating to the app mount flow
 *
 * USAGE:
 * StartApp();
 * // Mounts React app into #root DOM element
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import { AppMountFlow } from '../flows/app-mount/app-mount-flow';

export const StartApp = (): AdapterResult => {
  AppMountFlow();
  return adapterResultContract.parse({ success: true });
};
