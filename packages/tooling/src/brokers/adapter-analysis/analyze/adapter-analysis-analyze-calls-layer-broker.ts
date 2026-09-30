/**
 * PURPOSE: Sorts every call in an adapter by what it reaches. A call whose root is an import from
 * outside the repo or from the gateway, or an undeclared global (`setTimeout`, `process`), is an
 * outside call. A contract `.parse` is ignored. A call into another adapter, into other repo code,
 * on a value the adapter holds, chained onto another call's result, or `new Promise` is a reason
 * the adapter holds logic. JavaScript built-ins (`JSON`, `Map`) are ignored.
 *
 * USAGE:
 * adapterAnalysisAnalyzeCallsLayerBroker({ nodes, bindings, declared, workspaceScope, workspacePackageNames });
 * // Returns { outsideCalls, reasons }
 */
import * as ts from '#gateway/npm/typescript';
import { adapterLogicReasonContract } from '../../../contracts/adapter-logic-reason/adapter-logic-reason-contract';
import { censusLanguageGlobalsStatics } from '../../../statics/census-language-globals/census-language-globals-statics';
import { importOriginClassifyTransformer } from '../../../transformers/import-origin-classify/import-origin-classify-transformer';
import type { AdapterLogicReason } from '../../../contracts/adapter-logic-reason/adapter-logic-reason-contract';
import type { AdapterAnalysis } from '../../../contracts/adapter-analysis/adapter-analysis-contract';
import type { OutsideCall } from '../../../contracts/outside-call/outside-call-contract';
import { outsideCallContract } from '../../../contracts/outside-call/outside-call-contract';
import { adapterAnalysisContract } from '../../../contracts/adapter-analysis/adapter-analysis-contract';

export const adapterAnalysisAnalyzeCallsLayerBroker = ({
  nodes,
  bindings,
  declared,
  workspaceScope,
  workspacePackageNames,
}: {
  nodes: readonly ts.Node[];
  bindings: ReadonlyMap<string, OutsideCall>;
  declared: ReadonlySet<string>;
  workspaceScope: string | null;
  workspacePackageNames: readonly string[];
}): AdapterAnalysis => {
  const outsideCalls: AdapterAnalysis['outsideCalls'] = [];
  const reasons = new Set<AdapterLogicReason>();

  for (const node of nodes) {
    if (!ts.isCallExpression(node) && !ts.isNewExpression(node)) {
      continue;
    }

    const props: string[] = [];
    let root: ts.Expression = node.expression;
    let chained = false;
    while (
      ts.isPropertyAccessExpression(root) ||
      ts.isElementAccessExpression(root) ||
      ts.isCallExpression(root) ||
      ts.isNewExpression(root) ||
      ts.isNonNullExpression(root) ||
      ts.isParenthesizedExpression(root) ||
      ts.isAwaitExpression(root)
    ) {
      if (ts.isPropertyAccessExpression(root) && !chained) {
        props.unshift(root.name.text);
      }
      chained ||= ts.isCallExpression(root) || ts.isNewExpression(root);
      root = root.expression;
    }

    if (root.kind === ts.SyntaxKind.ImportKeyword || root.kind === ts.SyntaxKind.SuperKeyword) {
      continue;
    }
    if (!ts.isIdentifier(root)) {
      reasons.add(
        adapterLogicReasonContract.parse(
          props.length > 0 ? 'method-on-held-value' : 'calls-held-value',
        ),
      );
      continue;
    }
    if (chained) {
      reasons.add(adapterLogicReasonContract.parse('chained-call'));
      continue;
    }

    const rootName = root.text;
    const binding = bindings.get(rootName);
    const [firstProp] = props;
    const lastProp = props.at(-1);

    if (binding !== undefined) {
      const origin = importOriginClassifyTransformer({
        specifier: binding.module,
        workspaceScope,
        workspacePackageNames,
      });
      if (origin === 'repo') {
        if (lastProp !== 'parse' && lastProp !== 'safeParse') {
          reasons.add(
            adapterLogicReasonContract.parse(
              rootName.endsWith('Adapter') ? 'calls-adapter' : 'calls-repo-code',
            ),
          );
        }
      } else {
        const isNamed = binding.name !== 'default' && binding.name !== '*';
        outsideCalls.push(
          outsideCallContract.parse({
            module: binding.module,
            name: isNamed ? binding.name : props.join('.') || binding.name,
          }),
        );
      }
    } else if (declared.has(rootName)) {
      reasons.add(
        adapterLogicReasonContract.parse(
          props.length > 0 ? 'method-on-held-value' : 'calls-held-value',
        ),
      );
    } else if (censusLanguageGlobalsStatics.names.some((name) => name === rootName)) {
      if (rootName === 'Promise' && ts.isNewExpression(node)) {
        reasons.add(adapterLogicReasonContract.parse('promise-construction'));
      }
    } else {
      outsideCalls.push(
        outsideCallContract.parse({
          module: rootName,
          name: firstProp ?? rootName,
        }),
      );
    }
  }

  return adapterAnalysisContract.parse({ outsideCalls, reasons: [...reasons] });
};
