/**
 * PURPOSE: Brands the version string read off @dungeonmaster/server's own package.json. Carries the
 * same brand tag as shared's healthStatusPayloadContract.version, so the payload broker's parse into
 * HealthStatusPayload re-brands the adapter's return with no type assertion.
 *
 * USAGE:
 * serverVersionContract.parse('0.1.0');
 * // Returns branded ServerVersion
 */

import { z } from 'zod';

export const serverVersionContract = z.string().min(1).brand<'ServerVersion'>();

export type ServerVersion = z.infer<typeof serverVersionContract>;
