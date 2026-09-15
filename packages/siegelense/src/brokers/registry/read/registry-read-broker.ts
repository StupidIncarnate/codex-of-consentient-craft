/**
 * PURPOSE: Reads this machine's siegelense instance registry off disk. A MISSING `registry.json`
 * is a real, empty fleet — `{ instances: [] }` — because a fresh `<home>/.dungeonmaster/siegelense/`
 * tree with nothing yet started must parse exactly like a populated one. A PRESENT-but-unparseable
 * file throws `RegistryUnreadableError` instead of falling back to empty: collapsing "broken" into
 * "empty" is how a session concludes the machine is idle while three instances are still running,
 * and starts more on top of them (siegelense-tooling.md line 288 — a reaped instance still keeps
 * its row as a tombstone, so "gone" is never read back as "nothing was ever here").
 *
 * USAGE:
 * const registry = await registryReadBroker();
 * // Returns Registry — { instances: [] } when registry.json does not exist yet
 */

import { fsExistsSyncAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { registryContract } from '../../../contracts/registry/registry-contract';
import type { Registry } from '../../../contracts/registry/registry-contract';
import { RegistryUnreadableError } from '../../../errors/registry-unreadable/registry-unreadable-error';
import { locationsRegistryPathFindBroker } from '../../locations/registry-path-find/locations-registry-path-find-broker';

export const registryReadBroker = async (): Promise<Registry> => {
  const registryPath = locationsRegistryPathFindBroker();

  if (!fsExistsSyncAdapter({ filePath: filePathContract.parse(registryPath) })) {
    return registryContract.parse({ instances: [] });
  }

  try {
    const contents = await fsReadFileAdapter({ filePath: registryPath });
    return registryContract.parse(JSON.parse(contents));
  } catch (error) {
    throw new RegistryUnreadableError({ registryPath, cause: error });
  }
};
