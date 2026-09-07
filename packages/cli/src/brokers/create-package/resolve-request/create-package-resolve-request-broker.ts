/**
 * PURPOSE: The single place `dungeonmaster create-package` turns a partly-filled command line into a
 * complete scaffold request. It is the one component that knows the difference between the command's
 * two modes: a human typing the command bare gets prompted on stdin, while a script or agent passing
 * flags is never blocked waiting for input a non-interactive caller has no way to supply.
 *
 * USAGE:
 * const request = await createPackageResolveRequestBroker({
 *   args: CreatePackageArgsStub({ name: 'widgets', packageType: 'library' }),
 *   scope: PathSegmentStub({ value: '@acme' }),
 *   interactive: false,
 * });
 * // Returns a CreatePackageRequest with packageName '@acme/widgets' and directoryName 'widgets'
 */

import {
  packageNameContract,
  packageTypeContract,
  contentTextContract,
  pathSegmentContract,
} from '@dungeonmaster/shared/contracts';
import type {
  PackageName,
  PackageType,
  ContentText,
  PathSegment,
} from '@dungeonmaster/shared/contracts';
import { packageBuildOrderStatics } from '@dungeonmaster/shared/statics';

import { readlineQuestionAdapter } from '../../../adapters/readline/question/readline-question-adapter';
import { packageScaffoldConfigStatics } from '../../../statics/package-scaffold-config/package-scaffold-config-statics';
import {
  createPackageRequestContract,
  type CreatePackageRequest,
} from '../../../contracts/create-package-request/create-package-request-contract';
import type { CreatePackageArgs } from '../../../contracts/create-package-args/create-package-args-contract';

export const createPackageResolveRequestBroker = async ({
  args,
  scope,
  interactive,
}: {
  args: CreatePackageArgs;
  scope: PathSegment;
  interactive: boolean;
}): Promise<CreatePackageRequest> => {
  const nameAnswer =
    args.name === undefined
      ? interactive
        ? await readlineQuestionAdapter({
            prompt: 'Package name: ',
            fallback: contentTextContract.parse(''),
          })
        : undefined
      : args.name;

  if (nameAnswer === undefined) {
    throw new Error(
      '--name is required when running non-interactively; dungeonmaster create-package will not prompt for input.',
    );
  }

  if (String(nameAnswer) === '') {
    throw new Error('Package name is required.');
  }

  const name = packageNameContract.parse(nameAnswer);

  const isFullyScoped = name.startsWith('@') && name.includes('/');
  const directoryName: PathSegment = pathSegmentContract.parse(
    isFullyScoped ? name.slice(name.indexOf('/') + 1) : name,
  );
  const packageName: PackageName = isFullyScoped
    ? name
    : String(scope) === ''
      ? name
      : packageNameContract.parse(`${scope}/${name}`);

  const packageTypeAnswer =
    args.packageType === undefined
      ? interactive
        ? await readlineQuestionAdapter({
            prompt: 'Package type: ',
            fallback: contentTextContract.parse('library'),
          })
        : undefined
      : args.packageType;

  if (packageTypeAnswer === undefined) {
    throw new Error(
      '--type is required when running non-interactively; dungeonmaster create-package will not prompt for input.',
    );
  }

  const parsedType = packageTypeContract.safeParse(packageTypeAnswer);

  if (!parsedType.success) {
    const validTypes = packageBuildOrderStatics.tiers.flat().join(', ');
    throw new Error(`Invalid package type "${packageTypeAnswer}". Valid types: ${validTypes}.`);
  }

  const packageType: PackageType = parsedType.data;

  const descriptionDefault = contentTextContract.parse(`${directoryName} package`);
  const description: ContentText =
    args.description === undefined
      ? interactive
        ? await readlineQuestionAdapter({ prompt: 'Description: ', fallback: descriptionDefault })
        : descriptionDefault
      : args.description;

  const packagesDir: PathSegment =
    args.packagesDir ?? pathSegmentContract.parse(packageScaffoldConfigStatics.defaultPackagesDir);

  return createPackageRequestContract.parse({
    packageName,
    directoryName,
    packageType,
    description,
    packagesDir,
  });
};
