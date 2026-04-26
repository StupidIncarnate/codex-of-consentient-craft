/**
 * PURPOSE: Proxy for orchestrator-get-quest-planning-notes-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorGetQuestPlanningNotesAdapterProxy();
 * proxy.returns({ result: { success: true, data: { surfaceReports: [] } } });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type GetPlanningNotesResult = Awaited<ReturnType<typeof StartOrchestrator.getPlanningNotes>>;

const emptyPlanningNotes = (): GetPlanningNotesResult => ({
  success: true,
  data: { surfaceReports: [], blightReports: [] },
});

export const orchestratorGetQuestPlanningNotesAdapterProxy = (): {
  returns: (params: { result: GetPlanningNotesResult }) => void;
  throws: (params: { error: Error }) => void;
  getLastCalledInput: () => unknown;
} => {
  const handle = registerMock({ fn: StartOrchestrator.getPlanningNotes });

  handle.mockResolvedValue(emptyPlanningNotes());

  return {
    returns: ({ result }: { result: GetPlanningNotesResult }): void => {
      handle.mockResolvedValueOnce(result);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
    getLastCalledInput: (): unknown => {
      const { calls } = handle.mock;
      const lastCall = calls[calls.length - 1];
      return lastCall?.[0];
    },
  };
};
