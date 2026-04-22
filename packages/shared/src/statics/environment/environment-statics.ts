/**
 * PURPOSE: Single source of truth for the default port, hostname, and placeholder token used across runtime scripts
 *
 * USAGE:
 * import { environmentStatics } from '@dungeonmaster/shared/statics';
 * environmentStatics.defaultPort; // 3737
 * environmentStatics.hostname; // 'dungeonmaster.localhost'
 */

export const environmentStatics = {
  defaultPort: 3737,
  hostname: 'dungeonmaster.localhost',
  serverUrlPlaceholder: '{{SERVER_URL}}',
} as const;
