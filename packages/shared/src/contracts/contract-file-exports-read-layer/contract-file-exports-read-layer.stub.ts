/**
 * PURPOSE: Builds a valid ContractFileExportsReadLayer for tests
 *
 * USAGE:
 * ContractFileExportsReadLayerStub();
 * // Returns a valid ContractFileExportsReadLayer
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { contractFileExportsReadLayerContract } from './contract-file-exports-read-layer-contract';
import type { ContractFileExportsReadLayer } from './contract-file-exports-read-layer-contract';

export const ContractFileExportsReadLayerStub = ({
  ...props
}: StubArgument<ContractFileExportsReadLayer> = {}): ContractFileExportsReadLayer =>
  contractFileExportsReadLayerContract.parse({ exportedConstNames: [], typeExports: [], ...props });
