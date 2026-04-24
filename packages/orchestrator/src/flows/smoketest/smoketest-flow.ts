/**
 * PURPOSE: Public smoketest entry point for the orchestrator package
 *
 * USAGE:
 * SmoketestFlow.bootstrap();
 * const { runId, enqueued } = await SmoketestFlow.run({ suite, startPath });
 * const state = SmoketestFlow.getState();
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { SmoketestBootstrapListenerResponder } from '../../responders/smoketest/bootstrap-listener/smoketest-bootstrap-listener-responder';
import { SmoketestRunResponder } from '../../responders/smoketest/run/smoketest-run-responder';
import { SmoketestStateResponder } from '../../responders/smoketest/state/smoketest-state-responder';

type RunParams = Parameters<typeof SmoketestRunResponder>[0];
type RunResult = Awaited<ReturnType<typeof SmoketestRunResponder>>;
type StateResult = ReturnType<typeof SmoketestStateResponder>;

export const SmoketestFlow = {
  bootstrap: (): AdapterResult => SmoketestBootstrapListenerResponder(),

  run: async ({ suite, startPath }: RunParams): Promise<RunResult> =>
    SmoketestRunResponder({ suite, startPath }),

  getState: (): StateResult => SmoketestStateResponder(),
};
