import { kill } from 'process';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

import type { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';

type ProcessGroupId = ReturnType<typeof ProcessGroupIdStub>;

export const processIsAliveAdapterProxy = (): {
  setupAlive: (params: { pgid: ProcessGroupId }) => void;
  setupGone: (params: { pgid: ProcessGroupId }) => void;
  // `error` stays `unknown` rather than `Error` — a test proving realm-safety stages a value built
  // by `vm.runInNewContext`, which this repo's own Error is not the constructor of.
  setupUnknownError: (params: { pgid: ProcessGroupId; error: unknown }) => void;
  // The raw arg tuple the probe called `kill` with — how a test proves the probe is signal `0`
  // (no real signal ever reaches the group) against the NEGATED pgid.
  getCallFor: (params: { pgid: ProcessGroupId }) => unknown;
} => {
  const handle: MockHandle = registerMock({ fn: kill });

  return {
    setupAlive: ({ pgid }: { pgid: ProcessGroupId }): void => {
      handle.calledWith([-Number(pgid), 0]).implement(() => true);
    },

    setupGone: ({ pgid }: { pgid: ProcessGroupId }): void => {
      handle.calledWith([-Number(pgid), 0]).implement(() => {
        const error = new Error('kill ESRCH') as NodeJS.ErrnoException;
        error.code = 'ESRCH';
        throw error;
      });
    },

    setupUnknownError: ({ pgid, error }: { pgid: ProcessGroupId; error: unknown }): void => {
      handle.calledWith([-Number(pgid), 0]).implement(() => {
        throw error;
      });
    },

    getCallFor: ({ pgid }: { pgid: ProcessGroupId }): unknown =>
      handle.callsMatching([-Number(pgid), 0]).at(-1),
  };
};
