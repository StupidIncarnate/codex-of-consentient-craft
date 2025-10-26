import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import { forbiddenFolderNameContract } from '../../../contracts/forbidden-folder-name/forbidden-folder-name-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { identifierContract, type Identifier } from '@questmaestro/shared/contracts';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { isCamelCaseGuard } from '../../../guards/is-camel-case/is-camel-case-guard';
import { isKebabCaseGuard } from '../../../guards/is-kebab-case/is-kebab-case-guard';
import { isPascalCaseGuard } from '../../../guards/is-pascal-case/is-pascal-case-guard';
import { shouldExcludeFileFromProjectStructureRulesGuard } from '../../../guards/should-exclude-file-from-project-structure-rules/should-exclude-file-from-project-structure-rules-guard';
import { folderConfigStatics } from '../../../statics/folder-config/folder-config-statics';
import { forbiddenFolderStatics } from '../../../statics/forbidden-folder/forbidden-folder-statics';
import { expectedExportNameTransformer } from '../../../transformers/expected-export-name/expected-export-name-transformer';
import { filepathExtractSegmentsAfterSrcTransformer } from '../../../transformers/filepath-extract-segments-after-src/filepath-extract-segments-after-src-transformer';
import { filepathBasenameWithoutSuffixTransformer } from '../../../transformers/filepath-basename-without-suffix/filepath-basename-without-suffix-transformer';
import { forbiddenFolderSuggestionTransformer } from '../../../transformers/forbidden-folder-suggestion/forbidden-folder-suggestion-transformer';
import { pathDepthTransformer } from '../../../transformers/path-depth/path-depth-transformer';
import { projectFolderTypeFromFilePathTransformer } from '../../../transformers/project-folder-type-from-file-path/project-folder-type-from-file-path-transformer';
import { toKebabCaseTransformer } from '../../../transformers/to-kebab-case/to-kebab-case-transformer';
import { removeFileExtensionTransformer } from '../../../transformers/remove-file-extension/remove-file-extension-transformer';
import { getFileExtensionTransformer } from '../../../transformers/get-file-extension/get-file-extension-transformer';

const allowedFolders = Object.keys(folderConfigStatics);

export const ruleEnforceProjectStructureBroker = (): EslintRule => {
  const parsedMeta = eslintRuleContract.parse({
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
          // LEVEL 1: Folder Location (HIGHEST)
          if (firstFolder in forbiddenFolderStatics.mappings) {
            const suggestion = forbiddenFolderSuggestionTransformer({
              forbiddenFolder: forbiddenFolderNameContract.parse(firstFolder),
            });
            ctx.report({
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
            ctx.report({
              node,
              messageId: 'unknownFolder',
              data: {
                folder: firstFolder,
                allowed: allowedFolders.join(', '),
              },
            });
            return; // STOP - can't validate deeper if folder is unknown
          }

          // Check layer file pattern
          const isLayerFile = filename.includes('-layer-');
          const folderConfig = folderConfigStatics[firstFolder as keyof typeof folderConfigStatics];

          if (isLayerFile && !folderConfig.allowsLayerFiles) {
            ctx.report({
              node,
              messageId: 'layerFilesNotAllowed',
              data: {
                folderType: firstFolder,
              },
            });
            return; // STOP - layer files not allowed in this folder
          }

          // LEVEL 2: Folder Depth + Kebab-Case
          const actualDepth = pathDepthTransformer({ filePath: filename });
          const expectedDepth = folderConfig.folderDepth;

          if (actualDepth !== expectedDepth) {
            ctx.report({
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
          const folderSegments = filepathExtractSegmentsAfterSrcTransformer({ filePath: filename });
          const nonKebabFolder = folderSegments.find(
            (segment) => !isKebabCaseGuard({ str: segment }),
          );
          if (nonKebabFolder) {
            const expected = toKebabCaseTransformer({ str: nonKebabFolder });
            const ext = getFileExtensionTransformer({ filename, includesDot: false });
            ctx.report({
              node,
              messageId: 'invalidFilenameCase',
              data: {
                actual: nonKebabFolder,
                expected,
                ext,
              },
            });
            return; // STOP - folder structure must be correct before checking files
          }

          // LEVEL 3: Filename Suffix + Kebab-Case + Domain Match
          // Special handling for proxy files: use .proxy.ts suffix and Proxy export suffix
          const isProxy = hasFileSuffixGuard({ filename, suffix: 'proxy' });
          const fileSuffix = isProxy ? '.proxy.ts' : folderConfig.fileSuffix;
          const exportSuffix = isProxy ? 'Proxy' : folderConfig.exportSuffix;
          // exportCase stays the same (camelCase or PascalCase from folder config)
          const { exportCase } = folderConfig;

          // Skip assets/migrations entirely (they have empty exportSuffix AND empty exportCase)
          if (exportSuffix === '' && exportCase === '') {
            return;
          }

          // Collect all Level 3 violations (don't return early - report all)
          const suffixes = Array.isArray(fileSuffix) ? fileSuffix : [fileSuffix];
          const hasInvalidSuffix = !suffixes.some((suffix: string) => filename.endsWith(suffix));
          const filenameBase = filepathBasenameWithoutSuffixTransformer({
            filePath: filename,
            suffix: fileSuffix,
          });
          const hasInvalidCase = !isKebabCaseGuard({ str: filenameBase });

          // For folders with depth > 0, validate filename prefix matches domain folders
          // Skip domain matching for layer files (they have their own naming pattern)
          let hasInvalidDomainMatch = false;
          let expectedFilenamePrefix = '';

          if (expectedDepth > 0 && !isLayerFile) {
            const domainFolderSegments = filepathExtractSegmentsAfterSrcTransformer({
              filePath: filename,
            });
            // Extract domain folders (skip the category folder)
            const domainFolders = domainFolderSegments.slice(1, 1 + expectedDepth);
            expectedFilenamePrefix = domainFolders.join('-');

            // For proxy files, need to also remove the base file suffix before comparing
            // Example: user-fetch-broker.proxy.ts -> filenameBase is "user-fetch-broker"
            // We need to remove "-broker" to get "user-fetch" for comparison
            let actualFilenamePrefix = filenameBase;
            if (isProxy) {
              const baseSuffix = folderConfig.fileSuffix;
              const baseSuffixStr = Array.isArray(baseSuffix)
                ? String(baseSuffix[0])
                : String(baseSuffix);
              const baseSuffixToRemove = removeFileExtensionTransformer({
                filename: baseSuffixStr,
              });
              actualFilenamePrefix = identifierContract.parse(
                filenameBase.replace(new RegExp(`${baseSuffixToRemove}$`, 'u'), ''),
              );
            }

            if (actualFilenamePrefix !== expectedFilenamePrefix) {
              hasInvalidDomainMatch = true;
            }
          }

          // Report all Level 3 violations
          if (hasInvalidSuffix) {
            const expectedSuffix = Array.isArray(fileSuffix)
              ? fileSuffix.join(' or ')
              : String(fileSuffix);

            ctx.report({
              node,
              messageId: folderConfig.allowsLayerFiles
                ? 'invalidFileSuffixWithLayer'
                : 'invalidFileSuffix',
              data: {
                expected: expectedSuffix,
                folderType: firstFolder,
              },
            });
          }

          if (hasInvalidCase) {
            const expected = toKebabCaseTransformer({ str: filenameBase });
            const ext = getFileExtensionTransformer({ filename, includesDot: false });
            const suffixStr = Array.isArray(fileSuffix)
              ? String(fileSuffix[0])
              : String(fileSuffix);
            const suffixWithoutExtension = removeFileExtensionTransformer({ filename: suffixStr });
            const actualFullFilename = filenameBase + suffixWithoutExtension;
            const expectedFullFilename = expected + suffixWithoutExtension;

            ctx.report({
              node,
              messageId: folderConfig.allowsLayerFiles
                ? 'invalidFilenameCaseWithLayer'
                : 'invalidFilenameCase',
              data: {
                actual: actualFullFilename,
                expected: expectedFullFilename,
                ext,
              },
            });
          } else if (hasInvalidDomainMatch) {
            // Only check domain match if kebab-case is valid
            // Show full expected filename with suffix for clarity
            const suffixStr = Array.isArray(fileSuffix)
              ? String(fileSuffix[0])
              : String(fileSuffix);
            const suffixWithoutExtension = removeFileExtensionTransformer({ filename: suffixStr });
            const expectedFullFilename = expectedFilenamePrefix + suffixWithoutExtension;
            const actualFullFilename = filenameBase + suffixWithoutExtension;
            const ext = getFileExtensionTransformer({ filename, includesDot: false });

            ctx.report({
              node,
              messageId: folderConfig.allowsLayerFiles
                ? 'invalidFilenameCaseWithLayer'
                : 'invalidFilenameCase',
              data: {
                actual: actualFullFilename,
                expected: expectedFullFilename,
                ext,
              },
            });
          }

          // STOP at Level 3 if any filename errors - can't validate exports if filename is wrong
          if (hasInvalidSuffix || hasInvalidCase || hasInvalidDomainMatch) {
            return;
          }

          // LEVEL 4: Export Validation (Structure is valid, now check exports)

          const exports: {
            type: Tsestree['type'];
            name?: Identifier;
            isTypeOnly: boolean;
          }[] = [];
          const { body } = node;

          if (!body || !Array.isArray(body)) {
            return;
          }

          for (const statement of body) {
            // Check for default exports
            if (statement.type === 'ExportDefaultDeclaration') {
              ctx.report({
                node,
                messageId: 'noDefaultExport',
              });
              return; // STOP - default exports are forbidden
            }

            // Check for namespace exports (export * from)
            if (statement.type === 'ExportAllDeclaration') {
              ctx.report({
                node,
                messageId: 'noNamespaceExport',
              });
              return; // STOP - namespace exports are forbidden
            }

            // Collect named value exports and check for forbidden re-exports
            if (statement.type === 'ExportNamedDeclaration') {
              const isTypeOnly = statement.exportKind === 'type';
              const { declaration, source } = statement;

              // Check for value re-exports - forbidden
              // Pattern 1: export { X } from 'pkg' (has source, value export)
              // Pattern 2: import { X }; export { X }; (no source, no declaration, value export)
              const hasSource = source !== null && source !== undefined;
              const hasDeclaration = declaration !== null && declaration !== undefined;

              if (!isTypeOnly && (hasSource || !hasDeclaration)) {
                // Either re-export from source OR re-export after import (no declaration)
                ctx.report({
                  node,
                  messageId: 'noReExport',
                  data: { folderType: firstFolder },
                });
                return; // STOP - value re-exports are forbidden
              }

              // Handle declarations (export const x = ...)
              if (!isTypeOnly && declaration) {
                // VariableDeclaration
                if (declaration.type === 'VariableDeclaration' && declaration.declarations) {
                  for (const declarator of declaration.declarations) {
                    if (declarator.id?.type === 'Identifier' && declarator.id.name) {
                      const { init } = declarator;
                      const isArrowFunction = init?.type === 'ArrowFunctionExpression';

                      // PROXY-SPECIFIC: Must be arrow function (check this first, before adapter check)
                      if (hasFileSuffixGuard({ filename, suffix: 'proxy' })) {
                        if (!isArrowFunction) {
                          const actualType =
                            init?.type === 'Identifier'
                              ? 're-exported variable'
                              : init?.type === 'FunctionExpression'
                                ? 'function expression'
                                : (init?.type ?? 'non-function value');
                          ctx.report({
                            node,
                            messageId: 'proxyMustBeArrowFunction',
                            data: { actualType },
                          });
                          return; // STOP - proxies must be arrow functions
                        }
                      }

                      // ADAPTER-SPECIFIC: Must be arrow function
                      if (firstFolder === 'adapters') {
                        if (!isArrowFunction) {
                          const actualType =
                            init?.type === 'Identifier'
                              ? 're-exported variable'
                              : (init?.type ?? 'non-function value');
                          ctx.report({
                            node,
                            messageId: 'adapterMustBeArrowFunction',
                            data: { actualType },
                          });
                          return; // STOP - adapters must be arrow functions
                        }
                      }

                      exports.push({
                        type: 'VariableDeclaration',
                        name: declarator.id.name,
                        isTypeOnly: false,
                      });
                    }
                  }
                }

                // FunctionDeclaration - forbidden in proxies and adapters
                if (declaration.type === 'FunctionDeclaration' && declaration.id?.name) {
                  // Check proxy first
                  if (hasFileSuffixGuard({ filename, suffix: 'proxy' })) {
                    ctx.report({
                      node,
                      messageId: 'proxyMustBeArrowFunction',
                      data: { actualType: 'function declaration' },
                    });
                    return; // STOP - proxies must be arrow functions
                  }

                  if (firstFolder === 'adapters') {
                    ctx.report({
                      node,
                      messageId: 'adapterMustBeArrowFunction',
                      data: { actualType: 'function declaration' },
                    });
                    return; // STOP - adapters must be arrow functions
                  }

                  exports.push({
                    type: 'FunctionDeclaration',
                    name: declaration.id.name,
                    isTypeOnly: false,
                  });
                }

                // ClassDeclaration - forbidden in proxies and adapters
                if (declaration.type === 'ClassDeclaration' && declaration.id?.name) {
                  // Check proxy first
                  if (hasFileSuffixGuard({ filename, suffix: 'proxy' })) {
                    ctx.report({
                      node,
                      messageId: 'proxyMustBeArrowFunction',
                      data: { actualType: 'class' },
                    });
                    return; // STOP - proxies must be arrow functions
                  }

                  if (firstFolder === 'adapters') {
                    ctx.report({
                      node,
                      messageId: 'adapterMustBeArrowFunction',
                      data: { actualType: 'class' },
                    });
                    return; // STOP - adapters must be arrow functions
                  }

                  exports.push({
                    type: 'ClassDeclaration',
                    name: declaration.id.name,
                    isTypeOnly: false,
                  });
                }
              }
            }
          }

          // Calculate expected export name (using proxy-aware values)
          // For startup files (exportSuffix === ''), use PascalCase as default
          const expectedExportName = expectedExportNameTransformer({
            filename,
            fileSuffix,
            exportSuffix,
            exportCase: exportCase === '' ? 'PascalCase' : exportCase,
          });

          // Check for exactly one value export (or zero for startup)
          const valueExports = exports.filter((e) => !e.isTypeOnly);
          const isStartup = exportSuffix === '';

          if (valueExports.length === 0) {
            // Startup allows 0 exports, all others require exactly 1
            if (!isStartup) {
              ctx.report({
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
            ctx.report({
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
          const [singleExport] = valueExports;
          if (!singleExport) return; // Should never happen due to length check above
          const exportName = singleExport.name ?? '';

          // Collect all Level 4 violations (don't return early - report all)
          const hasSuffixError = exportSuffix !== '' && !exportName.endsWith(exportSuffix);

          const isCorrectCase =
            exportCase === 'PascalCase'
              ? isPascalCaseGuard({ str: exportName })
              : isCamelCaseGuard({ str: exportName });
          const hasCaseError = !isCorrectCase;

          const hasNameMismatch = exportName !== expectedExportName;

          // Report all violations (no early returns in Level 4)
          if (hasSuffixError) {
            ctx.report({
              node,
              messageId: 'invalidExportSuffix',
              data: {
                expected: exportSuffix,
                folderType: firstFolder,
              },
            });
          }

          if (hasCaseError) {
            ctx.report({
              node,
              messageId: 'invalidExportCase',
              data: {
                expected: exportCase,
                folderType: firstFolder,
              },
            });
          }

          if (hasNameMismatch) {
            ctx.report({
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
  };
};
