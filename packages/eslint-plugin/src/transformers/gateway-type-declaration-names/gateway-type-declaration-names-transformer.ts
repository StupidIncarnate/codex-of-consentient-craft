/**
 * PURPOSE: Reads a gateway file's own source text and returns every `interface`/`type` alias name
 * it exports directly — the per-file text scan gateway-schema-brand's duplicate-name check needs to
 * build its repo-wide index without touching the filesystem itself (that walk is
 * collect-gateway-type-declaration-names-layer-broker's job; this stays a pure text-in/data-out
 * function, the same split gatewayBarrelExportedNamesTransformer keeps for direct-export names —
 * kept as its own transformer rather than folded into that one, since PascalCase type declarations
 * are a different shape than the lowerCamelCase `const`/`function`/`class` names it already covers).
 *
 * USAGE:
 * gatewayTypeDeclarationNamesTransformer({ sourceText: 'export interface WalkedFile {\n  path: unknown;\n}\n' });
 * // Returns ['WalkedFile']
 */
import { identifierContract } from '@dungeonmaster/shared/contracts';
import type { Identifier } from '@dungeonmaster/shared/contracts';

const TYPE_DECLARATION = /export\s+(?:interface|type)\s+([A-Za-z0-9_$]+)/gu;

export const gatewayTypeDeclarationNamesTransformer = ({
  sourceText,
}: {
  sourceText: string;
}): Identifier[] =>
  Array.from(sourceText.matchAll(TYPE_DECLARATION))
    .map((match) => match[1])
    .filter((name) => name !== undefined)
    .map((name) => identifierContract.parse(name));
