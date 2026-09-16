/**
 * PURPOSE: Names one package.json field that declares a file path — "main", "types", a bin entry,
 * or one exports condition such as `exports["."]["import"]` — together with the relative path the
 * manifest names for it. `workspaceManifestEntriesVerifyBroker` stats this path against the
 * package directory; the field surviving into that broker's return value means the file it names
 * is missing — the exact shape that breaks a real `require`/`import` while every ward check, which
 * sets `--conditions=source`, resolves straight past it to TypeScript instead.
 *
 * USAGE:
 * const declaration = manifestEntryDeclarationContract.parse({ field: 'main', declaredPath: 'dist/index.js' });
 * // Returns a branded ManifestEntryDeclaration
 */

import { z } from 'zod';

export const manifestEntryDeclarationContract = z.object({
  field: z.string().min(1).brand<'ManifestEntryField'>(),
  declaredPath: z.string().min(1).brand<'ManifestDeclaredPath'>(),
});

export type ManifestEntryDeclaration = z.infer<typeof manifestEntryDeclarationContract>;
