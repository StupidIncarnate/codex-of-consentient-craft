/**
 * PURPOSE: Stub factory for ImportEdge contract
 *
 * USAGE:
 * const edge = ImportEdgeStub({ consumerPackage: 'web', sourcePackage: 'shared', barrel: 'contracts' });
 * // Returns a validated ImportEdge with sensible defaults
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import { ContentTextStub } from '../content-text/content-text.stub';
import { importEdgeContract, type ImportEdge } from './import-edge-contract';

export const ImportEdgeStub = ({ ...props }: StubArgument<ImportEdge> = {}): ImportEdge =>
  importEdgeContract.parse({
    consumerPackage: ContentTextStub({ value: 'web' }),
    sourcePackage: ContentTextStub({ value: 'shared' }),
    barrel: ContentTextStub({ value: 'contracts' }),
    importCount: 1,
    ...props,
  });
