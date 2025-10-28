import type { Identifier, ModulePath } from '@questmaestro/shared/contracts';
import { identifierContract, modulePathContract } from '@questmaestro/shared/contracts';
import { folderConfigStatics } from '../../statics/folder-config/folder-config-statics';

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

    if (importPath !== undefined) {
      // Skip npm packages (relative imports start with . or ..)
      if (importPath.startsWith('.')) {
        // Skip contract imports (they're just types)
        if (!importPath.endsWith('-contract') && !importPath.endsWith('.stub')) {
          // Skip statics imports (they don't need proxies)
          if (!importPath.endsWith('-statics')) {
            // Skip multi-dot files except .proxy (like .test.ts, .stub.ts already filtered above)
            const filename = importPath.split('/').pop() ?? '';
            const dotCount = (filename.match(/\./gu) ?? []).length;
            if (dotCount === 0 || importPath.endsWith('.proxy')) {
              // Check if this import's folder type requires a proxy based on folderConfigStatics
              // Extract folder type from import path
              let folderTypeFromPath = null;
              const pathParts = importPath.split('/');
              const folderTypes = Object.keys(folderConfigStatics);

              // First, try to find folder type in the relative path itself
              for (let i = pathParts.length - 1; i >= 0; i -= 1) {
                const part = pathParts[i];
                if (part !== undefined && folderTypes.includes(part)) {
                  folderTypeFromPath = part;
                  break;
                }
              }

              // If not found and we have the implementation file path, resolve to absolute and check
              if (folderTypeFromPath === null && implementationFilePath !== undefined) {
                // Get directory of implementation file
                const implementationDir = implementationFilePath.split('/').slice(0, -1).join('/');
                // Resolve relative import to absolute path
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

              const folderConfig =
                folderTypeFromPath === null
                  ? undefined
                  : (folderConfigStatics[folderTypeFromPath as keyof typeof folderConfigStatics] as
                      | { requireProxy?: boolean }
                      | undefined);

              // Skip if folder type doesn't require proxies
              if (folderConfig?.requireProxy === true) {
                // This is an architectural component that needs a proxy
                // Extract imported names
                if (namedImports !== undefined) {
                  const names = namedImports
                    .split(',')
                    .map((n) => {
                      const [trimmed] = n.trim().split(/\s+as\s+/u);
                      return trimmed;
                    })
                    .filter((n): n is Exclude<typeof n, undefined> => Boolean(n));
                  for (const name of names) {
                    imports.set(
                      identifierContract.parse(name),
                      modulePathContract.parse(importPath),
                    );
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
        }
      }
    }

    match = importRegex.exec(contentWithoutComments);
  }

  return imports;
};
