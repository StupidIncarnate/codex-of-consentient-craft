import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';
import type { ValueMatcher } from '../../gateway-test-support/value-matcher';

export const consoleErrorProxy = (): {
  getCalls: () => RecordedCalls;
  getCallsFor: (params: { message: ValueMatcher }) => RecordedCalls;
} => {
  // passthrough: true because the first spy registered on console.error in a test fixes the
  // dispatcher for every later one, and a composing proxy that registered first with passthrough
  // must not be turned into a thrower. The empty address below is record-and-swallow: it answers
  // every line with nothing, so output is silenced, and a more specific stage still outranks it.
  const handle = registerSpyOn({ object: globalThis.console, method: 'error', passthrough: true });
  handle.calledWith([]).returns(undefined);

  return {
    getCalls: (): RecordedCalls => handle.callsMatching([]),

    getCallsFor: ({ message }: { message: ValueMatcher }): RecordedCalls =>
      handle.callsMatching([message]),
  };
};
