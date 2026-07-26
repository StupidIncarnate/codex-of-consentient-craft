import { randomUUID } from 'crypto';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import type { UuidStub } from '../../../contracts/uuid/uuid.stub';

type Uuid = ReturnType<typeof UuidStub>;
type RandomUuidReturnType = ReturnType<typeof randomUUID>;

export const cryptoRandomUuidAdapterProxy = (): {
  setupReturns: (params: { uuid: Uuid }) => void;
} => {
  const handle = registerMock({ fn: randomUUID });

  return {
    // randomUUID takes no arguments — [] is the only honest address.
    setupReturns: ({ uuid }: { uuid: Uuid }): void => {
      handle.calledWith([]).returns(uuid as RandomUuidReturnType);
    },
  };
};
