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
 * // Excludes type-only names too: a whole `import type { X }` statement, and a per-name
 * // `type` prefix inside an otherwise-value import ('{ walkBroker, type WalkMemo }')
 * // Also handles a bare workspace-package ROOT import with no subpath at all (e.g.
 * // '@dungeonmaster/orchestrator', or '@acme/orders' in a published consumer) — every real
 * // caller reaches a package's own composed export this way, and enforce-proxy-child-creation
 * // decides per name whether it needs a child proxy. The caller passes its own workspace's
 * // scope (read off the real workspace root, never hardcoded); with none given, this shape is
 * // skipped entirely, same as before this branch existed
 */
import type { Identifier } from '@dungeonmaster/shared/contracts';
import { identifierContract } from '@dungeonmaster/shared/contracts';
import {
  fileExtensionsStatics,
  folderConfigStatics,
  gatewayLocationsStatics,
} from '@dungeonmaster/shared/statics';
import { folderConfigTransformer } from '../folder-config/folder-config-transformer';
import { namedImportEntriesTransformer } from '../named-import-entries/named-import-entries-transformer';
import { workspacePackageRootImportNameTransformer } from '../workspace-package-root-import-name/workspace-package-root-import-name-transformer';

const gatewayFolderNames = Object.values(gatewayLocationsStatics.folders);

export const parseImplementationImportsTransformer = ({
  content,
  implementationFilePath,
  workspaceScope,
}: {
  content: string;
  implementationFilePath?: string;
  workspaceScope?: string;
}): Map<Identifier, string> => {
  const imports = new Map<Identifier, string>();

  // Strip comments before parsing to avoid false positives from example code
  // Remove multi-line comments (/* ... */)
  let contentWithoutComments = content.replace(/\/\*[\s\S]*?\*\//gu, '');
  // Remove single-line comments (// ...)
  contentWithoutComments = contentWithoutComments.replace(/\/\/.*$/gmu, '');

  // Simple regex to match import statements
  // Matches: import { name } from 'path' or import name from 'path'. The first capture
  // group is the whole-declaration `type` keyword ('import type { X }'). This parses raw
  // file content by regex, not an ESTree, so there is no per-specifier ImportSpecifier
  // node to read an `importKind` off — the `type ` prefix text is the only signal, both
  // here (whole statement) and per-name below (mixed statement).
  const importRegex = /import\s+(type\s+)?(?:\{([^}]+)\}|(\w+))\s+from\s+['"]([^'"]+)['"]/gu;

  // Get folder types that require proxies
  const folderTypes = Object.keys(folderConfigStatics);

  let match = importRegex.exec(contentWithoutComments);
  while (match !== null) {
    const [, importTypeKeyword, namedImports, defaultImport, importPath] = match;

    // A whole `import type { ... } from '...'` statement introduces no runtime bindings —
    // every name it lists is a type — so it is skipped before any path-based branching
    // below (gateway, scoped-package, relative) ever inspects the names inside it.
    if (importTypeKeyword !== undefined) {
      match = importRegex.exec(contentWithoutComments);
      continue;
    }

    // Handle gateway package imports at ANY depth (e.g. '@scope/node/fs/promises',
    // '@scope/npm/zod', '@scope/npm/@playwright/test', or the '#gateway/...' import-alias form
    // every consumer repo resolves identically via gatewayLocationsStatics.importPrefix). A
    // gateway subpath's own folder segment (npm/node/browser/bin) is never a member of
    // folderConfigStatics, so the folder-type matcher below never recognizes it — this is a
    // separate, depth-agnostic match keyed on gatewayLocationsStatics instead, checked first so a
    // 3-segment gateway import (`@scope/npm/zod`) is caught here rather than falling into the
    // folder-type matcher and being silently dropped for having an unrecognized "folder type".
    // The alternation's second branch is `importPrefix` verbatim, not a scope pattern — it holds
    // no regex metacharacters ('#gateway'), so no escaping is needed before it goes into `RegExp`.
    const gatewayMatch = importPath?.match(
      new RegExp(
        `^(?:@[\\w-]+|${gatewayLocationsStatics.importPrefix})\\/([\\w-]+)(?:\\/.+)?$`,
        'u',
      ),
    );
    const gatewayFolderSegment = gatewayMatch?.[1];
    if (
      gatewayFolderSegment !== undefined &&
      gatewayFolderNames.some((folder) => folder === gatewayFolderSegment)
    ) {
      for (const [name, path] of namedImportEntriesTransformer({
        namedImports,
        importPath: importPath ?? '',
      })) {
        imports.set(name, path);
      }
      match = importRegex.exec(contentWithoutComments);
      continue;
    }

    // Handle a bare WORKSPACE PACKAGE ROOT import (e.g. '@dungeonmaster/orchestrator', or
    // '@acme/orders' in a published consumer — no folder-type subpath) — every real caller
    // reaches a package's own composed export this way ('import { StartOrchestrator } from
    // '@dungeonmaster/orchestrator''). The 3-segment scopedPackageMatch below never fires for
    // this shape (it requires a subpath segment), so without this branch the name is silently
    // dropped — invisible to enforce-proxy-child-creation, which then cannot tell a real missing
    // child proxy from a phantom one. Every named import is recorded here; enforce-proxy-child-creation
    // itself decides, per name, whether the package's own root barrel (src/index.ts) re-exports it
    // from a file that ships a colocated proxy — most root exports (contracts, statics, guards)
    // never do, so recording every name here costs nothing, exactly like a gateway pass-through
    // name costs nothing above. No gateway-folder-name check is needed: the gateway branch above
    // already `continue`s for '@dungeonmaster/npm' and its three siblings, so control only reaches
    // here when the segment is not one of them. `workspaceScope` is read off the REAL workspace
    // root by the caller (never hardcoded here) — with none given, this shape is skipped, the same
    // as any repo with no discoverable workspace root.
    const workspacePackageName = workspacePackageRootImportNameTransformer({
      importPath,
      workspaceScope,
    });
    if (workspacePackageName !== undefined) {
      for (const [name, path] of namedImportEntriesTransformer({
        namedImports,
        importPath: importPath ?? '',
      })) {
        imports.set(name, path);
      }
      match = importRegex.exec(contentWithoutComments);
      continue;
    }

    // Handle scoped package imports with folder type subpath (e.g., '@scope/pkg/brokers')
    // Pattern: @scope/package/folderType where folderType is a known folder type
    const scopedPackageMatch = importPath?.match(/^@[\w-]+\/[\w-]+\/(\w+)$/u);
    if (scopedPackageMatch !== null && scopedPackageMatch !== undefined) {
      const [, folderType] = scopedPackageMatch;
      // Check if the subpath is a known folder type that requires proxies
      if (folderType !== undefined && folderTypes.includes(folderType)) {
        const folderConfigValue = folderConfigTransformer({ folderType });

        if (folderConfigValue?.requireProxy === true) {
          for (const [name, path] of namedImportEntriesTransformer({
            namedImports,
            importPath: importPath ?? '',
          })) {
            imports.set(name, path);
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
      // Skip multi-dot files except .proxy and valid source extensions (.ts, .tsx, .js, .jsx)
      const filename = importPath.split('/').pop() ?? '';
      const dotCount = (filename.match(/\./gu) ?? []).length;
      const hasValidSourceExtension = fileExtensionsStatics.source.all.some((ext) =>
        importPath.endsWith(ext),
      );
      const isValidFile =
        dotCount === 0 || importPath.endsWith('.proxy') || hasValidSourceExtension;

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

        const folderConfigValue =
          folderTypeFromPath === null
            ? undefined
            : folderConfigTransformer({ folderType: folderTypeFromPath });

        // Only process if folder type requires proxies
        if (folderConfigValue?.requireProxy === true) {
          for (const [name, path] of namedImportEntriesTransformer({ namedImports, importPath })) {
            imports.set(name, path);
          }

          if (defaultImport !== undefined) {
            imports.set(
              identifierContract.parse(defaultImport),
              importPath,
            );
          }
        }
      }
    }

    match = importRegex.exec(contentWithoutComments);
  }

  return imports;
};
