import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isImplementationFileGuard } from '../../../guards/is-implementation-file/is-implementation-file-guard';
import { extractFileMetadataTransformer } from '../../../transformers/extract-file-metadata/extract-file-metadata-transformer';

export const ruleEnforceFileMetadataBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Enforce file metadata comments with PURPOSE and USAGE fields in implementation files',
      },
      messages: {
        missingMetadata:
          'Implementation file must have a metadata comment with PURPOSE and USAGE fields. Example:\n\n/**\n * PURPOSE: [One-line description]\n *\n * USAGE:\n * [Code example]\n * // [Comment explaining return]\n *\n * RELATED: [comma-separated list] (optional)\n */',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const { filename } = ctx;

    // Only check implementation files (single-dot, not .test.ts, .proxy.ts, etc.)
    if (!isImplementationFileGuard({ filename: filename ?? '' })) {
      return {};
    }

    return {
      // Check comments once at Program level
      Program: (node: Tsestree): void => {
        // Get all comments in the file
        const allComments = ctx.sourceCode?.getAllComments?.() ?? [];

        // Check if any comment has valid metadata
        const hasValidMetadata = allComments.some((comment) => {
          // Extract comment value (value is unknown, needs type check)
          const commentValue = comment.value;
          if (typeof commentValue !== 'string') {
            return false;
          }

          const metadata = extractFileMetadataTransformer({ commentText: commentValue });
          return metadata !== null;
        });

        if (!hasValidMetadata) {
          ctx.report({
            node,
            messageId: 'missingMetadata',
          });
        }
      },
    };
  },
});
