import { modulePathContract } from './module-path-contract';
import type { ModulePath } from './module-path-contract';

export const ModulePathStub = (
  {
    value,
  }: {
    value: string;
  } = {
    value: 'axios',
  },
): ModulePath => modulePathContract.parse(value);
