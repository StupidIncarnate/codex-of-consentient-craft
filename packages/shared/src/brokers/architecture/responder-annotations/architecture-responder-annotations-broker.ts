/**
 * PURPOSE: Dispatches to the correct per-type annotation extractor based on a package's
 * PackageType, returning two maps: responderAnnotations (keyed by responder file path) and
 * startupAnnotations (keyed by startup file path). Empty maps are returned for types with no
 * type-specific metadata or whose metadata is rendered elsewhere (frontend-react via widgetContext).
 *
 * USAGE:
 * const { responderAnnotations, startupAnnotations } = architectureResponderAnnotationsBroker({
 *   packageType: packageTypeContract.parse('http-backend'),
 *   projectRoot,
 *   packageRoot,
 * });
 * // responderAnnotations: Map<filePath, { suffix: '[POST /api/...]', childLines: [...] }>
 * // startupAnnotations: empty for http-backend
 *
 * WHEN-TO-USE: Inside package-section-build-layer-broker before invoking the boot-tree renderer
 */

import { architectureResponderAnnotationsResultContract } from '../../../contracts/architecture-responder-annotations-result/architecture-responder-annotations-result-contract';
import type { ArchitectureResponderAnnotationsResult } from '../../../contracts/architecture-responder-annotations-result/architecture-responder-annotations-result-contract';
import type { PackageType } from '../../../contracts/package-type/package-type-contract';
import { responderAnnotationMapContract } from '../../../contracts/responder-annotation-map/responder-annotation-map-contract';
import { httpEdgesToAnnotationsLayerBroker } from './http-edges-to-annotations-layer-broker';
import { mcpToolsToAnnotationsLayerBroker } from './mcp-tools-to-annotations-layer-broker';
import { hookBinsToAnnotationsLayerBroker } from './hook-bins-to-annotations-layer-broker';
import { cliBinToAnnotationsLayerBroker } from './cli-bin-to-annotations-layer-broker';

export const architectureResponderAnnotationsBroker = ({
  packageType,
  projectRoot,
  packageRoot,
}: {
  packageType: PackageType;
  projectRoot: string;
  packageRoot: string;
}): ArchitectureResponderAnnotationsResult => {
  const empty = responderAnnotationMapContract.parse(new Map());

  if (packageType === 'http-backend') {
    return architectureResponderAnnotationsResultContract.parse({
      responderAnnotations: httpEdgesToAnnotationsLayerBroker({ projectRoot, packageRoot }),
      startupAnnotations: empty,
    });
  }
  if (packageType === 'mcp-server') {
    return architectureResponderAnnotationsResultContract.parse({
      responderAnnotations: mcpToolsToAnnotationsLayerBroker({ packageRoot }),
      startupAnnotations: empty,
    });
  }
  if (packageType === 'hook-handlers') {
    return architectureResponderAnnotationsResultContract.parse({
      responderAnnotations: empty,
      startupAnnotations: hookBinsToAnnotationsLayerBroker({ packageRoot }),
    });
  }
  if (packageType === 'cli-tool') {
    return architectureResponderAnnotationsResultContract.parse({
      responderAnnotations: empty,
      startupAnnotations: cliBinToAnnotationsLayerBroker({ packageRoot }),
    });
  }
  // 'frontend-react' uses widgetContext path inside boot-tree, not annotations.
  // 'programmatic-service', 'eslint-plugin', 'frontend-ink' have no type-specific metadata.
  // 'library' is filtered out before reaching this broker.
  return architectureResponderAnnotationsResultContract.parse({
    responderAnnotations: empty,
    startupAnnotations: responderAnnotationMapContract.parse(new Map()),
  });
};
