/**
 * PURPOSE: Reads the raw flags after `dungeonmaster create-package` and turns them into a
 * `CreatePackageArgs`, rejecting anything it does not recognize with a message naming the exact
 * token at fault. It never decides what is REQUIRED — every field it fills stays optional, and
 * zero args is a valid result (the interactive-prompt entry point), not an error — because the
 * responder that calls this owns prompting for gaps and refusing an incomplete request. That is
 * the whole reason this returns `CreatePackageArgs` rather than `CreatePackageRequest`: this layer
 * only has an OPINION about whether a token is well-formed, never about whether the caller is done.
 *
 * USAGE:
 * createPackageArgsParseTransformer({ args: ['--name', '@acme/widgets', '--type', 'library'] });
 * // Returns CreatePackageArgs { name: '@acme/widgets', packageType: 'library', dryRun: false }
 */

import {
  packageNameContract,
  packageTypeContract,
  contentTextContract,
  pathSegmentContract,
} from '@dungeonmaster/shared/contracts';
import { packageBuildOrderStatics } from '@dungeonmaster/shared/statics';

import {
  createPackageArgsContract,
  type CreatePackageArgs,
} from '../../contracts/create-package-args/create-package-args-contract';

const NAME_FLAG = '--name';
const TYPE_FLAG = '--type';
const DESCRIPTION_FLAG = '--description';
const DIR_FLAG = '--dir';
const DRY_RUN_FLAG = '--dry-run';

const KNOWN_FLAGS = new Set([NAME_FLAG, TYPE_FLAG, DESCRIPTION_FLAG, DIR_FLAG, DRY_RUN_FLAG]);

const VALID_PACKAGE_TYPES = packageBuildOrderStatics.tiers.flat();

const USAGE =
  'Usage: dungeonmaster create-package [--name <name>] [--type <type>] ' +
  '[--description <text>] [--dir <path>] [--dry-run]';

export const createPackageArgsParseTransformer = ({
  args,
}: {
  args: readonly string[];
}): CreatePackageArgs => {
  const parsed: Partial<CreatePackageArgs> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === NAME_FLAG) {
      const value = args[i + 1];
      if (value === undefined || value.startsWith('--')) {
        throw new Error(
          `${NAME_FLAG} requires a value: it cannot be the last argument, and the next ` +
            `argument cannot itself start with "--".\n\n${USAGE}`,
        );
      }
      parsed.name = packageNameContract.parse(value);
      i++;
      continue;
    }

    if (arg === TYPE_FLAG) {
      const value = args[i + 1];
      if (value === undefined || value.startsWith('--')) {
        throw new Error(
          `${TYPE_FLAG} requires a value: it cannot be the last argument, and the next ` +
            `argument cannot itself start with "--".\n\n${USAGE}`,
        );
      }
      try {
        parsed.packageType = packageTypeContract.parse(value);
      } catch {
        throw new Error(
          `Invalid ${TYPE_FLAG} value: "${value}"\n\n` +
            `Valid package types are: ${VALID_PACKAGE_TYPES.join(', ')}\n\n${USAGE}`,
        );
      }
      i++;
      continue;
    }

    if (arg === DESCRIPTION_FLAG) {
      const value = args[i + 1];
      if (value === undefined || value.startsWith('--')) {
        throw new Error(
          `${DESCRIPTION_FLAG} requires a value: it cannot be the last argument, and the next ` +
            `argument cannot itself start with "--".\n\n${USAGE}`,
        );
      }
      parsed.description = contentTextContract.parse(value);
      i++;
      continue;
    }

    if (arg === DIR_FLAG) {
      const value = args[i + 1];
      if (value === undefined || value.startsWith('--')) {
        throw new Error(
          `${DIR_FLAG} requires a value: it cannot be the last argument, and the next ` +
            `argument cannot itself start with "--".\n\n${USAGE}`,
        );
      }
      parsed.packagesDir = pathSegmentContract.parse(value);
      i++;
      continue;
    }

    if (arg === DRY_RUN_FLAG) {
      parsed.dryRun = true;
      continue;
    }

    if (arg?.startsWith('--')) {
      throw new Error(
        `Unknown flag: ${arg}\n\nAccepted flags: ${[...KNOWN_FLAGS].join(', ')}\n\n${USAGE}`,
      );
    }

    throw new Error(
      `Unexpected positional argument: ${arg}\n\n` +
        `Every value must directly follow the flag it belongs to.\n\n${USAGE}`,
    );
  }

  return createPackageArgsContract.parse(parsed);
};
