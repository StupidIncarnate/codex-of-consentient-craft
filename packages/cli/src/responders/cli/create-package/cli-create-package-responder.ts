/**
 * PURPOSE: Owns the one branch `dungeonmaster create-package` cannot delegate to a collaborator —
 * whether this run is a human being prompted at a terminal or a script/agent driven entirely by
 * flags. Everything else (parsing, scope detection, request resolution, file planning, writing,
 * registration) is a single call to a collaborator; this file only sequences those calls and
 * narrates them to stdout.
 *
 * Scope detection reuses `gatewayScopeDetectTransformer` — the SAME transformer `dungeonmaster
 * init`'s gateway step used to name `packages/@gateway/*` in the first place (root package.json's
 * own `name`, falling back to the target directory's basename) — rather than inferring a scope from
 * any dependency list. A dependency-list scan is unreliable two ways at once: `init` writes every
 * `@dungeonmaster/*` tooling package into `devDependencies` (never `dependencies`), and even a
 * merged scan would misread THAT scope as the consumer's own, since `@dungeonmaster/*` is the
 * tool vendor's scope, not whatever scope the consumer picked for their own workspace. Reusing the
 * gateway's own detector guarantees a new package's `#gateway/*` imports field always agrees with
 * the real, already-scaffolded `@gateway/*` packages on disk.
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

import type { AdapterResult, InstallContext } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import {
  pathJoinAdapter,
  fsExistsSyncAdapter,
  pathBasenameAdapter,
} from '@dungeonmaster/shared/adapters';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { createPackageResolveRequestBroker } from '../../../brokers/create-package/resolve-request/create-package-resolve-request-broker';
import { packageRegisterBroker } from '../../../brokers/package/register/package-register-broker';
import { packageScaffoldWriteBroker } from '../../../brokers/package/scaffold-write/package-scaffold-write-broker';
import { packageJsonRawContract } from '../../../contracts/package-json-raw/package-json-raw-contract';
import { packageScaffoldConfigStatics } from '../../../statics/package-scaffold-config/package-scaffold-config-statics';
import { createPackageArgsParseTransformer } from '../../../transformers/create-package-args-parse/create-package-args-parse-transformer';
import { packageScaffoldFilesTransformer } from '../../../transformers/package-scaffold-files/package-scaffold-files-transformer';
import { gatewayScopeDetectTransformer } from '../../../transformers/gateway-scope-detect/gateway-scope-detect-transformer';

const JEST_CONFIG_BASE_FILENAME = 'jest.config.base.js';

export const CliCreatePackageResponder = async ({
  context,
  args,
}: {
  context: InstallContext;
  args: readonly string[];
}): Promise<AdapterResult> => {
  const parsedArgs = createPackageArgsParseTransformer({ args });

  const rootPackageJsonPath = pathJoinAdapter({
    paths: [context.targetProjectRoot, 'package.json'],
  });
  const rootPackageJsonContent = await fsReadFileAdapter({ filePath: rootPackageJsonPath });
  const rootPackageJsonRaw: unknown = JSON.parse(rootPackageJsonContent);
  const rootPackageJson = packageJsonRawContract.parse(rootPackageJsonRaw);
  const nameKey = packageJsonRawContract.keySchema.parse('name');
  const rootNameValue = rootPackageJson[nameKey];
  const rootPackageJsonName = typeof rootNameValue === 'string' ? rootNameValue : undefined;
  const fallbackName = pathBasenameAdapter({ path: context.targetProjectRoot });
  const scope = gatewayScopeDetectTransformer({ rootPackageJsonName, fallbackName });

  const jestConfigBasePath = pathJoinAdapter({
    paths: [context.targetProjectRoot, JEST_CONFIG_BASE_FILENAME],
  });
  const usesPublishedJestBase = !fsExistsSyncAdapter({ filePath: jestConfigBasePath });

  // Zero args at a terminal prompts; zero args with no TTY falls through to the resolver, which
  // throws naming --name, so a script or agent can never hang on stdin — any args at all is
  // already non-interactive.
  const interactive = args.length === 0 && process.stdin.isTTY;

  const request = await createPackageResolveRequestBroker({
    args: parsedArgs,
    scope,
    interactive,
  });
  const files = packageScaffoldFilesTransformer({ request, usesPublishedJestBase });
  const packageRoot = pathJoinAdapter({
    paths: [context.targetProjectRoot, request.packagesDir, request.directoryName],
  });

  process.stdout.write(`Scaffolding ${request.packageName} at ${packageRoot}\n`);
  files.forEach((file) => {
    process.stdout.write(`  ${file.relativePath}\n`);
  });

  if (parsedArgs.dryRun) {
    process.stdout.write(`Would write ${files.length} files. Nothing was written.\n`);
    return adapterResultContract.parse({ success: true });
  }

  const writtenFiles = await packageScaffoldWriteBroker({ packageRoot, files });
  const registered = await packageRegisterBroker({
    projectRoot: context.targetProjectRoot,
    packageName: request.packageName,
  });

  process.stdout.write(`Wrote ${writtenFiles.length} files.\n`);
  process.stdout.write(
    registered
      ? `Registered ${request.packageName} in the root package.json.\n`
      : `${request.packageName} was already registered in the root package.json.\n`,
  );

  // e2eEligible is what put a playwright.config.ts in `files`; branching on that relativePath
  // instead of on packageType keeps this in sync with the seed tables without a second switch.
  const isE2eEligible = files.some(
    (file) => file.relativePath === packageScaffoldConfigStatics.playwrightConfigFileName,
  );

  process.stdout.write('Next steps:\n');
  process.stdout.write('  npm install\n');
  process.stdout.write(`  npm run ward -- -- ${request.packagesDir}/${request.directoryName}\n`);

  if (isE2eEligible) {
    process.stdout.write(
      '  ward\'s e2e check stays red until this package adds a "dev:no-watch" script and at least one *.e2e.ts spec.\n',
    );
  }

  return adapterResultContract.parse({ success: true });
};
