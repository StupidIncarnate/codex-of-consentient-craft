/**
 * PURPOSE: Resolves which half of a claimed `PortPair` (if any) a lane process's declared
 * `portRole` addresses. Indexes `ports` by `portRole` directly rather than branching on the
 * literal role name — `no-hardcoded-package-names` reads a bare `=== 'api'`/`'web'` comparison as
 * deciding something ON a package name, which `portRole` only happens to share the spelling of.
 * The `as 'api' | 'web'` strips `PortRole`'s brand for the index expression only — TypeScript
 * cannot use a branded literal union to index a plain object type, even though the runtime string
 * is identical either way. Pure, so `lane-boot-broker`'s per-process ready-URL building is
 * testable without a spawned process.
 *
 * USAGE:
 * laneProcessPortResolveTransformer({ portRole: PortRoleStub({ value: 'api' }), ports: PortPairStub() });
 * // Returns ports.api
 */

import type { LaneProcess } from '../../contracts/lane-process/lane-process-contract';
import type { PortPair } from '../../contracts/port-pair/port-pair-contract';

export const laneProcessPortResolveTransformer = ({
  portRole,
  ports,
}: {
  portRole: LaneProcess['portRole'];
  ports: PortPair;
}): PortPair['api'] | null => (portRole === null ? null : ports[portRole as 'api' | 'web']);
