import { readdirSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { FileName } from '@dungeonmaster/shared/contracts';

export const fsReaddirAdapterProxy = (): {
  returns: (params: { dirPath: string; files: FileName[] }) => void;
  // For a dirPath that gets read more than once with a DIFFERENT result each time (e.g. a
  // directory that starts empty and gains a file by the time a poll-rescan re-reads it) — a
  // sticky `returns` staged AFTER an earlier one at the SAME dirPath would shadow it for
  // EVERY call, including the first, since staging happens before either real call runs.
  // Queues one addressed one-shot, consumed in registration order; combine with a
  // subsequent sticky `returns` for the state the directory settles into afterward.
  returnsOnceFor: (params: { dirPath: string; files: FileName[] }) => void;
  throws: (params: { dirPath: string; error: Error }) => void;
} => {
  const mock: MockHandle = registerMock({ fn: readdirSync });

  // Composing proxies instantiate this alongside sibling proxies that read OTHER
  // directories nobody described for this test. Lowest-specificity fallback: an
  // undescribed directory reads as empty instead of throwing; any dirPath-specific
  // `returns`/`returnsOnceFor`/`throws` staged below always outranks it.
  mock.calledWith([]).returns([]);

  return {
    returns: ({ dirPath, files }: { dirPath: string; files: FileName[] }): void => {
      mock.calledWith([dirPath]).returns(files as never);
    },
    returnsOnceFor: ({ dirPath, files }: { dirPath: string; files: FileName[] }): void => {
      mock.onceFor([dirPath]).returns(files as never);
    },
    throws: ({ dirPath, error }: { dirPath: string; error: Error }): void => {
      mock.calledWith([dirPath]).implement(() => {
        throw error;
      });
    },
  };
};
