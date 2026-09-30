/**
 * PURPOSE: Builds a valid ContractFileOwnersReadLayer for tests
 *
 * USAGE:
 * ContractFileOwnersReadLayerStub();
 * // Returns a valid ContractFileOwnersReadLayer
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { contractFileOwnersReadLayerContract } from './contract-file-owners-read-layer-contract';
import type { ContractFileOwnersReadLayer } from './contract-file-owners-read-layer-contract';

export const ContractFileOwnersReadLayerStub = ({
  ...props
}: StubArgument<ContractFileOwnersReadLayer> = {}): ContractFileOwnersReadLayer =>
  contractFileOwnersReadLayerContract.parse({
    owners: [],
    standaloneBrands: [],
    enums: [],
    ...props,
  });
