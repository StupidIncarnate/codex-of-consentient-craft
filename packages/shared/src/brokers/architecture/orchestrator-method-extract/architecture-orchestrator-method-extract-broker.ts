/**
 * PURPOSE: Extracts the orchestrator namespace call from a server responder file by reading
 * the responder's orchestrator adapter import and calling namespaceCallFirstExtractTransformer
 *
 * USAGE:
 * const method = architectureOrchestratorMethodExtractBroker({
 *   serverResponderFile: absoluteFilePathContract.parse('/repo/packages/server/src/responders/quest/start-responder.ts'),
 * });
 * // Returns ContentText like 'StartOrchestrator.startQuest({...})' or null if unresolvable
 *
 * WHEN-TO-USE: Tracing the orchestrator call for an HTTP edge — used by binding flow trace and
 * the boot-tree's widget subtree renderer
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { importStatementsExtractTransformer } from '../../../transformers/import-statements-extract/import-statements-extract-transformer';
import { relativeImportResolveTransformer } from '../../../transformers/relative-import-resolve/relative-import-resolve-transformer';
import { namespaceCallFirstExtractTransformer } from '../../../transformers/namespace-call-first-extract/namespace-call-first-extract-transformer';
import { architectureSourceReadBroker } from '../source-read/architecture-source-read-broker';

const ORCHESTRATOR_ADAPTER_MARKER = 'adapters/orchestrator/';

export const architectureOrchestratorMethodExtractBroker = ({
  serverResponderFile,
}: {
  serverResponderFile: AbsoluteFilePath | null;
}): ContentText | null => {
  if (serverResponderFile === null) return null;

  const responderSource = architectureSourceReadBroker({ filePath: serverResponderFile });
  if (responderSource === undefined) return null;

  const imports = importStatementsExtractTransformer({ source: responderSource });
  const orchImports = imports.filter((p) => String(p).includes(ORCHESTRATOR_ADAPTER_MARKER));

  const [firstOrchImport] = orchImports;
  if (firstOrchImport === undefined) return null;

  const adpAbsPath = relativeImportResolveTransformer({
    sourceFile: serverResponderFile,
    importPath: firstOrchImport,
  });
  if (adpAbsPath === null) return null;

  const adpSource = architectureSourceReadBroker({ filePath: adpAbsPath });
  if (adpSource === undefined) return null;

  return namespaceCallFirstExtractTransformer({ source: adpSource });
};
