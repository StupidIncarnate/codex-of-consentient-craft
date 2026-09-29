import type { StubArgument } from '@dungeonmaster/shared/@types';

import { contractParseSiteContract } from './contract-parse-site-contract';
import type { ContractParseSite } from './contract-parse-site-contract';

export const ContractParseSiteStub = ({
  ...props
}: StubArgument<ContractParseSite> = {}): ContractParseSite =>
  contractParseSiteContract.parse({
    filePath: '/repo/packages/example/src/brokers/thing/thing-broker.ts',
    line: 12,
    ...props,
  });
