import { kill } from 'process';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

import type { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';

type ProcessGroupId = ReturnType<typeof ProcessGroupIdStub>;

export const processKillGroupAdapterProxy = (): {
  setupSent: (params: { pgid: ProcessGroupId; signal: string }) => void;
  setupAlreadyGone: (params: { pgid: ProcessGroupId; signal: string }) => void;
  setupUnknownError: (params: { pgid: ProcessGroupId; signal: string; error: Error }) => void;
  // The raw arg tuples `kill` was called with, in call order — how a test proves the target is the
  // NEGATED pgid, and how it proves an escalation's two signals fired in order.
  getCallsFor: (params: { pgid: ProcessGroupId }) => unknown[];
} => {
  const handle: MockHandle = registerMock({ fn: kill });

  return {
    setupSent: ({ pgid, signal }: { pgid: ProcessGroupId; signal: string }): void => {
      handle.calledWith([-Number(pgid), signal]).implement(() => true);
    },

    setupAlreadyGone: ({ pgid, signal }: { pgid: ProcessGroupId; signal: string }): void => {
      handle.calledWith([-Number(pgid), signal]).implement(() => {
        const error = new Error('kill ESRCH') as NodeJS.ErrnoException;
        error.code = 'ESRCH';
        throw error;
      });
    },

    setupUnknownError: ({
      pgid,
      signal,
      error,
    }: {
      pgid: ProcessGroupId;
      signal: string;
      error: Error;
    }): void => {
      handle.calledWith([-Number(pgid), signal]).implement(() => {
        throw error;
      });
    },

    getCallsFor: ({ pgid }: { pgid: ProcessGroupId }): unknown[] =>
      handle.callsMatching([-Number(pgid)]).map((call) => call[1]),
  };
};
