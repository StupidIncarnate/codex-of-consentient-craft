/**
 * PURPOSE: Stub factory for BusEmitterSite contract
 *
 * USAGE:
 * const site = BusEmitterSiteStub({ eventType: 'chat-output' });
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import { ContentTextStub } from '../content-text/content-text.stub';
import { AbsoluteFilePathStub } from '../absolute-file-path/absolute-file-path.stub';
import { busEmitterSiteContract, type BusEmitterSite } from './bus-emitter-site-contract';

export const BusEmitterSiteStub = ({
  ...props
}: StubArgument<BusEmitterSite> = {}): BusEmitterSite =>
  busEmitterSiteContract.parse({
    emitterFile: AbsoluteFilePathStub({
      value: '/repo/packages/orchestrator/src/responders/chat/replay/chat-replay-responder.ts',
    }),
    eventType: ContentTextStub({ value: 'chat-output' }),
    busExportName: ContentTextStub({ value: 'orchestrationEventsState' }),
    ...props,
  });
