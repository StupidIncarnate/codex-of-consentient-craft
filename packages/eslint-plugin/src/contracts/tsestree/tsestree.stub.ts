import { tsestreeContract } from './tsestree-contract';
import type { Tsestree } from './tsestree-contract';
import type { StubArgument } from '@questmaestro/shared/@types';
import { tsestreeNodeTypeStatics } from '../../statics/tsestree-node-type/tsestree-node-type-statics';

export const TsestreeStub = ({ ...props }: StubArgument<Tsestree> = {}): Tsestree =>
  tsestreeContract.parse({
    type: tsestreeNodeTypeStatics.nodeTypes.Identifier,
    parent: null,
    ...props,
  });

// Re-export for tests (convenient dot notation access)
export const TsestreeNodeType = tsestreeNodeTypeStatics.nodeTypes;
