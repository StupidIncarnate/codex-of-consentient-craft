/**
 * PURPOSE: Parses file content to extract relative imports that require proxy patterns (from folders like brokers/, adapters/, etc.)
 *
 * USAGE:
 * const imports = parseImplementationImportsTransformer({
 *   content: "import { userBroker } from '../user/user-broker';\nimport { userContract } from '../user-contract';",
 *   implementationFilePath: '/src/brokers/auth/auth-broker.ts'
 * });
 * // Returns: Map { 'userBroker' => '../user/user-broker' }
 * // Note: Excludes contracts, statics, and other non-proxy imports
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

  let match = importRegex.exec(contentWithoutComments);
  while (match !== null) {
    const [, namedImports, defaultImport, importPath] = match;

    // Early exit conditions
    const shouldSkip =
      importPath === undefined ||
      !importPath.startsWith('.') ||
      importPath.endsWith('-contract') ||
      importPath.endsWith('.stub') ||
      importPath.endsWith('-statics');

    if (!shouldSkip) {
      // Skip multi-dot files except .proxy
      const filename = importPath.split('/').pop() ?? '';
      const dotCount = (filename.match(/\./gu) ?? []).length;
      const isValidFile = dotCount === 0 || importPath.endsWith('.proxy');

      if (isValidFile) {
        // Extract folder type from import path
        const pathParts = importPath.split('/');
        const folderTypes = Object.keys(folderConfigStatics);
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
