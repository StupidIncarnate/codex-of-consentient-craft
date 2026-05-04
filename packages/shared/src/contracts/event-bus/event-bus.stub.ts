/**
 * PURPOSE: Stub factory for EventBus contract
 *
 * USAGE:
 * const bus = EventBusStub({ exportName: 'myBus' });
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import { ContentTextStub } from '../content-text/content-text.stub';
import { AbsoluteFilePathStub } from '../absolute-file-path/absolute-file-path.stub';
import { eventBusContract, type EventBus } from './event-bus-contract';

export const EventBusStub = ({ ...props }: StubArgument<EventBus> = {}): EventBus =>
  eventBusContract.parse({
    stateFile: AbsoluteFilePathStub({
      value:
        '/repo/packages/orchestrator/src/state/orchestration-events/orchestration-events-state.ts',
    }),
    exportName: ContentTextStub({ value: 'orchestrationEventsState' }),
    ...props,
  });
