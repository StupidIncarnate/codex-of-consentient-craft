import type { StubArgument } from '../../@types/stub-argument.type';

import { moduleResolutionContract } from './module-resolution-contract';
import type { ModuleResolution } from './module-resolution-contract';

export const ModuleResolutionStub = ({
  ...props
}: StubArgument<ModuleResolution> = {}): ModuleResolution =>
  moduleResolutionContract.parse({
    path: '/repo/node_modules/@dungeonmaster/cli/package.json',
    resolvedFrom: 'run-root',
    ...props,
  });
