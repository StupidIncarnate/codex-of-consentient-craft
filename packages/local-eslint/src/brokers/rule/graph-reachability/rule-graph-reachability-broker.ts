/**
 * PURPOSE: Refuses a family graph a route cannot reach, or that reaches no terminal — the
 * `questFlowStatics` half of story 06's safety net. The step-graph half (`agentFlowStatics`) is
 * checked at server boot instead: this package depends on `@dungeonmaster/eslint-plugin`,
 * `@dungeonmaster/shared` and `zod` only, and `agentFlowStatics` lives in
 * `@dungeonmaster/orchestrator`, whose barrel runs six live bootstraps at module load — see
 * `scrolls/orcha-changes/06-graph-reachability.md`'s `OPEN` for the full reasoning.
 *
 * USAGE:
 * const rule = ruleGraphReachabilityBroker();
 * // Returns ESLint rule that reports one `graphViolation` per
 * // graphReachabilityViolationsTransformer finding, on the quest-flow-statics.ts Program node,
 * // and stays silent on every other filename.
 *
 * NOTE: Reads `questFlowStatics` from @dungeonmaster/shared/statics at module-load time. A stale
 * `dist/` for shared causes a stale check; rebuild shared first
 * (`npm run build --workspace=@dungeonmaster/shared`) before lint.
 */
import { routedGraphContract } from '@dungeonmaster/shared/contracts';
import { questFlowStatics } from '@dungeonmaster/shared/statics';
import { graphReachabilityViolationsTransformer } from '@dungeonmaster/shared/transformers';
import { eslintRuleContract } from '@dungeonmaster/eslint-plugin';
import type { EslintRule, EslintContext, Tsestree } from '@dungeonmaster/eslint-plugin';
import { graphReachabilityStatics } from '../../../statics/graph-reachability/graph-reachability-statics';
import { isGraphReachabilityScopeFileGuard } from '../../../guards/is-graph-reachability-scope-file/is-graph-reachability-scope-file-guard';

const graphViolations = Object.entries(questFlowStatics).flatMap(([questType, family]) => {
  const graph = routedGraphContract.parse({
    graphName: questType,
    entry: family.entry,
    nodes: family.families,
  });
  return graphReachabilityViolationsTransformer({
    graph,
    terminals: graphReachabilityStatics.familyTerminals,
    exemptFlag: 'appendedAtMerge',
    knownPrompts: [],
    knownHandlers: [],
  });
});

export const ruleGraphReachabilityBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Refuse a family graph (questFlowStatics) a route cannot reach, or that reaches no terminal. agentFlowStatics is checked at server boot instead of here.',
      },
      messages: {
        graphViolation: '{{violation}}',
      },
      schema: [],
    },
  }),
  create: (context: unknown) => {
    const ctx = context as EslintContext;
    const filename = ctx.filename ?? ctx.getFilename?.() ?? '';

    if (
      !isGraphReachabilityScopeFileGuard({
        filename: String(filename),
        scopeFilePaths: graphReachabilityStatics.scopeFilePaths,
      })
    ) {
      return {};
    }

    return {
      Program: (node: Tsestree): void => {
        for (const violation of graphViolations) {
          ctx.report({
            node,
            messageId: 'graphViolation',
            data: { violation: String(violation) },
          });
        }
      },
    };
  },
});
