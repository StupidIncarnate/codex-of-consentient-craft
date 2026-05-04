/**
 * PURPOSE: Stub factory for BusSubscriberFile contract
 *
 * USAGE:
 * const sub = BusSubscriberFileStub({ busExportName: 'myBus' });
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import { ContentTextStub } from '../content-text/content-text.stub';
import { AbsoluteFilePathStub } from '../absolute-file-path/absolute-file-path.stub';
import { busSubscriberFileContract, type BusSubscriberFile } from './bus-subscriber-file-contract';

export const BusSubscriberFileStub = ({
  ...props
}: StubArgument<BusSubscriberFile> = {}): BusSubscriberFile =>
  busSubscriberFileContract.parse({
    subscriberFile: AbsoluteFilePathStub({
      value: '/repo/packages/server/src/responders/server/init/server-init-responder.ts',
    }),
    busExportName: ContentTextStub({ value: 'orchestrationEventsState' }),
    ...props,
  });
