import type { Rule } from '../../../adapters/eslint/eslint-rule';
import { hasValidFileSuffixGuard } from '../../../guards/has-valid-file-suffix/has-valid-file-suffix-guard';
import { isCamelCaseGuard } from '../../../guards/is-camel-case/is-camel-case-guard';
import { isPascalCaseGuard } from '../../../guards/is-pascal-case/is-pascal-case-guard';
import { shouldExcludeFileFromProjectStructureRulesGuard } from '../../../guards/should-exclude-file-from-project-structure-rules/should-exclude-file-from-project-structure-rules-guard';
import { folderConfigStatics } from '../../../statics/folder-config/folder-config-statics';
import { expectedExportNameTransformer } from '../../../transformers/expected-export-name/expected-export-name-transformer';
import {
  forbiddenFolders,
  forbiddenFolderSuggestionTransformer,
} from '../../../transformers/forbidden-folder-suggestion/forbidden-folder-suggestion-transformer';
import { pathDepthTransformer } from '../../../transformers/path-depth/path-depth-transformer';
import { projectFolderTypeFromFilePathTransformer } from '../../../transformers/project-folder-type-from-file-path/project-folder-type-from-file-path-transformer';
import { toKebabCaseTransformer } from '../../../transformers/to-kebab-case/to-kebab-case-transformer';

const allowedFolders = Object.keys(folderConfigStatics);

export const enforceProjectStructureRuleBroker = (): Rule.RuleModule => ({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce QuestMaestro project structure with hierarchical validation (folder → depth → filename → export)',
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
      invalidFilenameCase:
        'Lvl3: Filename must use kebab-case before the suffix. Found "{{actual}}", expected "{{expected}}"',

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
    },
    schema: [],
  },
  create: (context: Rule.RuleContext) => {
    const { filename } = context;

    // PRE-VALIDATION: Exclude files from structure validation
    if (shouldExcludeFileFromProjectStructureRulesGuard({ filename })) {
      return {};
    }

    // Extract project folder type (brokers, contracts, guards, etc.)
    const firstFolder = projectFolderTypeFromFilePathTransformer({ filename });
    if (!firstFolder) {
      return {};
    }

    // Helper to check if string is kebab-case
    const isKebabCase = (str: string): boolean => /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/u.test(str);

    // Helper to extract folder path segments from filename
    const getFolderSegments = (filePath: string): string[] => {
      const afterSrc = filePath.split('/src/')[1];
      if (!afterSrc) return [];
      const parts = afterSrc.split('/');
      return parts.slice(0, -1); // Remove filename, keep folders
    };

    // Helper to extract filename without extension and suffix
    const getFilenameBase = (filePath: string, suffix: string | readonly string[]): string => {
      const parts = filePath.split('/');
      const fullFilename = parts[parts.length - 1] ?? '';
      const withoutExt = fullFilename.replace(/\.[^.]+$/u, ''); // Remove .ts/.tsx

      // Remove suffix
      if (Array.isArray(suffix)) {
        for (const s of suffix) {
          if (withoutExt.endsWith(s)) {
            return withoutExt.slice(0, -s.length);
          }
        }
      } else if (typeof suffix === 'string' && withoutExt.endsWith(suffix)) {
        return withoutExt.slice(0, -suffix.length);
      }
      return withoutExt;
    };

    return {
      Program: (node): void => {
        // LEVEL 1: Folder Location (HIGHEST)
        if (forbiddenFolders.includes(firstFolder)) {
          const suggestion = forbiddenFolderSuggestionTransformer({
            forbiddenFolder: firstFolder,
          });
          context.report({
            node,
            messageId: 'forbiddenFolder',
            data: {
              folder: firstFolder,
              suggestion,
            },
          });
          return; // STOP - can't validate deeper if folder is wrong
        }

        if (!allowedFolders.includes(firstFolder)) {
          context.report({
            node,
            messageId: 'unknownFolder',
            data: {
              folder: firstFolder,
              allowed: allowedFolders.join(', '),
            },
          });
          return; // STOP - can't validate deeper if folder is unknown
        }

        // LEVEL 2: Folder Depth + Kebab-Case
        const actualDepth = pathDepthTransformer({ filePath: filename });
        const folderConfig = folderConfigStatics[firstFolder as keyof typeof folderConfigStatics];
        const expectedDepth = folderConfig.folderDepth;

        if (actualDepth !== expectedDepth) {
          context.report({
            node,
            messageId: 'invalidFolderDepth',
            data: {
              folder: firstFolder,
              expected: String(expectedDepth),
              actual: String(actualDepth),
              pattern: folderConfig.folderPattern,
            },
          });
          return; // STOP - can't calculate expected filename pattern if depth is wrong
        }

        // Validate all folder names are kebab-case (except migrations/assets which have empty exportSuffix)
        const folderSegments = getFolderSegments(filename);
        const nonKebabFolder = folderSegments.find((segment) => !isKebabCase(segment));
        if (nonKebabFolder) {
          const expected = toKebabCaseTransformer({ str: nonKebabFolder });
          context.report({
            node,
            messageId: 'invalidFilenameCase',
            data: {
              actual: nonKebabFolder,
              expected,
            },
          });
          return; // STOP - folder structure must be correct before checking files
        }

        // LEVEL 3: Filename Suffix + Kebab-Case
        const { fileSuffix, exportSuffix, exportCase } = folderConfig;

        // Skip assets/migrations entirely (they have empty exportSuffix AND empty exportCase)
        if (exportSuffix === '' && exportCase === '') {
          return;
        }

        // Collect all Level 3 violations (don't return early - report all)
        const hasInvalidSuffix = !hasValidFileSuffixGuard({ filename, fileSuffix });
        const filenameBase = getFilenameBase(filename, fileSuffix);
        const hasInvalidCase = !isKebabCase(filenameBase);

        // Report all Level 3 violations
        if (hasInvalidSuffix) {
          const expectedSuffix: string = Array.isArray(fileSuffix)
            ? fileSuffix.join(' or ')
            : String(fileSuffix);

          context.report({
            node,
            messageId: 'invalidFileSuffix',
            data: {
              expected: expectedSuffix,
              folderType: firstFolder,
            },
          });
        }

        if (hasInvalidCase) {
          const expected = toKebabCaseTransformer({ str: filenameBase });
          context.report({
            node,
            messageId: 'invalidFilenameCase',
            data: {
              actual: filenameBase,
              expected,
            },
          });
        }

        // STOP at Level 3 if any filename errors - can't validate exports if filename is wrong
        if (hasInvalidSuffix || hasInvalidCase) {
          return;
        }

        // LEVEL 4: Export Validation (Structure is valid, now check exports)
        // Check if file has only type re-exports (export type { X } from 'pkg') - skip Level 4 validation
        const programNodeForTypeCheck = node as unknown as {
          body: {
            type: string;
            exportKind?: 'type' | 'value';
            source?: unknown;
          }[];
        };
        const hasOnlyTypeReExports = programNodeForTypeCheck.body.every(
          (statement) =>
            statement.type !== 'ExportNamedDeclaration' ||
            (statement.exportKind === 'type' && statement.source !== undefined),
        );

        // Skip export validation for type re-export files (adapters only)
        if (hasOnlyTypeReExports && firstFolder === 'adapters') {
          return;
        }

        interface ExportInfo {
          type: string;
          name?: string;
          isTypeOnly: boolean;
        }

        const programNode = node as unknown as {
          body: {
            type: string;
            exportKind?: 'type' | 'value';
            declaration?: {
              type?: string;
              id?: { name?: string };
              declarations?: { id?: { type?: string; name?: string } }[];
            };
            specifiers?: unknown[];
            source?: { value?: string };
          }[];
        };

        const exports: ExportInfo[] = [];

        for (const statement of programNode.body) {
          // Check for default exports
          if (statement.type === 'ExportDefaultDeclaration') {
            context.report({
              node,
              messageId: 'noDefaultExport',
            });
            return; // STOP - default exports are forbidden
          }

          // Check for namespace exports (export * from)
          if (statement.type === 'ExportAllDeclaration') {
            context.report({
              node,
              messageId: 'noNamespaceExport',
            });
            return; // STOP - namespace exports are forbidden
          }

          // Check for re-exports (export { X } from) - allow in adapters, forbid elsewhere
          if (statement.type === 'ExportNamedDeclaration' && statement.source) {
            if (firstFolder !== 'adapters') {
              context.report({
                node,
                messageId: 'noReExport',
                data: { folderType: firstFolder },
              });
              return; // STOP - re-exports are forbidden outside adapters
            }
          }

          // Collect named value exports (skip type-only exports)
          if (statement.type === 'ExportNamedDeclaration') {
            const isTypeOnly = statement.exportKind === 'type';
            const { declaration, source, specifiers } = statement as {
              declaration?: {
                type?: string;
                id?: { name?: string };
                declarations?: { id?: { type?: string; name?: string } }[];
              };
              source?: unknown;
              specifiers?: { exported?: { name?: string } }[];
            };

            // Handle declarations (export const x = ...)
            if (!isTypeOnly && declaration && !source) {
              // VariableDeclaration
              if (declaration.type === 'VariableDeclaration' && declaration.declarations) {
                for (const declarator of declaration.declarations) {
                  if (declarator.id?.type === 'Identifier' && declarator.id.name) {
                    exports.push({
                      type: 'VariableDeclaration',
                      name: declarator.id.name,
                      isTypeOnly: false,
                    });
                  }
                }
              }

              // FunctionDeclaration
              if (declaration.type === 'FunctionDeclaration' && declaration.id?.name) {
                exports.push({
                  type: 'FunctionDeclaration',
                  name: declaration.id.name,
                  isTypeOnly: false,
                });
              }

              // ClassDeclaration
              if (declaration.type === 'ClassDeclaration' && declaration.id?.name) {
                exports.push({
                  type: 'ClassDeclaration',
                  name: declaration.id.name,
                  isTypeOnly: false,
                });
              }
            }

            // Handle re-exports in adapters only
            // Pattern 1: export { X } from 'pkg' or export { X as Y } from 'pkg'
            // Pattern 2: export { X } or export { X as Y } (after importing)
            if (!isTypeOnly && firstFolder === 'adapters' && specifiers && !declaration) {
              for (const specifier of specifiers) {
                if (specifier.exported?.name) {
                  exports.push({
                    type: 'ReExport',
                    name: specifier.exported.name,
                    isTypeOnly: false,
                  });
                }
              }
            }
          }
        }

        // Calculate expected export name
        const expectedExportName = expectedExportNameTransformer({
          filename,
          fileSuffix,
          exportSuffix,
          exportCase: folderConfig.exportCase,
        });

        // Check for exactly one value export (or zero for startup)
        const valueExports = exports.filter((e) => !e.isTypeOnly);
        const isStartup = exportSuffix === '';

        if (valueExports.length === 0) {
          // Startup allows 0 exports, all others require exactly 1
          if (!isStartup) {
            context.report({
              node,
              messageId: 'missingExpectedExport',
              data: {
                expectedName: expectedExportName,
                actualCount: '0',
              },
            });
          }
          return;
        }

        if (valueExports.length > 1) {
          const exportNames = valueExports.map((e) => e.name).join(', ');
          context.report({
            node,
            messageId: 'multipleValueExports',
            data: {
              expectedName: expectedExportName,
              actualCount: String(valueExports.length),
              exportNames,
            },
          });
          return;
        }

        // Exactly one value export - validate ALL properties and report ALL violations
        const singleExport = valueExports[0];
        if (!singleExport) return; // Should never happen due to length check above
        const exportName = singleExport.name ?? '';

        // Collect all Level 4 violations (don't return early - report all)
        const hasSuffixError = exportSuffix !== '' && !exportName.endsWith(exportSuffix);

        const isCorrectCase =
          folderConfig.exportCase === 'PascalCase'
            ? isPascalCaseGuard({ str: exportName })
            : isCamelCaseGuard({ str: exportName });
        const hasCaseError = !isCorrectCase;

        const hasNameMismatch = exportName !== expectedExportName;

        // Report all violations (no early returns in Level 4)
        if (hasSuffixError) {
          context.report({
            node,
            messageId: 'invalidExportSuffix',
            data: {
              expected: exportSuffix,
              folderType: firstFolder,
            },
          });
        }

        if (hasCaseError) {
          context.report({
            node,
            messageId: 'invalidExportCase',
            data: {
              expected: folderConfig.exportCase,
              folderType: firstFolder,
            },
          });
        }

        if (hasNameMismatch) {
          context.report({
            node,
            messageId: 'filenameMismatch',
            data: {
              exportName,
              expectedName: expectedExportName,
            },
          });
        }
      },
    };
  },
});
