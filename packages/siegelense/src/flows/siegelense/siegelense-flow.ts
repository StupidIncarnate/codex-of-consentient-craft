/**
 * PURPOSE: Starting point flow wiring the run responder — replace with real orchestration as the
 * package grows. Flows hold no logic of their own.
 *
 * USAGE:
 * await SiegelenseFlow({ input: 'example' });
 */

import { SiegelenseRunResponder } from '../../responders/siegelense/run/siegelense-run-responder';

export const SiegelenseFlow = async ({ input }: { input: string }): Promise<{ handled: boolean }> =>
  SiegelenseRunResponder({ input });
