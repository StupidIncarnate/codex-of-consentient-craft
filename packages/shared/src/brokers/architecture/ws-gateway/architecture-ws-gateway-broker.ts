/**
 * PURPOSE: Returns the WS gateway file paths for the project — the files responsible
 * for owning a WebSocket transport boundary. A gateway is detected by walking adapters
 * for ones that import a known WS-server npm package, then finding non-adapter files
 * that consume those adapters. Repo-agnostic — no hardcoded package or symbol names.
 *
 * USAGE:
 * const gateways = architectureWsGatewayBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 * });
 * // Returns AbsoluteFilePath[] for every WS gateway file in the monorepo
 *
 * WHEN-TO-USE: WS-edge composer attributing the consumer-side `ws←` arrow to the
 * gateway file rather than the bus emitter.
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { wsServerAdaptersFindLayerBroker } from './ws-server-adapters-find-layer-broker';
import { wsGatewayFilesFindLayerBroker } from './ws-gateway-files-find-layer-broker';

export const architectureWsGatewayBroker = ({
  projectRoot,
}: {
  projectRoot: AbsoluteFilePath;
}): AbsoluteFilePath[] => {
  const wsServerAdapters = wsServerAdaptersFindLayerBroker({ projectRoot });
  return wsGatewayFilesFindLayerBroker({ projectRoot, wsServerAdapters });
};
