/**
 * PURPOSE: Extracts the orchestrator namespace call from a server responder file by reading
 * direct StartOrchestrator calls (from @dungeonmaster/orchestrator imports) or legacy orchestrator
 * adapter imports and calling namespaceCallFirstExtractTransformer
 *
 * USAGE:
 * const method = architectureOrchestratorMethodExtractBroker({
 *   serverResponderFile: '/repo/packages/server/src/responders/quest/start-responder.ts',
 * });
 * // Returns ContentText like 'StartOrchestrator.startQuest({...})' or null if unresolvable
 *
 * WHEN-TO-USE: Tracing the orchestrator call for an HTTP edge — used by binding flow trace and
 * the boot-tree's widget subtree renderer
 */

import { importStatementsExtractTransformer } from '../../../transformers/import-statements-extract/import-statements-extract-transformer';
import { relativeImportResolveTransformer } from '../../../transformers/relative-import-resolve/relative-import-resolve-transformer';
import { namespaceCallFirstExtractTransformer } from '../../../transformers/namespace-call-first-extract/namespace-call-first-extract-transformer';
import { architectureSourceReadBroker } from '../source-read/architecture-source-read-broker';

const ORCHESTRATOR_PACKAGE = '@dungeonmaster/orchestrator';
const ORCHESTRATOR_ADAPTER_MARKER = 'adapters/orchestrator/';
const START_ORCHESTRATOR_NAMESPACE = 'StartOrchestrator';

export const architectureOrchestratorMethodExtractBroker = ({
  serverResponderFile,
}: {
  serverResponderFile: string | null;
}): string | null => {
  if (serverResponderFile === null) return null;

  const responderSource = architectureSourceReadBroker({ filePath: serverResponderFile });
  if (responderSource === undefined) return null;

  const imports = importStatementsExtractTransformer({ source: responderSource });

  const isDirectOrchImport = imports.some(
    (p) => p === ORCHESTRATOR_PACKAGE || p.startsWith(`${ORCHESTRATOR_PACKAGE}/`),
  );
  if (isDirectOrchImport) {
    const extracted = namespaceCallFirstExtractTransformer({
      source: responderSource,
      targetNamespace: START_ORCHESTRATOR_NAMESPACE,
    });
    if (extracted !== null) {
      return extracted;
    }
  }

  const orchImports = imports.filter((p) => p.includes(ORCHESTRATOR_ADAPTER_MARKER));
  const [firstOrchImport] = orchImports;
  if (firstOrchImport !== undefined) {
    const adpAbsPath = relativeImportResolveTransformer({
      sourceFile: serverResponderFile,
      importPath: firstOrchImport,
    });
    if (adpAbsPath !== null) {
      const adpSource = architectureSourceReadBroker({ filePath: adpAbsPath });
      if (adpSource !== undefined) {
        return namespaceCallFirstExtractTransformer({ source: adpSource });
      }
    }
  }

  return null;
};
