/**
 * PURPOSE: Creates the ESLint rule that reports a type block naming two or more DISTINCT properties
 * indexed off one host type — `{ startedAt: WorkItem['startedAt']; summary: WorkItem['summary'] }`
 * — because that is a contract taken apart, and the caller had the whole object to pass instead.
 * Reach for this over ban-primitives: that one grades whether a type is branded, this one grades
 * whether the branded pieces should have stayed together.
 *
 * USAGE:
 * const rule = ruleBanFlattenedContractParamsBroker();
 * // Returns EslintRule reporting `{ a: Quest['id']; b: Quest['status'] }` and passing `{ a: Quest['id'] }`
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { identifierContract } from '@dungeonmaster/shared/contracts';
import type { Identifier } from '@dungeonmaster/shared/contracts';
import { tsestreeNodeTypeStatics } from '../../../statics/tsestree-node-type/tsestree-node-type-statics';
import { flattenedContractParamsStatics } from '../../../statics/flattened-contract-params/flattened-contract-params-statics';
import { shouldExcludeFileFromProjectStructureRulesGuard } from '../../../guards/should-exclude-file-from-project-structure-rules/should-exclude-file-from-project-structure-rules-guard';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { isPartialOverrideBlockGuard } from '../../../guards/is-partial-override-block/is-partial-override-block-guard';

export const ruleBanFlattenedContractParamsBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Forbid taking two or more distinct properties off one contract as separate parameters',
      },
      messages: {
        flattenedContract:
          "This block takes {{count}} separate properties off `{{host}}` ({{properties}}). Pass the whole `{{host}}` as one parameter instead — a caller that reassembles it field by field, and a test that has to build every field, are both paying for the split. One indexed property (`{ id: {{host}}['id'] }`) is still fine.",
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = ctx.filename ?? '';

    if (shouldExcludeFileFromProjectStructureRulesGuard({ filename })) {
      return {};
    }

    // A proxy builds test scenarios out of whichever pieces a scenario needs, so taking two fields
    // off one object there is the job rather than a flattened contract. The exclusion guard above
    // lets proxies through deliberately, so this is a second, separate check.
    if (hasFileSuffixGuard({ filename, suffix: 'proxy' })) {
      return {};
    }

    // block node -> host type text -> property text -> the node to report at.
    // Accumulated across visits and drained at Program:exit, because a block is only a violation
    // once every one of its members has been seen.
    const blocks = new Map<Tsestree, Map<Identifier, Map<Identifier, Tsestree>>>();

    return {
      TSIndexedAccessType: (node: Tsestree): void => {
        const source = ctx.sourceCode;
        if (source === undefined || node.objectType === null || node.objectType === undefined) {
          return;
        }

        const host = identifierContract.parse(String(source.getText(node.objectType)));

        // The exemption is decided on the BASE name, never the rendered text. `ReturnType<typeof
        // fooProxy>` is a ReturnType and must stay exempt, and `React.AriaAttributes` is a React
        // type — matching the whole text lets both through the net.
        const baseName = host.split('<')[0] ?? host;
        const rootSegment = baseName.split('.')[0] ?? baseName;

        // A DOM ref or an attribute bag has no whole object to pass instead.
        const { names, prefixes, suffixes } = flattenedContractParamsStatics.exemptHosts;
        const isExempt =
          names.some((name) => name === baseName || name === rootSegment) ||
          prefixes.some((prefix) => baseName.startsWith(prefix)) ||
          suffixes.some((suffix) => baseName.endsWith(suffix));
        if (isExempt) {
          return;
        }

        // The NEAREST enclosing type block owns this access, so a nested literal is judged on its
        // own members rather than its parent's.
        const block = source
          .getAncestors(node)
          .filter(
            (ancestor) =>
              ancestor.type === tsestreeNodeTypeStatics.nodeTypes.TSTypeLiteral ||
              ancestor.type === tsestreeNodeTypeStatics.nodeTypes.TSInterfaceBody,
          )
          .at(-1);
        if (block === undefined) {
          return;
        }

        const property = identifierContract.parse(
          node.indexType === null || node.indexType === undefined
            ? ''
            : String(source.getText(node.indexType)),
        );

        const hostsInBlock = blocks.get(block) ?? new Map<Identifier, Map<Identifier, Tsestree>>();
        const propertiesForHost = hostsInBlock.get(host) ?? new Map<Identifier, Tsestree>();
        // First occurrence wins the report position, so the message points at the top of the run.
        if (!propertiesForHost.has(property)) {
          propertiesForHost.set(property, node);
        }
        hostsInBlock.set(host, propertiesForHost);
        blocks.set(block, hostsInBlock);
      },

      'Program:exit': (): void => {
        const { minimumDistinctProperties } = flattenedContractParamsStatics.limits;

        blocks.forEach((hostsInBlock, block) => {
          hostsInBlock.forEach((propertiesForHost, host) => {
            if (propertiesForHost.size < minimumDistinctProperties) {
              return;
            }
            // A builder's override bag names the same properties, and has no whole object to pass
            // instead — the fields the caller omits are exactly what the builder supplies.
            if (
              isPartialOverrideBlockGuard({
                block,
                hostCount: hostsInBlock.size,
                distinctPropertyCount: propertiesForHost.size,
              })
            ) {
              return;
            }
            const [reportAt] = propertiesForHost.values();
            if (reportAt === undefined) {
              return;
            }
            ctx.report({
              node: reportAt,
              messageId: 'flattenedContract',
              data: {
                host,
                count: String(propertiesForHost.size),
                properties: [...propertiesForHost.keys()].join(', '),
              },
            });
          });
        });
      },
    };
  },
});
