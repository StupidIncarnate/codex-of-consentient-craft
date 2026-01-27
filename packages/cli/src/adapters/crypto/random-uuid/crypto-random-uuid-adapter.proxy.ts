import { randomUUID } from 'crypto';

import type { UuidStub } from '../../../contracts/uuid/uuid.stub';

type Uuid = ReturnType<typeof UuidStub>;
type RandomUuidReturnType = ReturnType<typeof randomUUID>;

jest.mock('crypto');

export const cryptoRandomUuidAdapterProxy = (): {
  setupReturns: (params: { uuid: Uuid }) => void;
} => {
  const mockRandomUUID = jest.mocked(randomUUID);

  // Default mock implementation - cast to satisfy randomUUID's template literal return type
  mockRandomUUID.mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479' as RandomUuidReturnType);

  return {
    setupReturns: ({ uuid }: { uuid: Uuid }): void => {
      mockRandomUUID.mockReturnValue(uuid as RandomUuidReturnType);
    },
  };
};
