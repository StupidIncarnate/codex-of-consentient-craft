/**
 * PURPOSE: Owns the one branch `dungeonmaster create-package` cannot delegate to a collaborator —
 * whether this run is a human being prompted at a terminal or a script/agent driven entirely by
 * flags. Everything else (parsing, scope detection, request resolution, file planning, writing,
 * registration) is a single call to a collaborator; this file only sequences those calls and
 * narrates them to stdout.
 *
 * Scope detection reuses `workspaceScopeFromRootNameTransformer` — the SAME shared transformer
 * `dungeonmaster init`'s gateway step used to name `packages/@gateway/*` in the first place (root
 * package.json's own `name`, falling back to the target directory's basename) — rather than
 * inferring a scope from any dependency list. A dependency-list scan is unreliable two ways at
 * once: `init` writes every `@dungeonmaster/*` tooling package into `devDependencies` (never
 * `dependencies`), and even a merged scan would misread THAT scope as the consumer's own, since
 * `@dungeonmaster/*` is the tool vendor's scope, not whatever scope the consumer picked for their
 * own workspace. Reusing the gateway's own detector guarantees a new package's `#gateway/*` imports
 * field always agrees with the real, already-scaffolded `@gateway/*` packages on disk. A fallback
 * name is always passed here, so the transformer's `undefined` branch (no name and no fallback) is
 * unreachable in this file — the throw below only narrows the type for it.
 *
 * A scaffolded package's `jest.config.js` also branches on context: this repo's OWN packages
 * require the repo-root `jest.config.base.js` (packages/CLAUDE.md's own jest section), which exists
 * only in THIS checkout, so a consumer repo gets no such file and needs the PUBLISHED
 * `@dungeonmaster/testing/jest-config-base` instead. `usesPublishedJestBase` answers that by asking
 * disk whether the repo-root file exists, once, here — `packageScaffoldFilesTransformer` stays pure
 * and only branches on the boolean it is handed.
 *
 * USAGE:
 * await CliCreatePackageResponder({ context, args: ['--name', 'widgets', '--type', 'library'] });
 * // Scaffolds packages/widgets, registers it in the root package.json, and narrates both to stdout
 */

import { packageJsonContract } from '@dungeonmaster/shared/contracts';
import type { InstallContext } from '@dungeonmaster/shared/contracts';
import { existsSync } from '#gateway/node/fs';
import { readFile } from '#gateway/node/fs__promises';
import { basename, join } from '#gateway/node/path';
import { stdinIsTty, stdout } from '#gateway/node/process';
import { workspaceScopeFromRootNameTransformer } from '@dungeonmaster/shared/transformers';

import { createPackageResolveRequestBroker } from '../../../brokers/create-package/resolve-request/create-package-resolve-request-broker';
import { packageRegisterBroker } from '../../../brokers/package/register/package-register-broker';
import { packageScaffoldWriteBroker } from '../../../brokers/package/scaffold-write/package-scaffold-write-broker';
import { packageJsonRawContract } from '@dungeonmaster/shared/contracts';
import { packageScaffoldConfigStatics } from '../../../statics/package-scaffold-config/package-scaffold-config-statics';
import { createPackageArgsParseTransformer } from '../../../transformers/create-package-args-parse/create-package-args-parse-transformer';
import { packageScaffoldFilesTransformer } from '../../../transformers/package-scaffold-files/package-scaffold-files-transformer';

const JEST_CONFIG_BASE_FILENAME = 'jest.config.base.js';

export const CliCreatePackageResponder = async ({
  context,
  args,
}: {
  context: InstallContext;
  args: readonly string[];
}): Promise<void> => {
  const parsedArgs = createPackageArgsParseTransformer({ args });

  const rootPackageJsonPath = join(context.targetProjectRoot, 'package.json');
  const rootPackageJsonContent = await readFile(rootPackageJsonPath);
  const rootPackageJson = packageJsonRawContract.parse(JSON.parse(rootPackageJsonContent));
  const nameKey = packageJsonRawContract.keyType.parse('name');
  const rootNameValue = rootPackageJson[nameKey];
  const rootPackageJsonName = packageJsonContract.shape.name.parse(
    typeof rootNameValue === 'string' ? rootNameValue : undefined,
  );
  const fallbackName = basename(context.targetProjectRoot);
  const scope = workspaceScopeFromRootNameTransformer({ rootPackageJsonName, fallbackName });
  if (scope === undefined) {
    throw new Error(
      `Could not derive a workspace scope for ${context.targetProjectRoot}: no root package.json name and no fallback directory name`,
    );
  }

  const jestConfigBasePath = join(context.targetProjectRoot, JEST_CONFIG_BASE_FILENAME);
  const usesPublishedJestBase = !existsSync(jestConfigBasePath);

  // Zero args at a terminal prompts; zero args with no TTY falls through to the resolver, which
  // throws naming --name, so a script or agent can never hang on stdin — any args at all is
  // already non-interactive.
  const interactive = args.length === 0 && stdinIsTty();

  const request = await createPackageResolveRequestBroker({
    args: parsedArgs,
    scope,
    interactive,
  });
  const files = packageScaffoldFilesTransformer({
    request,
    usesPublishedJestBase,
    workspaceScope: scope,
  });
  const packageRoot = join(context.targetProjectRoot, request.packagesDir, request.directoryName);

  stdout.write(`Scaffolding ${request.packageName} at ${packageRoot}\n`);
  files.forEach((file) => {
    stdout.write(`  ${file.relativePath}\n`);
    if (parsedArgs.dryRun) {
      stdout.write(file.contents);
    }
  });

  if (parsedArgs.dryRun) {
    stdout.write(`Would write ${files.length} files. Nothing was written.\n`);
    return;
  }

  const writtenFiles = await packageScaffoldWriteBroker({ packageRoot, files });
  const registered = await packageRegisterBroker({
    projectRoot: context.targetProjectRoot,
    packageName: request.packageName,
  });

  stdout.write(`Wrote ${writtenFiles.length} files.\n`);
  stdout.write(
    registered
      ? `Registered ${request.packageName} in the root package.json.\n`
      : `${request.packageName} was already registered in the root package.json.\n`,
  );

  // e2eEligible is what put a playwright.config.ts in `files`; branching on that relativePath
  // instead of on packageType keeps this in sync with the seed tables without a second switch.
  const isE2eEligible = files.some(
    (file) => file.relativePath === packageScaffoldConfigStatics.playwrightConfigFileName,
  );

  stdout.write('Next steps:\n');
  stdout.write('  npm install\n');
  stdout.write(`  npm run ward -- -- ${request.packagesDir}/${request.directoryName}\n`);

  if (isE2eEligible) {
    stdout.write(
      '  ward\'s e2e check stays red until this package adds a "dev:no-watch" script and at least one *.e2e.ts spec.\n',
    );
  }
};
