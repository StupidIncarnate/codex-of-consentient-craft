import type { StubArgument } from '@dungeonmaster/shared/@types';

import { filePairWorkUnitContract } from './file-pair-work-unit-contract';
import type { FilePairWorkUnit } from './file-pair-work-unit-contract';

export const FilePairWorkUnitStub = ({
  ...props
}: StubArgument<FilePairWorkUnit> = {}): FilePairWorkUnit =>
  filePairWorkUnitContract.parse({
    implPath: '/home/user/project/src/brokers/user/fetch/user-fetch-broker.ts',
    testPath: '/home/user/project/src/brokers/user/fetch/user-fetch-broker.test.ts',
    ...props,
  });
