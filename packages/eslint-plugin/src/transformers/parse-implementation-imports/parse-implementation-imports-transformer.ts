/**
 * PURPOSE: Parses file content to extract imports that require proxy patterns (from folders like brokers/, adapters/, etc.)
 *
 * USAGE:
 * const imports = parseImplementationImportsTransformer({
 *   content: "import { userBroker } from '../user/user-broker';\nimport { userContract } from '../user-contract';",
 *   implementationFilePath: '/src/brokers/auth/auth-broker.ts'
 * });
 * // Returns: Map { 'userBroker' => '../user/user-broker' }
 * // Note: Excludes contracts, statics, and other non-proxy imports
 * // Also handles scoped package imports with folder type subpaths (e.g., '@scope/pkg/brokers')
 */
import type { Identifier, ModulePath } from '@dungeonmaster/shared/contracts';
import { identifierContract, modulePathContract } from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

export const parseImplementationImportsTransformer = ({
  content,
  implementationFilePath,
}: {
  content: string;
  implementationFilePath?: string;
}): Map<Identifier, ModulePath> => {
  const imports = new Map<Identifier, ModulePath>();

  // Strip comments before parsing to avoid false positives from example code
  // Remove multi-line comments (/* ... */)
  let contentWithoutComments = content.replace(/\/\*[\s\S]*?\*\//gu, '');
  // Remove single-line comments (// ...)
  contentWithoutComments = contentWithoutComments.replace(/\/\/.*$/gmu, '');

  // Simple regex to match import statements
  // Matches: import { name } from 'path' or import name from 'path'
  const importRegex = /import\s+(?:type\s+)?(?:\{([^}]+)\}|(\w+))\s+from\s+['"]([^'"]+)['"]/gu;

  // Get folder types that require proxies
  const folderTypes = Object.keys(folderConfigStatics);

  let match = importRegex.exec(contentWithoutComments);
  while (match !== null) {
    const [, namedImports, defaultImport, importPath] = match;

    // Handle scoped package imports with folder type subpath (e.g., '@scope/pkg/brokers')
    // Pattern: @scope/package/folderType where folderType is a known folder type
    const scopedPackageMatch = importPath?.match(/^@[\w-]+\/[\w-]+\/(\w+)$/u);
    if (scopedPackageMatch !== null && scopedPackageMatch !== undefined) {
      const [, folderType] = scopedPackageMatch;
      // Check if the subpath is a known folder type that requires proxies
      if (folderType !== undefined && folderTypes.includes(folderType)) {
        const folderConfigValue: unknown = Reflect.get(folderConfigStatics, folderType);

        const requireProxyValue: unknown =
          folderConfigValue !== null &&
          folderConfigValue !== undefined &&
          typeof folderConfigValue === 'object' &&
          'requireProxy' in folderConfigValue
            ? Reflect.get(folderConfigValue, 'requireProxy')
            : undefined;

        if (requireProxyValue === true && namedImports !== undefined) {
          const names = namedImports
            .split(',')
            .map((n) => {
              const [trimmed] = n.trim().split(/\s+as\s+/u);
              return trimmed;
            })
            .filter((n): n is Exclude<typeof n, undefined> => Boolean(n));
          for (const name of names) {
            imports.set(identifierContract.parse(name), modulePathContract.parse(importPath ?? ''));
          }
        }
      }
      match = importRegex.exec(contentWithoutComments);
      continue;
    }

    // Early exit conditions for relative imports
    const shouldSkip =
      importPath === undefined ||
      !importPath.startsWith('.') ||
      importPath.endsWith('-contract') ||
      importPath.endsWith('.stub') ||
      importPath.endsWith('-statics');

    if (!shouldSkip) {
      // Skip multi-dot files except .proxy, .ts, .js extensions
      const filename = importPath.split('/').pop() ?? '';
      const dotCount = (filename.match(/\./gu) ?? []).length;
      const isValidFile =
        dotCount === 0 ||
        importPath.endsWith('.proxy') ||
        importPath.endsWith('.ts') ||
        importPath.endsWith('.js');

      if (isValidFile) {
        // Extract folder type from import path
        const pathParts = importPath.split('/');
        let folderTypeFromPath = null;

        // Try to find folder type in the relative path itself
        for (let i = pathParts.length - 1; i >= 0; i -= 1) {
          const part = pathParts[i];
          if (part !== undefined && folderTypes.includes(part)) {
            folderTypeFromPath = part;
            break;
          }
        }

        // If not found and we have the implementation file path, resolve to absolute
        if (folderTypeFromPath === null && implementationFilePath !== undefined) {
          const implementationDir = implementationFilePath.split('/').slice(0, -1).join('/');
          const absoluteParts = [...implementationDir.split('/'), ...importPath.split('/')];
          const resolved = [];
          for (const part of absoluteParts) {
            if (part === '..') {
              resolved.pop();
            } else if (part !== '.' && part !== '') {
              resolved.push(part);
            }
          }
          // Check absolute path for folder type
          for (let i = resolved.length - 1; i >= 0; i -= 1) {
            const part = resolved[i];
            if (part !== undefined && folderTypes.includes(part)) {
              folderTypeFromPath = part;
              break;
            }
          }
        }

        const folderConfigValue: unknown =
          folderTypeFromPath === null
            ? undefined
            : Reflect.get(folderConfigStatics, folderTypeFromPath);

        const requireProxyValue: unknown =
          folderConfigValue !== null &&
          folderConfigValue !== undefined &&
          typeof folderConfigValue === 'object' &&
          'requireProxy' in folderConfigValue
            ? Reflect.get(folderConfigValue, 'requireProxy')
            : undefined;

        // Only process if folder type requires proxies
        if (requireProxyValue === true) {
          if (namedImports !== undefined) {
            const names = namedImports
              .split(',')
              .map((n) => {
                const [trimmed] = n.trim().split(/\s+as\s+/u);
                return trimmed;
              })
              .filter((n): n is Exclude<typeof n, undefined> => Boolean(n));
            for (const name of names) {
              imports.set(identifierContract.parse(name), modulePathContract.parse(importPath));
            }
          }

          if (defaultImport !== undefined) {
            imports.set(
              identifierContract.parse(defaultImport),
              modulePathContract.parse(importPath),
            );
          }
        }
      }
    }

    match = importRegex.exec(contentWithoutComments);
  }

  return imports;
};
