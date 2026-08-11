/**
 * PURPOSE: Keeps a package name that means "the frontend" or "the backend" out of executable strings, so this system keeps working in a repo whose UI package is called something else — or that has several of them. It reads only what the parser hands it as a value, which is what leaves comments and JSDoc examples alone: those document a real path in THIS repo and decide nothing.
 *
 * USAGE:
 * const rule = ruleNoHardcodedPackageNamesBroker();
 * // Returns ESLint rule that flags `const x = 'packages/web/src/brokers'` and `pkg === 'web'`,
 * // and stays silent on the same text inside a comment.
 *
 * WHEN-TO-USE: Registered in @dungeonmaster/local-eslint (this repo only, never shipped) to hold the standing "never hardcode on a package name" constraint — every such decision goes through `packageType`, resolved from the target repo's own disk, and every consumer handles a set.
 */
import { eslintRuleContract } from '@dungeonmaster/eslint-plugin';
import type { EslintRule, EslintContext, Tsestree } from '@dungeonmaster/eslint-plugin';
import { packageNameLiteralStatics } from '../../../statics/package-name-literal/package-name-literal-statics';
import { bannedPackagePathNamesTransformer } from '../../../transformers/banned-package-path-names/banned-package-path-names-transformer';
import { isPackageNameLiteralAllowlistedGuard } from '../../../guards/is-package-name-literal-allowlisted/is-package-name-literal-allowlisted-guard';
import { isPackageNameComparisonOperandGuard } from '../../../guards/is-package-name-comparison-operand/is-package-name-comparison-operand-guard';

export const ruleNoHardcodedPackageNamesBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban a frontend/backend package name from executable strings and from branch conditions. Resolve the package from its packageType instead, and handle a set of packages rather than one.',
      },
      messages: {
        hardcodedPackagePath:
          "Do not hardcode the package name '{{packageName}}' in an executable string. This system also runs in repos where that package has a different name, and where more than one package answers to the same role. Resolve the package from its `packageType` — `isPackageE2eEligibleGuard` / `architecturePackageE2eEligibleDetectBroker` for the frontend question — and handle a SET, never a singleton. In agent-facing prose, write a placeholder such as `<ui-package>`. Comments and JSDoc are exempt; this string is code.",
        packageNameDiscriminator:
          "Do not branch on the package name '{{packageName}}'. What a package IS is its `packageType`, detected from the target repo's own disk; its name is an accident of that repo. Compare on `packageType` (or on `isPackageE2eEligibleGuard`) and handle a SET of packages, never a singleton.",
      },
      schema: [],
    },
  }),
  create: (context: unknown) => {
    const ctx = context as EslintContext;
    const filename = ctx.filename ?? ctx.getFilename?.() ?? '';

    if (isPackageNameLiteralAllowlistedGuard({ filename: String(filename) })) {
      return {};
    }

    return {
      // Both node kinds carry a string the parser produced from source. A comment produces neither,
      // which is the whole exemption.
      'Literal, TemplateElement': (node: Tsestree): void => {
        const sourceText = ctx.sourceCode?.getText(node);
        const text = typeof sourceText === 'string' ? sourceText : '';

        for (const packageName of bannedPackagePathNamesTransformer({
          text,
          packageNames: packageNameLiteralStatics.roleBearingPackageNames,
          workspaceDirNames: packageNameLiteralStatics.workspaceDirNames,
        })) {
          ctx.report({
            node,
            messageId: 'hardcodedPackagePath',
            data: { packageName: String(packageName) },
          });
        }

        const { value } = node;
        if (typeof value !== 'string') {
          return;
        }
        const isRoleName = packageNameLiteralStatics.roleBearingPackageNames.some(
          (name) => name === value,
        );
        if (isRoleName && isPackageNameComparisonOperandGuard({ node })) {
          ctx.report({
            node,
            messageId: 'packageNameDiscriminator',
            data: { packageName: value },
          });
        }
      },
    };
  },
});
