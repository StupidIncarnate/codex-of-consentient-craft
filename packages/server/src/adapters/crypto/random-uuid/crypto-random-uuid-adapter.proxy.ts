jest.mock('crypto');

import crypto from 'crypto';
import type { ProcessIdStub } from '../../../contracts/process-id/process-id.stub';

type ProcessId = ReturnType<typeof ProcessIdStub>;

export const cryptoRandomUuidAdapterProxy = (): {
  returns: (params: { uuid: ProcessId }) => void;
} => {
  const mock = jest.mocked(crypto.randomUUID);

  mock.mockReturnValue(
    '00000000-0000-0000-0000-000000000000' as ReturnType<typeof crypto.randomUUID>,
  );

  return {
    returns: ({ uuid }: { uuid: ProcessId }): void => {
      mock.mockReturnValueOnce(uuid as unknown as ReturnType<typeof crypto.randomUUID>);
    },
  };
};
