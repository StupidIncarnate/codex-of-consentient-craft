/**
 * PURPOSE: Reads one adapter file and reports what it does: every call into the outside world (or
 * the gateway) and every structural reason it is more than a forwarded call. The census decides
 * pass-through or logic from this plus the gateway index. The parse is `#gateway/npm/typescript`,
 * so this is a broker.
 *
 * USAGE:
 * adapterAnalysisAnalyzeBroker({ file, text, workspaceScope: '@acme', workspacePackageNames: [] });
 * // Returns { outsideCalls: [{ module: 'fs/promises', name: 'readFile' }], reasons: [] }
 */
import * as ts from '#gateway/npm/typescript';
import { adapterAnalysisContract } from '../../../contracts/adapter-analysis/adapter-analysis-contract';
import { adapterAnalysisAnalyzeCallsLayerBroker } from './adapter-analysis-analyze-calls-layer-broker';
import { adapterAnalysisAnalyzeScopeLayerBroker } from './adapter-analysis-analyze-scope-layer-broker';
import { adapterAnalysisAnalyzeStructureLayerBroker } from './adapter-analysis-analyze-structure-layer-broker';
import type { AdapterAnalysis } from '../../../contracts/adapter-analysis/adapter-analysis-contract';

export const adapterAnalysisAnalyzeBroker = ({
  file,
  text,
  workspaceScope,
  workspacePackageNames,
}: {
  file: string;
  text: string;
  workspaceScope: string | null;
  workspacePackageNames: readonly string[];
}): AdapterAnalysis => {
  const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const nodes: ts.Node[] = [];
  const pending: ts.Node[] = [sourceFile];

  while (pending.length > 0) {
    const node = pending.pop();
    if (node === undefined) {
      continue;
    }
    nodes.push(node);
    ts.forEachChild(node, (child) => {
      pending.push(child);
    });
  }
  nodes.sort((a, b) => a.pos - b.pos);

  const { bindings, declared } = adapterAnalysisAnalyzeScopeLayerBroker({ sourceFile, nodes });
  const calls = adapterAnalysisAnalyzeCallsLayerBroker({
    nodes,
    bindings,
    declared,
    workspaceScope,
    workspacePackageNames,
  });
  const structure = adapterAnalysisAnalyzeStructureLayerBroker({ nodes });

  return adapterAnalysisContract.parse({
    outsideCalls: calls.outsideCalls,
    reasons: [...new Set([...structure, ...calls.reasons])],
  });
};
