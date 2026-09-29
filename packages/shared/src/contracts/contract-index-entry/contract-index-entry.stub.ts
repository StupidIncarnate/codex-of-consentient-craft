import type { StubArgument } from '@dungeonmaster/shared/@types';

import { contractIndexEntryContract } from './contract-index-entry-contract';
import type { ContractIndexEntry } from './contract-index-entry-contract';

export const ContractIndexEntryStub = ({
  ...props
}: StubArgument<ContractIndexEntry> = {}): ContractIndexEntry =>
  contractIndexEntryContract.parse({
    filePath: '/repo/packages/example/src/contracts/thing/thing-contract.ts',
    packageName: '@repo/example',
    isLayer: false,
    exportedContractNames: ['thingContract'],
    typeExports: [{ typeName: 'Thing', isSchemaInferred: true, isExempt: false }],
    parseSites: [],
    nestedInFiles: [],
    isParsed: false,
    ...props,
  });
