/**
 * PURPOSE: Builds a valid ContractUsesScanLayer for tests
 *
 * USAGE:
 * ContractUsesScanLayerStub();
 * // Returns a valid ContractUsesScanLayer
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { contractUsesScanLayerContract } from './contract-uses-scan-layer-contract';
import type { ContractUsesScanLayer } from './contract-uses-scan-layer-contract';

export const ContractUsesScanLayerStub = ({
  ...props
}: StubArgument<ContractUsesScanLayer> = {}): ContractUsesScanLayer =>
  contractUsesScanLayerContract.parse({ parseSites: [], valueTargets: [], ...props });
