/**
 * PURPOSE: The half of the brand rules that needs another file to tell a new value from a reuse: a
 * `z.string()` or `z.number()` leaf in a contract that carries no brand gets `.brand<'Owner…Key'>()`,
 * unless the owner index says `enforce-owner-field-reuse` claims that key, in which case the key
 * reuses another owner's field and takes no brand of its own. It shares one matcher with that rule so
 * the two can never disagree about a key. Reach for this over `require-object-contract-brands`,
 * which grades only the file it lints and so cannot know `questId` is a reuse. Reads every workspace
 * package once per process, so it runs in ward's lint pass only and is registered `off` until the
 * brand migration is done.
 *
 * USAGE:
 * const rule = ruleRequireObjectContractBrandsIndexedBroker();
 * // Reports `title: z.string().min(1)` in quest-contract.ts and fixes it to
 * // `title: z.string().min(1).brand<'QuestTitle'>()`
 */
import { ownerIndexBuildBroker } from '@dungeonmaster/shared/brokers';
import {
  ownerIndexNameMatchTransformer,
  repoRootFromSourcePathTransformer,
} from '@dungeonmaster/shared/transformers';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isAstUnbrandedLeafGuard } from '../../../guards/is-ast-unbranded-leaf/is-ast-unbranded-leaf-guard';
import { isFileInFolderTypeGuard } from '../../../guards/is-file-in-folder-type/is-file-in-folder-type-guard';
import { isInTestDirGuard } from '../../../guards/is-in-test-dir/is-in-test-dir-guard';
import { astExpectedBrandTextTransformer } from '../../../transformers/ast-expected-brand-text/ast-expected-brand-text-transformer';
import { astFieldListOwnersTransformer } from '../../../transformers/ast-field-list-owners/ast-field-list-owners-transformer';
import { astLeafBrandAnchorTransformer } from '../../../transformers/ast-leaf-brand-anchor/ast-leaf-brand-anchor-transformer';
import { astPropertyKeyNameTransformer } from '../../../transformers/ast-property-key-name/ast-property-key-name-transformer';
import { dotCountTransformer } from '../../../transformers/dot-count/dot-count-transformer';
import { ownerIndexFilePackageTransformer } from '../../../transformers/owner-index-file-package/owner-index-file-package-transformer';
import { layerContractCheckLayerBroker } from './layer-contract-check-layer-broker';

export const ruleRequireObjectContractBrandsIndexedBroker = (): TSESLint.RuleModule<
  'leafNoBrand' | 'layerBrandText' | 'layerImportedElsewhere'
> => ({
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: {
      description:
        "Every string or number in an object contract carries a brand whose text is the owner's name plus the field key, unless the key reuses another owner's field",
    },
    messages: {
      leafNoBrand: "Field {{key}} has no brand. Add .brand<'{{expected}}'>().",
      layerBrandText:
        "Layer {{layer}} is used under key {{key}}. Its brand must be '{{expected}}'.",
      layerImportedElsewhere:
        'Layer {{layer}} is imported by {{file}}. Only its parent, {{parent}}, may import it.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const { filename } = ctx;
    const baseName = filename.split('/').pop() ?? '';
    const rootDir = repoRootFromSourcePathTransformer({ filePath: filename });

    // A test, proxy, stub, harness or declaration file has more than one dot in its name.
    if (
      !(filename.endsWith('.ts') || filename.endsWith('.tsx')) ||
      dotCountTransformer({ str: baseName }) > 1 ||
      isInTestDirGuard({ filename }) ||
      rootDir === undefined ||
      !isFileInFolderTypeGuard({ filename, folderType: 'contracts', suffix: 'contract' })
    ) {
      return {};
    }

    // A layer's owner is the file that nests it, so its texts and its importers are the layer
    // broker's; a leaf in it never takes the layer's own const name.
    const isLayer = baseName.includes('-layer-contract');
    const fieldListOwners = new Map<string, string>();

    return {
      Program: (node: TSESTree.Program): void => {
        if (isLayer) {
          layerContractCheckLayerBroker({ context: ctx, program: node, filename });
          return;
        }
        for (const [list, owner] of astFieldListOwnersTransformer({ program: node })) {
          fieldListOwners.set(list, owner);
        }
      },

      CallExpression: (node: TSESTree.CallExpression): void => {
        if (isLayer || !isAstUnbrandedLeafGuard({ node })) {
          return;
        }

        const expected = astExpectedBrandTextTransformer({ node, fieldListOwners });
        if (expected === null) {
          return;
        }

        // The field the leaf belongs to: an array element or a record value answers to its array's key.
        let owningProperty: TSESTree.Node | undefined = node.parent;
        while (owningProperty !== undefined && owningProperty.type !== AST_NODE_TYPES.Property) {
          owningProperty = owningProperty.parent;
        }
        const key =
          owningProperty?.type === AST_NODE_TYPES.Property
            ? astPropertyKeyNameTransformer({ property: owningProperty })
            : null;

        if (key !== null) {
          const ownerIndex = ownerIndexBuildBroker({ rootDir });
          const packageName = ownerIndexFilePackageTransformer({
            ownerIndex,
            filePath: filename,
          });
          if (
            packageName !== undefined &&
            ownerIndexNameMatchTransformer({ ownerIndex, packageName, name: key }) !== undefined
          ) {
            return;
          }
        }

        const anchor = astLeafBrandAnchorTransformer({ node });
        ctx.report({
          node,
          messageId: 'leafNoBrand',
          data: { key: key ?? 'value', expected },
          fix: (fixer) => fixer.insertTextAfter(anchor, `.brand<'${expected}'>()`),
        });
      },
    };
  },
});
