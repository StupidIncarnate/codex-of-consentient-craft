import type { z } from 'zod';

import { packageTypeContract } from './package-type-contract';
import type { PackageType } from './package-type-contract';

type PackageTypeInput = z.input<typeof packageTypeContract>;

export const PackageTypeStub = ({ value }: { value?: PackageTypeInput } = {}): PackageType =>
  packageTypeContract.parse(value ?? 'library');
