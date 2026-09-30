/**
 * PURPOSE: The valid TCP port range the get-server-config output contract enforces
 *
 * USAGE:
 * import { serverPortStatics } from '../../statics/server-port/server-port-statics';
 * serverPortStatics.max;
 */
export const serverPortStatics = {
  min: 1,
  max: 65_535,
} as const;
