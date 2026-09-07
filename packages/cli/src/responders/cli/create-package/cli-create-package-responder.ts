/**
 * PURPOSE: Owns the one branch `dungeonmaster create-package` cannot delegate to a collaborator —
 * whether this run is a human being prompted at a terminal or a script/agent driven entirely by
 * flags. Everything else (parsing, scope detection, request resolution, file planning, writing,
 * registration) is a single call to a collaborator; this file only sequences those calls and
 * narrates them to stdout.
 *
 * USAGE:
 * await CliCreatePackageResponder({ context, args: ['--name', 'widgets', '--type', 'library'] });
 * // Scaffolds packages/widgets, registers it in the root package.json, and narrates both to stdout
 */

import type { AdapterResult, InstallContext } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { createPackageResolveRequestBroker } from '../../../brokers/create-package/resolve-request/create-package-resolve-request-broker';
import { packageRegisterBroker } from '../../../brokers/package/register/package-register-broker';
import { packageScaffoldWriteBroker } from '../../../brokers/package/scaffold-write/package-scaffold-write-broker';
import { packageJsonRawContract } from '../../../contracts/package-json-raw/package-json-raw-contract';
import { packageScaffoldConfigStatics } from '../../../statics/package-scaffold-config/package-scaffold-config-statics';
import { createPackageArgsParseTransformer } from '../../../transformers/create-package-args-parse/create-package-args-parse-transformer';
import { packageScaffoldFilesTransformer } from '../../../transformers/package-scaffold-files/package-scaffold-files-transformer';
import { workspaceScopeDetectTransformer } from '../../../transformers/workspace-scope-detect/workspace-scope-detect-transformer';

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
  const scope = workspaceScopeDetectTransformer({ rootPackageJson });

  // Zero args at a terminal prompts; zero args with no TTY falls through to the resolver, which
  // throws naming --name, so a script or agent can never hang on stdin — any args at all is
  // already non-interactive.
  const interactive = args.length === 0 && process.stdin.isTTY;

  const request = await createPackageResolveRequestBroker({
    args: parsedArgs,
    scope,
    interactive,
  });
  const files = packageScaffoldFilesTransformer({ request });
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
