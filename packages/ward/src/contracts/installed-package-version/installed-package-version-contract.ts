/**
 * PURPOSE: The `version` field read off one installed copy's own `package.json`
 * (`<dir>/node_modules/<name>/package.json`) — read verbatim, never semver-parsed, so two DIFFERENT
 * install locations of the same package compare as plain values.
 *
 * USAGE:
 * installedPackageVersionContract.parse('8.3.18');
 * // Returns branded InstalledPackageVersion
 */

import { z } from '#gateway/npm/zod';

export const installedPackageVersionContract = z.string().min(1).brand<'InstalledPackageVersion'>();

export type InstalledPackageVersion = z.infer<typeof installedPackageVersionContract>;
