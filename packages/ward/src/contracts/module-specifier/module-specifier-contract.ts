/**
 * PURPOSE: The literal text of one `import`/`export ... from` specifier, before it is resolved to a
 * file — a relative path (`./x`), a workspace bare specifier (`@dungeonmaster/node/fs`), or a
 * third-party package name (`zod`). Kept distinct from `FilePath` because a specifier is not yet
 * a location on disk; resolving one is exactly what `resolveSpecifierLayerBroker` does.
 *
 * USAGE:
 * moduleSpecifierContract.parse('@dungeonmaster/node/fs');
 * // Returns branded ModuleSpecifier
 */

import { z } from '#gateway/npm/zod';

export const moduleSpecifierContract = z.string().min(1).brand<'ModuleSpecifier'>();

export type ModuleSpecifier = z.infer<typeof moduleSpecifierContract>;
