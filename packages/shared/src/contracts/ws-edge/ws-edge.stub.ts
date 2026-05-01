/**
 * PURPOSE: Stub factory for WsEdge contract
 *
 * USAGE:
 * const edge = WsEdgeStub({ eventType: 'chat-output', paired: true });
 * // Returns a validated WsEdge with sensible defaults
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import { ContentTextStub } from '../content-text/content-text.stub';
import { AbsoluteFilePathStub } from '../absolute-file-path/absolute-file-path.stub';
import { wsEdgeContract, type WsEdge } from './ws-edge-contract';

export const WsEdgeStub = ({ ...props }: StubArgument<WsEdge> = {}): WsEdge =>
  wsEdgeContract.parse({
    eventType: ContentTextStub({ value: 'chat-output' }),
    emitterFile: AbsoluteFilePathStub({
      value: '/repo/packages/orchestrator/src/responders/chat/start/chat-start-responder.ts',
    }),
    consumerFiles: [
      AbsoluteFilePathStub({
        value: '/repo/packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.ts',
      }),
    ],
    paired: true,
    ...props,
  });
