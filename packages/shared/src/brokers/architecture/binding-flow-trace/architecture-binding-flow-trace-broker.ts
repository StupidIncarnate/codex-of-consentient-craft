/**
 * PURPOSE: Traces HTTP and WebSocket flow connections for a widget binding by resolving
 * the binding file path, finding its broker imports, and matching them to HTTP and WS edges
 *
 * USAGE:
 * const trace = architectureBindingFlowTraceBroker({
 *   bindingName: contentTextContract.parse('use-quests'),
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/web'),
 *   httpEdges,
 *   wsEdges,
 * });
 * // Returns { httpFlows: [...], wsEvents: [...] }
 *
 * WHEN-TO-USE: Project-map renderers building per-binding flow sub-lines under each widget —
 * the boot-tree's widget subtree renderer and the standalone widget tree section
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import type { HttpEdge } from '../../../contracts/http-edge/http-edge-contract';
import type { WsEdge } from '../../../contracts/ws-edge/ws-edge-contract';
import { bindingNameToFilePathTransformer } from '../../../transformers/binding-name-to-file-path/binding-name-to-file-path-transformer';
import { importStatementsExtractTransformer } from '../../../transformers/import-statements-extract/import-statements-extract-transformer';
import { relativeImportResolveTransformer } from '../../../transformers/relative-import-resolve/relative-import-resolve-transformer';
import { architectureSourceReadBroker } from '../source-read/architecture-source-read-broker';
import { architectureOrchestratorMethodExtractBroker } from '../orchestrator-method-extract/architecture-orchestrator-method-extract-broker';
import { architectureBackRefBroker } from '../back-ref/architecture-back-ref-broker';

const BROKERS_MARKER = 'brokers/';

export const architectureBindingFlowTraceBroker = ({
  bindingName,
  packageRoot,
  projectRoot,
  httpEdges,
  wsEdges,
}: {
  bindingName: ContentText;
  packageRoot: AbsoluteFilePath;
  projectRoot: AbsoluteFilePath;
  httpEdges: HttpEdge[];
  wsEdges: WsEdge[];
}): {
  httpFlows: {
    method: ContentText;
    urlPattern: ContentText;
    serverRef: ContentText | null;
    orchestratorMethod: ContentText | null;
  }[];
  wsEvents: {
    eventType: ContentText;
    emitterRef: ContentText | null;
  }[];
} => {
  const bindingFilePath = bindingNameToFilePathTransformer({ bindingName, packageRoot });

  const bindingSource = architectureSourceReadBroker({ filePath: bindingFilePath });
  if (bindingSource === undefined) {
    return { httpFlows: [], wsEvents: [] };
  }

  const imports = importStatementsExtractTransformer({ source: bindingSource });
  const brokerImports = imports.filter((p) => String(p).includes(BROKERS_MARKER));

  const httpFlows: {
    method: ContentText;
    urlPattern: ContentText;
    serverRef: ContentText | null;
    orchestratorMethod: ContentText | null;
  }[] = [];

  for (const brokerImport of brokerImports) {
    const brokerAbsPath = relativeImportResolveTransformer({
      sourceFile: bindingFilePath,
      importPath: brokerImport,
    });
    if (brokerAbsPath === null) continue;

    const matchedEdges = httpEdges.filter(
      (edge) => edge.webBrokerFile !== null && String(edge.webBrokerFile) === String(brokerAbsPath),
    );

    for (const edge of matchedEdges) {
      const serverFile = edge.serverResponderFile ?? edge.serverFlowFile;
      const serverRef =
        serverFile === null
          ? null
          : architectureBackRefBroker({ filePath: serverFile, projectRoot });

      const orchestratorMethod = architectureOrchestratorMethodExtractBroker({
        serverResponderFile: edge.serverResponderFile,
      });

      httpFlows.push({
        method: edge.method,
        urlPattern: edge.urlPattern,
        serverRef,
        orchestratorMethod,
      });
    }
  }

  const wsEvents = wsEdges
    .filter((edge) => edge.consumerFiles.some((f) => String(f) === String(bindingFilePath)))
    .map((edge) => {
      // Prefer the gateway file (the file that owns the WS transport boundary) for
      // the back-ref. The emitter file is the bus origin, not the WS broadcaster —
      // labelling consumer bindings with the gateway is the architecturally accurate
      // attribution. Fall back to the emitter when no gateway is detected so repos
      // without a WS-server adapter still render something useful.
      const refSourceFile = edge.wsGatewayFile ?? edge.emitterFile;
      return {
        eventType: edge.eventType,
        emitterRef:
          refSourceFile === null
            ? null
            : architectureBackRefBroker({ filePath: refSourceFile, projectRoot }),
      };
    });

  return { httpFlows, wsEvents };
};
