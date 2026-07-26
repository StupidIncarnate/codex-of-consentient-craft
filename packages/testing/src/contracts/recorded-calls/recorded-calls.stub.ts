import type { StubArgument } from '@dungeonmaster/shared/@types';

import { recordedCallsContract } from './recorded-calls-contract';
import type { RecordedCalls } from './recorded-calls-contract';

export const RecordedCallsStub = ({
  ...props
}: StubArgument<RecordedCalls> = {}): RecordedCalls => {
  const { length, map, filter, [Symbol.iterator]: iterator, ...dataProps } = props;
  const emptyCalls: unknown[][] = [];

  return {
    ...recordedCallsContract.parse({
      ...dataProps,
    }),
    length: length ?? emptyCalls.length,
    map: map ?? emptyCalls.map.bind(emptyCalls),
    filter: filter ?? emptyCalls.filter.bind(emptyCalls),
    [Symbol.iterator]: iterator ?? emptyCalls[Symbol.iterator].bind(emptyCalls),
  };
};
