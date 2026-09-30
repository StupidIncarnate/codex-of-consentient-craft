/**
 * PURPOSE: Stub factory for HttpEdge contract
 *
 * USAGE:
 * const edge = HttpEdgeStub({ method: 'GET', urlPattern: '/api/quests', paired: true });
 * // Returns a validated HttpEdge with sensible defaults
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import { httpEdgeContract, type HttpEdge } from './http-edge-contract';

export const HttpEdgeStub = ({ ...props }: StubArgument<HttpEdge> = {}): HttpEdge =>
  httpEdgeContract.parse({
    method: 'GET',
    urlPattern: '/api/quests',
    serverFlowFile: '/repo/packages/server/src/flows/quest/quest-flow.ts',
    serverResponderFile: null,
    webBrokerFile: '/repo/packages/web/src/brokers/quest/list/quest-list-broker.ts',
    paired: true,
    ...props,
  });
