import { DispatchHoldStub, UsageLedgerStub } from '@dungeonmaster/shared/contracts';
import { registerModuleMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { dispatchHoldEvaluateBrokerProxy } from '../../../brokers/dispatch-hold/evaluate/dispatch-hold-evaluate-broker.proxy';
import { usageLedgerScanBroker } from '../../../brokers/usage-ledger/scan/usage-ledger-scan-broker';
import { usageLedgerScanBrokerProxy } from '../../../brokers/usage-ledger/scan/usage-ledger-scan-broker.proxy';
import { orchestrationDispatchStateProxy } from '../../../state/orchestration-dispatch/orchestration-dispatch-state.proxy';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { rateLimitsStateProxy } from '../../../state/rate-limits/rate-limits-state.proxy';

type UsageLedger = ReturnType<typeof UsageLedgerStub>;

// The scan walks the whole Claude home and has its own suite over the incremental rules. Here it is
// the reading this pass acts on, so it is replaced at the module boundary and the tests supply a
// ledger directly.
registerModuleMock({ module: '../../../brokers/usage-ledger/scan/usage-ledger-scan-broker' });

export const EvaluateHoldLayerResponderProxy = (): {
  setupLedger: (params: { ledger: UsageLedger }) => void;
  setupNoHeldState: () => void;
  setupHeldState: () => void;
  setupWriteFailure: () => void;
  stderrLines: () => unknown;
  measureEvents: () => unknown[];
} => {
  const evaluateProxy = dispatchHoldEvaluateBrokerProxy();
  const dispatchState = orchestrationDispatchStateProxy();
  const limitsState = rateLimitsStateProxy();
  usageLedgerScanBrokerProxy();
  orchestrationEventsStateProxy();

  const scanMock = usageLedgerScanBroker as jest.MockedFunction<typeof usageLedgerScanBroker>;
  scanMock.mockResolvedValue(
    UsageLedgerStub({ buckets: {}, cursors: {}, ceilings: { fiveHour: null, sevenDay: null } }),
  );

  // The layer's failure path writes here and swallows the error; tests read these lines back
  // rather than letting a real stderr write escape into the run.
  const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrSpy.calledWith([]).returns(true);

  registerSpyOn({ object: Date, method: 'now' })
    .calledWith([])
    .returns(Date.parse('2026-09-13T05:00:00.000Z'));

  const measured: unknown[] = [];

  return {
    setupLedger: ({ ledger }: { ledger: UsageLedger }): void => {
      scanMock.mockResolvedValue(ledger);
    },

    // Each of the three state setups also arms the measurement capture. rateLimitsState is module
    // state, so a reading left by an earlier test would otherwise be this test's `previous` and
    // the change guard would compare against the wrong baseline.
    setupNoHeldState: (): void => {
      dispatchState.setupEmpty();
      limitsState.reset();
      orchestrationEventsState.removeAllListeners();
      orchestrationEventsState.on({
        type: 'rate-limits-updated',
        handler: (event: unknown): void => {
          measured.push(event);
        },
      });
      evaluateProxy.setupNoHeldState();
    },

    setupHeldState: (): void => {
      dispatchState.setupEmpty();
      limitsState.reset();
      orchestrationEventsState.removeAllListeners();
      orchestrationEventsState.on({
        type: 'rate-limits-updated',
        handler: (event: unknown): void => {
          measured.push(event);
        },
      });
      evaluateProxy.setupHeldState({
        hold: DispatchHoldStub({ resumeAt: '2026-09-13T06:00:00.000Z' }),
      });
    },

    setupWriteFailure: (): void => {
      dispatchState.setupEmpty();
      limitsState.reset();
      orchestrationEventsState.removeAllListeners();
      orchestrationEventsState.on({
        type: 'rate-limits-updated',
        handler: (event: unknown): void => {
          measured.push(event);
        },
      });
      evaluateProxy.setupWriteFailure();
    },

    stderrLines: (): unknown => stderrSpy.callsMatching([]),

    measureEvents: (): unknown[] => measured,
  };
};
