/**
 * PURPOSE: Resolves `someStatics.property` to its string when `someStatics` is a NAMED import from a
 * RELATIVE path — `import { bundleStatics } from '../../statics/bundle/bundle-statics'` — by reading
 * that file (`<path>.ts`, `.tsx`, or `<path>/index.ts`) and scanning its `export const` object literal
 * for a plain top-level string property. It cannot see through an import from a workspace package
 * (`@scope/pkg/statics`), a `#` alias, a default or namespace import, a re-exporting barrel, a
 * nested object's property, or a file that does not exist: each returns undefined and the caller
 * fails open. Reads the file itself, so it is reached only for a member access whose object is not a
 * same-module const.
 *
 * USAGE:
 * resolveImportedStaticsLayerBroker({ objectName: 'bundleStatics', propertyName: 'buildCommand', moduleBody, filename });
 * // Returns 'npm' as ContentText, or undefined when the import or its property cannot be read
 */
import type { ContentText } from '@dungeonmaster/shared/contracts';
import { readFileSyncIfExists } from '#gateway/node/fs';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { filepathResolveRelativeImportTransformer } from '../../../transformers/filepath-resolve-relative-import/filepath-resolve-relative-import-transformer';
import { staticsStringPropertyTransformer } from '../../../transformers/statics-string-property/statics-string-property-transformer';

export const resolveImportedStaticsLayerBroker = ({
  objectName,
  propertyName,
  moduleBody,
  filename,
}: {
  objectName: string;
  propertyName: string;
  moduleBody: readonly TSESTree.ProgramStatement[];
  filename: string;
}): ContentText | undefined => {
  for (const statement of moduleBody) {
    if (statement.type !== AST_NODE_TYPES.ImportDeclaration) {
      continue;
    }
    const source = statement.source.value;
    if (!source.startsWith('.')) {
      continue;
    }

    for (const specifier of statement.specifiers) {
      if (
        specifier.type !== AST_NODE_TYPES.ImportSpecifier ||
        specifier.local.name !== objectName ||
        specifier.imported.type !== AST_NODE_TYPES.Identifier
      ) {
        continue;
      }

      const resolved = filepathResolveRelativeImportTransformer({
        currentFilePath: filename,
        importPath: source,
      });
      // The transformer always hands back a path ending in a source extension.
      const stem = resolved.slice(0, resolved.lastIndexOf('.'));
      for (const candidate of [`${stem}.ts`, `${stem}.tsx`, `${stem}/index.ts`]) {
        const contents = readFileSyncIfExists(candidate);
        if (contents !== null) {
          return staticsStringPropertyTransformer({
            source: contents,
            objectName: specifier.imported.name,
            propertyName,
          });
        }
      }
      return undefined;
    }
  }

  return undefined;
};
