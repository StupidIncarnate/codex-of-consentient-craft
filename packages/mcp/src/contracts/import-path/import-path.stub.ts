import { importPathContract } from './import-path-contract';
import type { ImportPath } from './import-path-contract';

export const ImportPathStub = (
  {
    value,
  }: {
    value: string;
  } = {
    value: 'statics',
  },
): ImportPath => importPathContract.parse(value);
