/**
 * PURPOSE: Builds a valid PackageWardSettings for tests
 *
 * USAGE:
 * PackageWardSettingsStub();
 * // Returns a package.json shape that opts its integration tests into a build
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { packageWardSettingsContract } from './package-ward-settings-contract';
import type { PackageWardSettings } from './package-ward-settings-contract';

export const PackageWardSettingsStub = ({
  ...props
}: StubArgument<PackageWardSettings> = {}): PackageWardSettings =>
  packageWardSettingsContract.parse({ ward: { integrationBuild: true }, ...props });
