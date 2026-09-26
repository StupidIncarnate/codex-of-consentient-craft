/**
 * PURPOSE: Builds a valid PackageSpecifierParts for tests, defaulting to a gateway package's own
 * `./testing` subpath split.
 *
 * USAGE:
 * PackageSpecifierPartsStub({ packageName: '@dungeonmaster/bin', subpath: 'testing' });
 */

import type { StubArgument } from '@dungeonmaster/shared/@types';
import { packageSpecifierPartsContract } from './package-specifier-parts-contract';
import type { PackageSpecifierParts } from './package-specifier-parts-contract';

export const PackageSpecifierPartsStub = ({
  ...props
}: StubArgument<PackageSpecifierParts> = {}): PackageSpecifierParts =>
  packageSpecifierPartsContract.parse({
    packageName: '@dungeonmaster/bin',
    subpath: 'testing',
    ...props,
  });
