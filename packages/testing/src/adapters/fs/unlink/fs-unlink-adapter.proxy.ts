import { unlinkSync } from 'fs';
import { registerMock } from '../../../register-mock';
import type { RecordedCalls } from '../../../register-mock';

export const fsUnlinkAdapterProxy = (): {
  throws: ({ filePath, error }: { filePath: string; error: Error }) => void;
  getCallArgs: () => RecordedCalls;
} => {
  const mock = registerMock({ fn: unlinkSync });

  mock.calledWith([]).implement(() => undefined);

  return {
    throws: ({ filePath, error }: { filePath: string; error: Error }): void => {
      mock.onceFor([filePath]).throws(error);
    },
    getCallArgs: (): RecordedCalls => mock.callsMatching([]),
  };
};
