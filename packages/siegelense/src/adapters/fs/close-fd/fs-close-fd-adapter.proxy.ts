import { closeSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FileDescriptor } from '../../../contracts/file-descriptor/file-descriptor-contract';

export const fsCloseFdAdapterProxy = (): {
  succeeds: (params: { fd: FileDescriptor }) => void;
  throws: (params: { fd: FileDescriptor; error: Error }) => void;
  getClosedFds: () => unknown[];
} => {
  const handle = registerMock({ fn: closeSync });

  return {
    succeeds: ({ fd }: { fd: FileDescriptor }): void => {
      handle.calledWith([fd]).returns(undefined);
    },

    throws: ({ fd, error }: { fd: FileDescriptor; error: Error }): void => {
      handle.calledWith([fd]).throws(error);
    },

    getClosedFds: (): unknown[] => handle.callsMatching([]).map((call) => call[0]),
  };
};
