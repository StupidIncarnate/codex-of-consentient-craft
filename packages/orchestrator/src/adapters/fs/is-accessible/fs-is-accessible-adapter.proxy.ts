import { access } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsIsAccessibleAdapterProxy = (): {
  resolves: (params: { filePath: FilePath }) => void;
  rejects: (params: { filePath: FilePath; error: Error }) => void;
  defaultsToNotFound: () => void;
  defaultsToFound: () => void;
} => {
  const mock: MockHandle = registerMock({ fn: access });

  return {
    resolves: ({ filePath }: { filePath: FilePath }): void => {
      mock.calledWith([filePath]).resolves(undefined);
    },

    rejects: ({ filePath, error }: { filePath: FilePath; error: Error }): void => {
      mock.calledWith([filePath]).rejects(error);
    },

    // Callers (e.g. questModifyBroker) check disk existence for a contract source path
    // that only exists inside the test's input literal, unknowable at proxy-construction
    // time. This low-specificity fallback answers "nothing exists" for any undescribed
    // path; a later path-specific `resolves`/`rejects` always outranks it.
    defaultsToNotFound: (): void => {
      mock
        .calledWith([])
        .rejects(Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }));
    },

    // Symmetric counterpart to defaultsToNotFound — for a boolean "is this path accessible"
    // check where the caller's path is unknowable at proxy-construction time (e.g. one path
    // per guild entry, decided by the test's loop) and only the boolean answer matters.
    defaultsToFound: (): void => {
      mock.calledWith([]).resolves(undefined);
    },
  };
};
