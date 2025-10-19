import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import { forbiddenFolderNameContract } from '../../../contracts/forbidden-folder-name/forbidden-folder-name-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { hasValidFileSuffixGuard } from '../../../guards/has-valid-file-suffix/has-valid-file-suffix-guard';
import { isCamelCaseGuard } from '../../../guards/is-camel-case/is-camel-case-guard';
import { isPascalCaseGuard } from '../../../guards/is-pascal-case/is-pascal-case-guard';
import { shouldExcludeFileFromProjectStructureRulesGuard } from '../../../guards/should-exclude-file-from-project-structure-rules/should-exclude-file-from-project-structure-rules-guard';
import { folderConfigStatics } from '../../../statics/folder-config/folder-config-statics';
import { forbiddenFolderStatics } from '../../../statics/forbidden-folder/forbidden-folder-statics';
import { expectedExportNameTransformer } from '../../../transformers/expected-export-name/expected-export-name-transformer';
import { forbiddenFolderSuggestionTransformer } from '../../../transformers/forbidden-folder-suggestion/forbidden-folder-suggestion-transformer';
import { pathDepthTransformer } from '../../../transformers/path-depth/path-depth-transformer';
import { projectFolderTypeFromFilePathTransformer } from '../../../transformers/project-folder-type-from-file-path/project-folder-type-from-file-path-transformer';
import { toKebabCaseTransformer } from '../../../transformers/to-kebab-case/to-kebab-case-transformer';

const allowedFolders = Object.keys(folderConfigStatics);

export const enforceProjectStructureRuleBroker = (): EslintRule => {
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
        adapterMustBeArrowFunction:
          'Lvl4: Adapters must export arrow functions (export const x = () => {}), not {{actualType}}',
        proxyMustBeArrowFunction:
          'Lvl4: Proxy must export arrow function (export const x = () => {}), not {{actualType}}',
      },
      schema: [],
    },
  });

  return {
    ...parsedMeta,
    create: (context: unknown) => {
      const ctx = context as EslintContext;
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

      // Helper to check if string is kebab-case
      const isKebabCase = (str: string): boolean => /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/u.test(str);

      // Helper to check if file is a proxy file
      const isProxyFile = (filePath: string): boolean => filePath.endsWith('.proxy.ts');

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

        // For suffixes that include the extension (like .proxy.ts), don't remove extension first
        const suffixIncludesExtension = (s: string): boolean => /\.[^.]+$/u.test(s);

        if (Array.isArray(suffix)) {
          for (const s of suffix) {
            if (suffixIncludesExtension(s)) {
              if (fullFilename.endsWith(s)) {
                return fullFilename.slice(0, -s.length);
              }
            } else {
              const withoutExt = fullFilename.replace(/\.[^.]+$/u, '');
              if (withoutExt.endsWith(s)) {
                return withoutExt.slice(0, -s.length);
              }
            }
          }
        } else if (typeof suffix === 'string') {
          if (suffixIncludesExtension(suffix)) {
            if (fullFilename.endsWith(suffix)) {
              return fullFilename.slice(0, -suffix.length);
            }
          } else {
            const withoutExt = fullFilename.replace(/\.[^.]+$/u, '');
            if (withoutExt.endsWith(suffix)) {
              return withoutExt.slice(0, -suffix.length);
            }
          }
        }

        // Fallback: just remove extension
        return fullFilename.replace(/\.[^.]+$/u, '');
      };

      return {
        Program: (node: Tsestree): void => {
          // LEVEL 1: Folder Location (HIGHEST)
          if (forbiddenFolderStatics.folders.includes(firstFolder)) {
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

          // LEVEL 2: Folder Depth + Kebab-Case
          const actualDepth = pathDepthTransformer({ filePath: filename });
          const folderConfig = folderConfigStatics[firstFolder as keyof typeof folderConfigStatics];
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
          const folderSegments = getFolderSegments(filename);
          const nonKebabFolder = folderSegments.find((segment) => !isKebabCase(segment));
          if (nonKebabFolder) {
            const expected = toKebabCaseTransformer({ str: nonKebabFolder });
            ctx.report({
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
          // Special handling for proxy files: use .proxy.ts suffix and Proxy export suffix
          const isProxy = isProxyFile(filename);
          const fileSuffix = isProxy ? '.proxy.ts' : folderConfig.fileSuffix;
          const exportSuffix = isProxy ? 'Proxy' : folderConfig.exportSuffix;
          // exportCase stays the same (camelCase or PascalCase from folder config)
          const { exportCase } = folderConfig;

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

            ctx.report({
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
            ctx.report({
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
              const { declaration, source } = statement as {
                declaration?: {
                  type?: string;
                  id?: { name?: string };
                  declarations?: { id?: { type?: string; name?: string } }[];
                };
                source?: unknown;
              };

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
                      const { init } = declarator as { init?: { type?: string } };
                      const isArrowFunction = init?.type === 'ArrowFunctionExpression';

                      // PROXY-SPECIFIC: Must be arrow function (check this first, before adapter check)
                      if (isProxyFile(filename)) {
                        if (!isArrowFunction) {
                          const actualType =
                            init?.type === 'Identifier'
                              ? 're-exported variable'
                              : init?.type === 'FunctionExpression'
                                ? 'function expression'
                                : init?.type || 'non-function value';
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
                              : init?.type || 'non-function value';
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
                  if (isProxyFile(filename)) {
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
                  if (isProxyFile(filename)) {
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
          const singleExport = valueExports[0];
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
