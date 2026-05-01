/**
 * PURPOSE: Stub factory for DirectCallEdge contract
 *
 * USAGE:
 * const edge = DirectCallEdgeStub({ callerPackage: 'server', calleePackage: 'orchestrator' });
 * // Returns a validated DirectCallEdge with sensible defaults
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import { ContentTextStub } from '../content-text/content-text.stub';
import { AbsoluteFilePathStub } from '../absolute-file-path/absolute-file-path.stub';
import { directCallEdgeContract, type DirectCallEdge } from './direct-call-edge-contract';

export const DirectCallEdgeStub = ({
  ...props
}: StubArgument<DirectCallEdge> = {}): DirectCallEdge =>
  directCallEdgeContract.parse({
    callerPackage: ContentTextStub({ value: 'server' }),
    calleePackage: ContentTextStub({ value: 'orchestrator' }),
    adapterFiles: [
      AbsoluteFilePathStub({
        value:
          '/repo/packages/server/src/adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.ts',
      }),
    ],
    methodNames: [ContentTextStub({ value: 'getQuest' })],
    ...props,
  });
