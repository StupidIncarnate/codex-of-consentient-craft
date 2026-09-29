/**
 * PURPOSE: Validates a parsed package.json the way gateway-dependency-declared reads it — the
 * IMPORTING file's own nearest manifest, never the workspaces root workspaceRootPackageJsonContract
 * targets. Brands `name` and every `dependencies`/`devDependencies` key as the same `PackageName`
 * packageNameFromSpecifierTransformer produces, so a resolved gateway target can be looked up in
 * either map with no re-parse. An `imports` value may be a bare string target or a conditions
 * object, matching Node's own subpath-imports shape.
 *
 * USAGE:
 * gatewayConsumerPackageJsonContract.parse({
 *   name: '@dungeonmaster/hooks',
 *   imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
 *   dependencies: { '@dungeonmaster/npm': '*' },
 * });
 * // Returns the parsed shape; unrecognized fields pass through untouched
 */
import { z } from '#gateway/npm/zod';
import { packageNameContract } from '@dungeonmaster/shared/contracts';

const gatewayImportsTargetContract = z.union([
  z.string().brand<'GatewayImportsTarget'>(),
  z
    .object({
      source: z.string().brand<'GatewayImportsTarget'>().optional(),
      import: z.string().brand<'GatewayImportsTarget'>().optional(),
      require: z.string().brand<'GatewayImportsTarget'>().optional(),
      default: z.string().brand<'GatewayImportsTarget'>().optional(),
    })
    .loose(),
]);

export const gatewayConsumerPackageJsonContract = z
  .object({
    name: packageNameContract,
    imports: z
      .record(z.string().brand<'GatewayImportsSpecifier'>(), gatewayImportsTargetContract)
      .optional(),
    dependencies: z.record(packageNameContract, z.string().brand<'DepVersion'>()).optional(),
    devDependencies: z.record(packageNameContract, z.string().brand<'DepVersion'>()).optional(),
  })
  .loose();

export type GatewayConsumerPackageJson = z.infer<typeof gatewayConsumerPackageJsonContract>;
