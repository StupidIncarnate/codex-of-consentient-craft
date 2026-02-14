/**
 * PURPOSE: Single source of truth for default ports, hostname, and data directory names across all environments
 *
 * USAGE:
 * import { environmentStatics } from '@dungeonmaster/shared/statics';
 * environmentStatics.defaultPort; // 3737
 * environmentStatics.hostname; // 'dungeonmaster.localhost'
 */

export const environmentStatics = {
  defaultPort: 3737,
  hostname: 'dungeonmaster.localhost',
  dataDir: '.dungeonmaster',
  devDataDir: '.dungeonmaster-dev',
  devPort: 4737,
  testPort: 5737,
  serverUrlPlaceholder: '{{SERVER_URL}}',
} as const;
