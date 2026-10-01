/**
 * PURPOSE: Reads one source file's share of the contract index from its text alone: its import and
 * re-export links, what it exports when it is a contract file, and every parse call and value
 * mention of a name it imports as a value, by local name. Nothing here depends on another file, so
 * the contract index cache keeps one of these per file, keyed on the file's content hash; reach for
 * contractIndexFromReadsTransformer to resolve the names across files.
 *
 * USAGE:
 * contractIndexFileReadTransformer({ filePath: '/repo/packages/a/src/brokers/x/x-broker.ts', text, isContractFile: false });
 * // Returns ContractIndexFileRead — { imports, reExports, exports, parseCalls, valueNames }
 */
import * as ts from '#gateway/npm/typescript';

import { contractIndexFileReadContract } from '../../contracts/contract-index-file-read/contract-index-file-read-contract';
import type { ContractIndexFileRead } from '../../contracts/contract-index-file-read/contract-index-file-read-contract';
import { contractFileExportsReadLayerTransformer } from './contract-file-exports-read-layer-transformer';
import { contractUsesScanLayerTransformer } from './contract-uses-scan-layer-transformer';
import { moduleLinksReadLayerTransformer } from './module-links-read-layer-transformer';

export const contractIndexFileReadTransformer = ({
  filePath,
  text,
  isContractFile,
}: {
  filePath: string;
  text: string;
  isContractFile: boolean;
}): ContractIndexFileRead => {
  const sourceFile = ts.createSourceFile(
    filePath,
    text,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const { imports, reExports } = moduleLinksReadLayerTransformer({ sourceFile });
  const fileExports = isContractFile
    ? contractFileExportsReadLayerTransformer({ sourceFile })
    : null;
  const { parseCalls, valueNames } = contractUsesScanLayerTransformer({
    sourceFile,
    candidateNames: imports
      .filter(({ isTypeOnly }) => !isTypeOnly)
      .map(({ localName }) => localName),
  });

  return contractIndexFileReadContract.parse({
    imports,
    reExports,
    exports:
      fileExports === null
        ? null
        : {
            exportedContractNames: fileExports.exportedConstNames,
            typeExports: fileExports.typeExports,
          },
    parseCalls,
    valueNames,
  });
};
