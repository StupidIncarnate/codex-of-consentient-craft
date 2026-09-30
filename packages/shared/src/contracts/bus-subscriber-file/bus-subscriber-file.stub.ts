/**
 * PURPOSE: Stub factory for BusSubscriberFile contract
 *
 * USAGE:
 * const sub = BusSubscriberFileStub({ busExportName: 'myBus' });
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import { busSubscriberFileContract, type BusSubscriberFile } from './bus-subscriber-file-contract';

export const BusSubscriberFileStub = ({
  ...props
}: StubArgument<BusSubscriberFile> = {}): BusSubscriberFile =>
  busSubscriberFileContract.parse({
    subscriberFile: '/repo/packages/server/src/responders/server/init/server-init-responder.ts',
    busExportName: 'orchestrationEventsState',
    ...props,
  });
