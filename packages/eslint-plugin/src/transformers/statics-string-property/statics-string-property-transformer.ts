/**
 * PURPOSE: Reads ONE string property off an exported `const` object literal in a statics file's
 * SOURCE TEXT — `export const bundleStatics = { buildCommand: 'npm', … } as const;` then
 * `buildCommand` gives `'npm'`. It is a scan, not a parse: it keeps only the object's own top-level
 * text (`topLevelTextLayerTransformer`) and takes a value that is a plain quoted string (no escapes,
 * no template substitutions). A nested object's key, a computed value, a spread, a re-exported
 * object and a declaration that is not `export const <name> = {` all return undefined — the caller
 * fails open on them.
 *
 * USAGE:
 * staticsStringPropertyTransformer({ source, objectName: 'bundleStatics', propertyName: 'buildCommand' });
 * // Returns 'npm' as ContentText, or undefined when the property is not a plain top-level string
 */
import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';
import { topLevelTextLayerTransformer } from './top-level-text-layer-transformer';

const IDENTIFIER_PATTERN = /^[A-Za-z_$][\w$]*$/u;
const DOLLAR_PATTERN = /\$/gu;

export const staticsStringPropertyTransformer = ({
  source,
  objectName,
  propertyName,
}: {
  source: string;
  objectName: string;
  propertyName: string;
}): ContentText | undefined => {
  if (!IDENTIFIER_PATTERN.test(objectName) || !IDENTIFIER_PATTERN.test(propertyName)) {
    return undefined;
  }

  const escapedObject = objectName.replace(DOLLAR_PATTERN, '\\$');
  const declaration = new RegExp(
    `(?:^|\\n)\\s*export\\s+const\\s+${escapedObject}\\b[^=\\n]*=\\s*\\{`,
    'u',
  ).exec(source);
  if (declaration === null) {
    return undefined;
  }

  const topLevel = topLevelTextLayerTransformer({
    body: contentTextContract.parse(source.slice(declaration.index + declaration[0].length)),
  });
  const escapedProperty = propertyName.replace(DOLLAR_PATTERN, '\\$');
  const property = new RegExp(
    `(?:^|[,\\s])(?:${escapedProperty}|'${escapedProperty}'|"${escapedProperty}")\\s*:\\s*(?:'([^'\\\\]*)'|"([^"\\\\]*)"|\`([^\`\\\\$]*)\`)`,
    'u',
  ).exec(topLevel);
  const value = property?.[1] ?? property?.[2] ?? property?.[3];

  return value === undefined || value.length === 0 ? undefined : contentTextContract.parse(value);
};
