/**
 * PURPOSE: Reads a gateway WRAPPER file's own source text (a function/schema implementation, an
 * `.error.ts` companion, a single-property destructured global capture like `process/argv/argv.ts`'s
 * `export const { argv } = process;`, or a type-only companion beside it) and splits its top-level
 * exports into VALUE names (a `const`, `function` or `class` declaration, or a destructured global
 * capture's one bound name — what a barrel's completeness check must re-export) and TYPE names (a
 * `type` or `interface` declaration — never required, but still a real name a barrel's existing
 * re-export can validly point at). Regex-based, like gatewayBarrelExportedNamesTransformer, for the
 * same reason: barrel-completeness-layer-broker reads sibling files the current lint pass never
 * visits, so there is no AST to walk for them.
 *
 * USAGE:
 * gatewayWrapperExportedNamesTransformer({ sourceText: 'export const readFileSync = () => "";' });
 * // Returns { valueNames: ['readFileSync'], typeNames: [] }
 */
import { identifierContract } from '@dungeonmaster/shared/contracts';
import type { Identifier } from '@dungeonmaster/shared/contracts';

const VALUE_DECLARATION = /export\s+(?:const|function|class)\s+([A-Za-z0-9_$]+)/gu;
const DESTRUCTURED_CAPTURE = /export\s+const\s+\{\s*([A-Za-z0-9_$]+)\s*\}\s*=/gu;
const TYPE_DECLARATION = /export\s+(?:type|interface)\s+([A-Za-z0-9_$]+)/gu;

export const gatewayWrapperExportedNamesTransformer = ({
  sourceText,
}: {
  sourceText: string;
}): { valueNames: Identifier[]; typeNames: Identifier[] } => {
  const valueNames = new Set<Identifier>();
  for (const match of sourceText.matchAll(VALUE_DECLARATION)) {
    const [, name] = match;
    if (name !== undefined) {
      valueNames.add(identifierContract.parse(name));
    }
  }

  for (const match of sourceText.matchAll(DESTRUCTURED_CAPTURE)) {
    const [, name] = match;
    if (name !== undefined) {
      valueNames.add(identifierContract.parse(name));
    }
  }

  const typeNames = new Set<Identifier>();
  for (const match of sourceText.matchAll(TYPE_DECLARATION)) {
    const [, name] = match;
    if (name !== undefined) {
      typeNames.add(identifierContract.parse(name));
    }
  }

  return { valueNames: Array.from(valueNames), typeNames: Array.from(typeNames) };
};
