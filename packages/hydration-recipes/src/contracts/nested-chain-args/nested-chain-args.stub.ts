/**
 * PURPOSE: Builds a valid `NestedChainArgs` for a test that needs one but does not care how deep
 * the chain goes.
 *
 * USAGE:
 * NestedChainArgsStub({ depth: 2 });
 * // Returns NestedChainArgs
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { nestedChainArgsContract } from './nested-chain-args-contract';
import type { NestedChainArgs } from './nested-chain-args-contract';

export const NestedChainArgsStub = ({
  ...props
}: StubArgument<NestedChainArgs> = {}): NestedChainArgs =>
  nestedChainArgsContract.parse({
    depth: 2,
    ...props,
  });
