/**
 * PURPOSE: One third-party package installed at two or more top-level `node_modules` — a gateway
 * package (`packages/@gateway/npm`, say) and an app package resolving different copies, which breaks
 * `instanceof`/singleton-context checks (`MantineProvider`, React hooks, zod `instanceof`) for a
 * caller reaching the package through the gateway versus one importing it directly. `locations`
 * requires at least two entries — a name resolved at a single location is not a violation, and the
 * contract itself is what keeps `duplicateInstallCheckBroker` from ever constructing one for that case.
 *
 * USAGE:
 * duplicateInstallViolationContract.parse({
 *   packageName: '@mantine/core',
 *   locations: [
 *     {location: 'packages/@gateway/npm/node_modules/@mantine/core', version: '8.3.18'},
 *     {location: 'packages/web/node_modules/@mantine/core', version: '8.3.14'},
 *   ],
 * });
 * // Returns: DuplicateInstallViolation
 */

import { z } from '#gateway/npm/zod';
import { duplicateInstallLocationContract } from '../duplicate-install-location/duplicate-install-location-contract';
import { duplicateInstallThresholdsStatics } from '../../statics/duplicate-install-thresholds/duplicate-install-thresholds-statics';

export const duplicateInstallViolationContract = z.object({
  packageName: z.string().min(1).brand<'DuplicateInstallViolationPackageName'>(),
  locations: z
    .array(duplicateInstallLocationContract)
    .min(duplicateInstallThresholdsStatics.counts.minimumLocationsForViolation),
}).brand<'DuplicateInstallViolation'>();

export type DuplicateInstallViolation = z.infer<typeof duplicateInstallViolationContract>;
