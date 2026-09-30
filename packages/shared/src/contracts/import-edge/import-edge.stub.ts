/**
 * PURPOSE: Stub factory for ImportEdge contract
 *
 * USAGE:
 * const edge = ImportEdgeStub({ consumerPackage: 'web', sourcePackage: 'shared', barrel: 'contracts' });
 * // Returns a validated ImportEdge with sensible defaults
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import { importEdgeContract, type ImportEdge } from './import-edge-contract';

export const ImportEdgeStub = ({ ...props }: StubArgument<ImportEdge> = {}): ImportEdge =>
  importEdgeContract.parse({
    consumerPackage: 'web',
    sourcePackage: 'shared',
    barrel: 'contracts',
    importCount: 1,
    ...props,
  });
