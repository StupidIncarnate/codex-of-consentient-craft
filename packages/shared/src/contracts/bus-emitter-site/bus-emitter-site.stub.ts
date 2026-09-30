/**
 * PURPOSE: Stub factory for BusEmitterSite contract
 *
 * USAGE:
 * const site = BusEmitterSiteStub({ eventType: 'chat-output' });
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import { busEmitterSiteContract, type BusEmitterSite } from './bus-emitter-site-contract';

export const BusEmitterSiteStub = ({
  ...props
}: StubArgument<BusEmitterSite> = {}): BusEmitterSite =>
  busEmitterSiteContract.parse({
    emitterFile: '/repo/packages/orchestrator/src/responders/chat/replay/chat-replay-responder.ts',
    eventType: 'chat-output',
    busExportName: 'orchestrationEventsState',
    ...props,
  });
