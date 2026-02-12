/**
 * PURPOSE: Defines immutable server configuration values for the HTTP server
 *
 * USAGE:
 * serverConfigStatics.network.port;
 * // Returns 3737
 */

export const serverConfigStatics = {
  network: {
    port: 3737,
    host: 'localhost',
  },
} as const;
