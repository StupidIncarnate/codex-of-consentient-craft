import type { DispatchHoldStub } from '@dungeonmaster/shared/contracts';
import { DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { dispatchStateReadBrokerProxy } from '../../dispatch-state/read/dispatch-state-read-broker.proxy';
import { dispatchStateWriteBrokerProxy } from '../../dispatch-state/write/dispatch-state-write-broker.proxy';

type DispatchHold = ReturnType<typeof DispatchHoldStub>;

export const dispatchHoldEvaluateBrokerProxy = (): {
  setupNoHeldState: () => void;
  setupHeldState: (params: { hold: DispatchHold }) => void;
  setupPlayingHeldState: (params: { hold: DispatchHold }) => void;
  setupWriteFailure: () => void;
  getWrittenContent: () => unknown;
} => {
  const readProxy = dispatchStateReadBrokerProxy();
  const writeProxy = dispatchStateWriteBrokerProxy();

  return {
    setupNoHeldState: (): void => {
      readProxy.setupStateFile({ json: JSON.stringify(DispatchStateStub()) });
      writeProxy.setupWriteSuccess();
    },

    setupHeldState: ({ hold }: { hold: DispatchHold }): void => {
      readProxy.setupStateFile({ json: JSON.stringify(DispatchStateStub({ hold })) });
      writeProxy.setupWriteSuccess();
    },

    // The case that matters most: the user has pressed play AND a hold is standing, so a lift must
    // preserve `node-playing` rather than writing the mode back to paused.
    setupPlayingHeldState: ({ hold }: { hold: DispatchHold }): void => {
      readProxy.setupStateFile({
        json: JSON.stringify(DispatchStateStub({ mode: 'node-playing', hold })),
      });
      writeProxy.setupWriteSuccess();
    },

    // Nothing held, a breaching snapshot, and a state file that refuses the write — the path where
    // the guardrail decided to hold but could not record it.
    setupWriteFailure: (): void => {
      readProxy.setupStateFile({ json: JSON.stringify(DispatchStateStub()) });
      writeProxy.setupWriteFailure({ error: new Error('disk full') });
    },

    getWrittenContent: (): unknown => writeProxy.getWrittenContent(),
  };
};
