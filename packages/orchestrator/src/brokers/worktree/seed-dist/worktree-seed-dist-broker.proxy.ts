import type { Dirent } from 'fs';

import {
  childProcessSpawnCaptureAdapterProxy,
  fsReaddirWithTypesAdapterProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import {
  AbsoluteFilePathStub,
  ErrorMessageStub,
  ExitCodeStub,
  FilePathStub,
  type AbsoluteFilePath,
} from '@dungeonmaster/shared/contracts';

import { fsIsAccessibleAdapterProxy } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter.proxy';

const COPY_COMMAND = 'cp';
const GREEN_EXIT_CODE = 0;
const RED_EXIT_CODE = 1;

const buildDirent = ({ name, isDir }: { name: string; isDir: boolean }): Dirent =>
  ({
    name,
    parentPath: '/stub',
    path: '/stub',
    isDirectory: () => isDir,
    isFile: () => !isDir,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

export const worktreeSeedDistBrokerProxy = (): {
  setupPackagesDirAbsent: () => void;
  setupPackages: (params: {
    repoRoot: AbsoluteFilePath;
    worktreePath: AbsoluteFilePath;
    packages: {
      name: string;
      isPackage?: boolean;
      hasSourceDist: boolean;
      hasTargetDist: boolean;
    }[];
  }) => void;
  setupCopySucceeds: () => void;
  setupCopyFails: (params: { output: string }) => void;
  getCopyArgs: () => unknown;
} => {
  const isAccessibleProxy = fsIsAccessibleAdapterProxy();
  // "Nothing is there" is the honest default: an undescribed path has not been built, and every
  // path a test does describe outranks this catch-all.
  isAccessibleProxy.defaultsToNotFound();
  const readdirProxy = fsReaddirWithTypesAdapterProxy();
  const spawnProxy = childProcessSpawnCaptureAdapterProxy();
  // Wired to satisfy enforce-proxy-child-creation and left UNADDRESSED: it defaults to a real
  // path.join passthrough, so every staged path must match Node's own output byte-for-byte.
  pathJoinAdapterProxy();

  return {
    setupPackagesDirAbsent: (): void => {
      isAccessibleProxy.defaultsToNotFound();
    },

    setupPackages: ({
      repoRoot,
      worktreePath,
      packages,
    }: {
      repoRoot: AbsoluteFilePath;
      worktreePath: AbsoluteFilePath;
      packages: {
        name: string;
        isPackage?: boolean;
        hasSourceDist: boolean;
        hasTargetDist: boolean;
      }[];
    }): void => {
      isAccessibleProxy.resolves({
        filePath: FilePathStub({ value: `${String(repoRoot)}/packages` }),
      });
      readdirProxy.returns({
        dirPath: AbsoluteFilePathStub({ value: `${String(repoRoot)}/packages` }),
        entries: packages.map(({ name }) => buildDirent({ name, isDir: true })),
      });

      packages.forEach(({ name, isPackage, hasSourceDist, hasTargetDist }) => {
        if (isPackage !== false) {
          isAccessibleProxy.resolves({
            filePath: FilePathStub({ value: `${String(repoRoot)}/packages/${name}/package.json` }),
          });
        }
        if (hasSourceDist) {
          isAccessibleProxy.resolves({
            filePath: FilePathStub({ value: `${String(repoRoot)}/packages/${name}/dist` }),
          });
        }
        if (hasTargetDist) {
          isAccessibleProxy.resolves({
            filePath: FilePathStub({
              value: `${String(worktreePath)}/packages/${name}/dist`,
            }),
          });
        }
      });
    },

    setupCopySucceeds: (): void => {
      spawnProxy.setupSuccess({
        command: COPY_COMMAND,
        exitCode: ExitCodeStub({ value: GREEN_EXIT_CODE }),
        stdout: ErrorMessageStub({ value: '' }),
        stderr: ErrorMessageStub({ value: '' }),
      });
    },

    setupCopyFails: ({ output }: { output: string }): void => {
      spawnProxy.setupSuccess({
        command: COPY_COMMAND,
        exitCode: ExitCodeStub({ value: RED_EXIT_CODE }),
        stdout: ErrorMessageStub({ value: '' }),
        stderr: ErrorMessageStub({ value: output }),
      });
    },

    getCopyArgs: (): unknown => spawnProxy.getSpawnedArgs({ command: COPY_COMMAND }),
  };
};
