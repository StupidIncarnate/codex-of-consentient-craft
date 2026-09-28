/**
 * PURPOSE: Reads one file's parse for the facts the census resolves later: the value imports and
 * re-exports (a barrel's whole job), the names the file defines, and the catch-all staging sites a
 * proxy holds. Nothing here resolves a path; that needs every file's facts at once. The parse is
 * `#gateway/npm/typescript`, so this is a broker, not a transformer.
 *
 * USAGE:
 * const facts = sourceFactsExtractBroker({ file, text });
 * // Returns { imports, reExports, exportNames, catchAllSites } for the file
 */
import * as ts from '#gateway/npm/typescript';
import { sourceFactsContract } from '../../../contracts/source-facts/source-facts-contract';
import { censusLayoutStatics } from '../../../statics/census-layout/census-layout-statics';
import { sourceFactsExtractStatementsLayerBroker } from './source-facts-extract-statements-layer-broker';
import { sourceFactsExtractStagingLayerBroker } from './source-facts-extract-staging-layer-broker';
import type { CensusPath } from '../../../contracts/census-path/census-path-contract';
import type { SourceCode } from '../../../contracts/source-code/source-code-contract';
import type { SourceFacts } from '../../../contracts/source-facts/source-facts-contract';

export const sourceFactsExtractBroker = ({
  file,
  text,
}: {
  file: CensusPath;
  text: SourceCode;
}): SourceFacts => {
  const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const stagesMocks = [
    ...censusLayoutStatics.staging.addressMethods,
    censusLayoutStatics.staging.readBackMethod,
  ].some((method) => text.includes(method));

  return sourceFactsContract.parse({
    ...sourceFactsExtractStatementsLayerBroker({ sourceFile }),
    catchAllSites: stagesMocks ? sourceFactsExtractStagingLayerBroker({ sourceFile }) : [],
  });
};
