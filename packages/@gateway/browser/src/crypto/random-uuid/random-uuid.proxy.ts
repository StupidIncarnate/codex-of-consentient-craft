import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

type Uuid = ReturnType<typeof globalThis.crypto.randomUUID>;

export const randomUuidProxy = (): {
  returns: (params: { uuid: Uuid }) => void;
  returnsOnce: (params: { uuid: Uuid }) => void;
  getCalls: () => RecordedCalls;
} => {
  // passthrough: an id nobody staged is minted for real, so a caller that never asserts on it keeps
  // working. randomUUID takes no argument, so the empty address is the only one there is.
  const handle = registerSpyOn({
    object: globalThis.crypto,
    method: 'randomUUID',
    passthrough: true,
  });

  return {
    returns: ({ uuid }: { uuid: Uuid }): void => {
      handle.calledWith([]).returns(uuid);
    },

    // One-shot and ordered: each call answers exactly one mint, in the order staged, and a live
    // one-shot outranks the returns value until the queue is spent.
    returnsOnce: ({ uuid }: { uuid: Uuid }): void => {
      handle.onceFor([]).returns(uuid);
    },

    getCalls: (): RecordedCalls => handle.callsMatching([]),
  };
};
