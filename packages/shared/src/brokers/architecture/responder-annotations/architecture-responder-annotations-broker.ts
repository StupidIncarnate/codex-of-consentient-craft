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

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { PackageType } from '../../../contracts/package-type/package-type-contract';
import {
  responderAnnotationMapContract,
  type ResponderAnnotationMap,
} from '../../../contracts/responder-annotation-map/responder-annotation-map-contract';
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
  projectRoot: AbsoluteFilePath;
  packageRoot: AbsoluteFilePath;
}): {
  responderAnnotations: ResponderAnnotationMap;
  startupAnnotations: ResponderAnnotationMap;
} => {
  const empty = responderAnnotationMapContract.parse(new Map());

  if (packageType === 'http-backend') {
    return {
      responderAnnotations: httpEdgesToAnnotationsLayerBroker({ projectRoot, packageRoot }),
      startupAnnotations: empty,
    };
  }
  if (packageType === 'mcp-server') {
    return {
      responderAnnotations: mcpToolsToAnnotationsLayerBroker({ packageRoot }),
      startupAnnotations: empty,
    };
  }
  if (packageType === 'hook-handlers') {
    return {
      responderAnnotations: empty,
      startupAnnotations: hookBinsToAnnotationsLayerBroker({ packageRoot }),
    };
  }
  if (packageType === 'cli-tool') {
    return {
      responderAnnotations: empty,
      startupAnnotations: cliBinToAnnotationsLayerBroker({ packageRoot }),
    };
  }
  // 'frontend-react' uses widgetContext path inside boot-tree, not annotations.
  // 'programmatic-service', 'eslint-plugin', 'frontend-ink' have no type-specific metadata.
  // 'library' is filtered out before reaching this broker.
  return {
    responderAnnotations: empty,
    startupAnnotations: responderAnnotationMapContract.parse(new Map()),
  };
};
