/**
 * PURPOSE: Enforces Dungeonmaster project structure with hierarchical validation of folders, depth, filenames, and exports
 *
 * USAGE:
 * const rule = ruleEnforceProjectStructureBroker();
 * // Returns ESLint rule that validates folder location, depth, kebab-case filenames, and export naming conventions
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { shouldExcludeFileFromProjectStructureRulesGuard } from '../../../guards/should-exclude-file-from-project-structure-rules/should-exclude-file-from-project-structure-rules-guard';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';
import { projectFolderTypeFromFilePathTransformer } from '../../../transformers/project-folder-type-from-file-path/project-folder-type-from-file-path-transformer';
import { validateFolderLocationLayerBroker } from './validate-folder-location-layer-broker';
import { validateFolderDepthLayerBroker } from './validate-folder-depth-layer-broker';
import { validateFilenameLayerBroker } from './validate-filename-layer-broker';
import { collectExportsLayerBroker } from './collect-exports-layer-broker';
import { validateExportLayerBroker } from './validate-export-layer-broker';

export const ruleEnforceProjectStructureBroker = (): EslintRule => {
  const parsedMeta = eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Enforce Dungeonmaster project structure with hierarchical validation (folder → depth → filename → export)',
      },
      messages: {
        // Level 1: Folder location errors
        forbiddenFolder:
          'Lvl1: Folder "{{folder}}/" is forbidden. Use "{{suggestion}}/" instead according to project standards.',
        unknownFolder: 'Unknown folder "{{folder}}/". Must use one of: {{allowed}}',

        // Level 2: Folder depth errors
        invalidFolderDepth:
          'Lvl2: Folder "{{folder}}/" requires depth {{expected}} but file is at depth {{actual}}. Expected pattern: src/{{folder}}/{{pattern}}',

        // Level 3: Filename errors
        invalidFileSuffix: 'Lvl3: File must end with "{{expected}}" for {{folderType}}/ folder',
        invalidFileSuffixWithLayer:
          'Lvl3: File must end with "{{expected}}" for {{folderType}}/ folder. If this is a helper decomposing a complex parent, use layer pattern: {descriptive-name}-layer-{suffix}.ts (e.g., validate-folder-depth-layer-broker.ts)',
        invalidFilenameCase:
          'Lvl3: Found {{actual}}.{{ext}}. Filename should be {{expected}}.{{ext}}',
        invalidFilenameCaseWithLayer:
          'Lvl3: Found {{actual}}.{{ext}}. Filename should be {{expected}}.{{ext}}. If this is a helper decomposing a complex parent (not a standalone operation), use the layer pattern: {descriptive-name}-layer-{suffix}.{{ext}} (e.g., validate-folder-depth-layer-broker.ts)',

        // Level 4: Export errors
        noDefaultExport: 'Lvl4: Default exports are forbidden. Use named exports only.',
        noNamespaceExport: 'Lvl4: Namespace exports (export * from) are forbidden.',
        noReExport:
          'Lvl4: Re-exports are forbidden in {{folderType}}/ files. Only the primary export is allowed.',
        missingExpectedExport:
          'Lvl4: File must export exactly one value named "{{expectedName}}". Found {{actualCount}} value exports.',
        multipleValueExports:
          'Lvl4: File must export exactly one value named "{{expectedName}}". Found {{actualCount}} value exports: {{exportNames}}',
        invalidExportSuffix:
          'Lvl4: Export name must end with "{{expected}}" for {{folderType}}/ folder',
        invalidExportCase: 'Lvl4: Export must use {{expected}} for {{folderType}}/ folder',
        filenameMismatch:
          'Lvl4: Export name "{{exportName}}" does not match expected "{{expectedName}}" based on filename',
        adapterMustBeArrowFunction:
          'Lvl4: Adapters must export arrow functions (export const x = () => {}), not {{actualType}}',
        proxyMustBeArrowFunction:
          'Lvl4: Proxy must export arrow function (export const x = () => {}), not {{actualType}}',

        // Layer file errors
        layerFilesNotAllowed:
          'Layer files (-layer-) are not allowed in {{folderType}}/. Only allowed in: brokers/, widgets/, responders/',
      },
      schema: [],
    },
  });

  return {
    ...parsedMeta,
    create: (context: EslintContext) => {
      const ctx = context;
      const filename = String(ctx.filename ?? '');

      // PRE-VALIDATION: Exclude files from structure validation
      if (shouldExcludeFileFromProjectStructureRulesGuard({ filename })) {
        return {};
      }

      // Extract project folder type (brokers, contracts, guards, etc.)
      const firstFolder = projectFolderTypeFromFilePathTransformer({ filename });
      if (!firstFolder) {
        return {};
      }

      return {
        Program: (node: Tsestree): void => {
          const isLayerFile = filename.includes('-layer-');
          const folderConfig = folderConfigStatics[firstFolder as keyof typeof folderConfigStatics];

          // LEVEL 1: Folder Location — forbidden/unknown folders, layer file allowance
          if (
            !validateFolderLocationLayerBroker({
              node,
              context: ctx,
              firstFolder,
              folderConfig,
              isLayerFile,
            })
          )
            return;

          // LEVEL 2: Folder Depth + Kebab-Case folder names
          if (
            !validateFolderDepthLayerBroker({
              node,
              context: ctx,
              filename,
              firstFolder,
              folderConfig,
            })
          )
            return;

          // LEVEL 3: Filename suffix, kebab-case, domain prefix match
          if (
            !validateFilenameLayerBroker({
              node,
              context: ctx,
              filename,
              firstFolder,
              folderConfig,
              isLayerFile,
            })
          )
            return;

          // LEVEL 4a: Collect exports (walks AST, checks forbidden patterns)
          const collectedExports = collectExportsLayerBroker({
            node,
            context: ctx,
            filename,
            firstFolder,
          });
          if (!collectedExports) return;

          // LEVEL 4b: Validate export count, suffix, case, name match
          validateExportLayerBroker({
            node,
            context: ctx,
            filename,
            firstFolder,
            folderConfig,
            collectedExports,
          });
        },
      };
    },
  };
};
