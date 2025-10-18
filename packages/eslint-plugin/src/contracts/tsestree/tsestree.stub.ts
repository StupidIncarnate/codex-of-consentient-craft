import { tsestreeContract } from './tsestree-contract';
import type { Tsestree } from './tsestree-contract';
import type { StubArgument } from '@questmaestro/shared/@types';

export const TsestreeStub = ({ ...props }: StubArgument<Tsestree> = {}): Tsestree =>
  tsestreeContract.parse({
    type: 'Identifier',
    parent: null,
    ...props,
  });
