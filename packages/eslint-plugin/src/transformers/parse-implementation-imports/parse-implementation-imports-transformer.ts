import { folderConfigStatics } from '../../statics/folder-config/folder-config-statics';

export const parseImplementationImportsTransformer = ({
  content,
}: {
  content: string;
}): Map<string, string> => {
  const imports = new Map<string, string>();

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
              // Extract folder type from import path by searching backwards through path parts
              const pathParts = importPath.split('/');
              const folderTypes = Object.keys(folderConfigStatics);
              let folderTypeFromPath: string | null = null;
              for (let i = pathParts.length - 1; i >= 0; i -= 1) {
                const part = pathParts[i];
                if (part !== undefined && folderTypes.includes(part)) {
                  folderTypeFromPath = part;
                  break;
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
                    .filter((n): n is string => Boolean(n));
                  for (const name of names) {
                    imports.set(name, importPath);
                  }
                }

                if (defaultImport !== undefined) {
                  imports.set(defaultImport, importPath);
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
