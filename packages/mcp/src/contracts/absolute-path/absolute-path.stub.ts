import { absolutePathContract } from './absolute-path-contract';
import type { AbsolutePath } from './absolute-path-contract';

export const AbsolutePathStub = (
  {
    value,
  }: {
    value: string;
  } = {
    value: '/home/user/project',
  },
): AbsolutePath => absolutePathContract.parse(value);
