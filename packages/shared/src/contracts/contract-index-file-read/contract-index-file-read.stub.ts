/**
 * PURPOSE: Builds a valid ContractIndexFileRead for tests
 *
 * USAGE:
 * ContractIndexFileReadStub();
 * // Returns a ContractIndexFileRead for a file that imports, exports and parses nothing
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { contractIndexFileReadContract } from './contract-index-file-read-contract';
import type { ContractIndexFileRead } from './contract-index-file-read-contract';

export const ContractIndexFileReadStub = ({
  ...props
}: StubArgument<ContractIndexFileRead> = {}): ContractIndexFileRead =>
  contractIndexFileReadContract.parse({
    imports: [],
    reExports: [],
    exports: null,
    parseCalls: [],
    valueNames: [],
    ...props,
  });
