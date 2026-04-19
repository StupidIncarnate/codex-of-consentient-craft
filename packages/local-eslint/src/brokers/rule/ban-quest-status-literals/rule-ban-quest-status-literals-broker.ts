/**
 * PURPOSE: Bans syntactic quest-status and work-item-status string-literal comparisons — forces callers to use shared status guards instead.
 *
 * USAGE:
 * const rule = ruleBanQuestStatusLiteralsBroker();
 * // Returns ESLint rule that flags `.status === 'in_progress'`, `.startsWith('seek_')`, status switch/case, and inline membership sets.
 *
 * WHEN-TO-USE: Registered in @dungeonmaster-local/local-eslint (this repo only, never shipped) to prevent regression of the pre-split pathseeker status-literal pattern.
 */
import type { Identifier } from '@dungeonmaster/shared/contracts';
import { identifierContract } from '@dungeonmaster/shared/contracts';
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isStatusComparisonAllowlistedGuard } from '../../../guards/is-status-comparison-allowlisted/is-status-comparison-allowlisted-guard';
import { statusLiteralStatics } from '../../../statics/status-literal/status-literal-statics';
import { classifyStatusLiteralTransformer } from '../../../transformers/classify-status-literal/classify-status-literal-transformer';
import { statusLiteralMessageIdTransformer } from '../../../transformers/status-literal-message-id/status-literal-message-id-transformer';
import { isStatusMemberExpressionLayerBroker } from './is-status-member-expression-layer-broker';
import { hasInlineStatusSetElementsLayerBroker } from './has-inline-status-set-elements-layer-broker';

export const ruleBanQuestStatusLiteralsBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban syntactic `.status === literal` / switch-on-status / .startsWith(seek_|explore_|review_) / inline status-membership sets. Use the shared quest-status / work-item-status guards instead.',
      },
      messages: {
        questStatusLiteral:
          "Do not compare .status to the quest-status literal '{{literal}}'. Use the appropriate shared guard (e.g., isActivelyExecutingQuestStatusGuard, isPathseekerRunningQuestStatusGuard, isAnyAgentRunningQuestStatusGuard, etc.) — pre-split literal reads silently compute the wrong answer.",
        workItemStatusLiteral:
          "Do not compare .status to the work-item-status literal '{{literal}}'. Use the appropriate shared guard (e.g., isActiveWorkItemStatusGuard, isCompleteWorkItemStatusGuard, isTerminalWorkItemStatusGuard, etc.).",
        ambiguousStatusLiteral:
          "The literal '{{literal}}' belongs to both quest-status and work-item-status. Pick based on context: quest-status => isActivelyExecutingQuestStatusGuard / isPreExecutionQuestStatusGuard / etc.; work-item-status => isActiveWorkItemStatusGuard / isCompleteWorkItemStatusGuard / isPendingWorkItemStatusGuard / etc.",
        bannedStartsWithPrefix:
          "Do not use .startsWith('{{prefix}}') to detect status groups. Pre-split prefix checks encode pathseeker / explore / review assumptions that post-split semantics have broken. Use the shared guard instead (e.g., isPathseekerRunningQuestStatusGuard for 'seek_').",
        switchOnStatus:
          'Do not switch on .status with known status case literals. Replace the switch with explicit calls to shared status guards / transformers (e.g., nextApprovalQuestStatusTransformer, displayHeaderQuestStatusTransformer).',
        inlineStatusSet:
          'Do not build an inline set/array of known status literals. Use the metadata-backed shared guards (e.g., isTerminalQuestStatusGuard, isAnyAgentRunningQuestStatusGuard) instead of duplicating the enum.',
      },
      schema: [
        {
          type: 'object',
          properties: {
            extraStatusHolders: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Additional identifier names (beyond quest/workItem/wi/item/input/postResult and /Quest$|Item$/) whose `.status` reads should be treated as quest-or-work-item status.',
            },
          },
          additionalProperties: false,
        },
      ],
    },
  }),
  create: (context: unknown) => {
    const ctx = context as EslintContext & {
      options?: { extraStatusHolders?: unknown }[];
    };
    const filename = ctx.filename ?? ctx.getFilename?.() ?? '';

    if (isStatusComparisonAllowlistedGuard({ filename: String(filename) })) {
      return {};
    }

    const optionZero = ctx.options?.[0];
    const rawExtras = optionZero?.extraStatusHolders;
    const extraAllowlist: readonly Identifier[] = Array.isArray(rawExtras)
      ? rawExtras.map((name) => identifierContract.parse(String(name)))
      : [];

    const bannedPrefixes = statusLiteralStatics.bannedStartsWithPrefixes;

    return {
      BinaryExpression: (node: Tsestree): void => {
        const { operator } = node;
        if (operator !== '===' && operator !== '!==' && operator !== '==' && operator !== '!=') {
          return;
        }

        const { left, right } = node;
        if (left === null || left === undefined || right === null || right === undefined) {
          return;
        }

        const leftIsStatusMember = isStatusMemberExpressionLayerBroker({
          node: left,
          extraAllowlist,
        });
        const rightIsStatusMember = isStatusMemberExpressionLayerBroker({
          node: right,
          extraAllowlist,
        });

        const literalSide: Tsestree | null =
          leftIsStatusMember && right.type === 'Literal' && typeof right.value === 'string'
            ? right
            : rightIsStatusMember && left.type === 'Literal' && typeof left.value === 'string'
              ? left
              : null;

        if (literalSide === null) {
          return;
        }

        const literalValue = String(literalSide.value);
        const kind = classifyStatusLiteralTransformer({ literal: literalValue });
        if (kind === null) {
          return;
        }
        ctx.report({
          node,
          messageId: statusLiteralMessageIdTransformer({ kind }),
          data: { literal: literalValue },
        });
      },

      SwitchStatement: (node: Tsestree): void => {
        if (
          !isStatusMemberExpressionLayerBroker({
            node: node.discriminant ?? null,
            extraAllowlist,
          })
        ) {
          return;
        }

        const cases = node.cases ?? [];
        const hasKnownStatusCase = cases.some((switchCase) => {
          const testNode = switchCase.test;
          if (
            testNode === null ||
            testNode === undefined ||
            testNode.type !== 'Literal' ||
            typeof testNode.value !== 'string'
          ) {
            return false;
          }
          return classifyStatusLiteralTransformer({ literal: testNode.value }) !== null;
        });

        if (hasKnownStatusCase) {
          ctx.report({ node, messageId: 'switchOnStatus' });
        }
      },

      CallExpression: (node: Tsestree): void => {
        const { callee } = node;
        if (callee === null || callee === undefined || callee.type !== 'MemberExpression') {
          return;
        }
        const { property } = callee;
        if (property === null || property === undefined || property.type !== 'Identifier') {
          return;
        }
        if (String(property.name ?? '') !== 'startsWith') {
          return;
        }
        const firstArg = node.arguments?.[0];
        if (
          firstArg === null ||
          firstArg === undefined ||
          firstArg.type !== 'Literal' ||
          typeof firstArg.value !== 'string'
        ) {
          return;
        }
        const argValue = firstArg.value;
        if (!bannedPrefixes.some((prefix) => prefix === argValue)) {
          return;
        }
        ctx.report({
          node,
          messageId: 'bannedStartsWithPrefix',
          data: { prefix: argValue },
        });
      },

      ArrayExpression: (node: Tsestree): void => {
        // Skip arrays that are the argument to `new Set(...)` — the NewExpression listener handles those.
        // Also skip arrays passed to any function call (e.g., `z.enum([...])`, `['a','b'].forEach(...)`) —
        // those are not inline membership sets; they are enum / iteration plumbing. The inline-set
        // diagnostic targets assignment-shaped literals only (const foo = [...]).
        const { parent } = node;
        if (parent === null || parent === undefined) {
          return;
        }
        if (parent.type === 'NewExpression' || parent.type === 'CallExpression') {
          return;
        }

        if (hasInlineStatusSetElementsLayerBroker({ elements: node.elements ?? [] })) {
          ctx.report({ node, messageId: 'inlineStatusSet' });
        }
      },

      NewExpression: (node: Tsestree): void => {
        const { callee } = node;
        if (callee === null || callee === undefined || callee.type !== 'Identifier') {
          return;
        }
        if (String(callee.name ?? '') !== 'Set') {
          return;
        }
        const firstArg = node.arguments?.[0];
        if (firstArg === null || firstArg === undefined || firstArg.type !== 'ArrayExpression') {
          return;
        }
        if (hasInlineStatusSetElementsLayerBroker({ elements: firstArg.elements ?? [] })) {
          ctx.report({ node, messageId: 'inlineStatusSet' });
        }
      },
    };
  },
});
