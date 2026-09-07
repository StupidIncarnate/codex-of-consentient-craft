import { fsExistsSyncAdapterProxy } from '@dungeonmaster/shared/testing';
import {
  filePathContract,
  type AbsoluteFilePath,
  type FilePath,
} from '@dungeonmaster/shared/contracts';

const SOURCE_BARREL_SUFFIX = '/node_modules/@dungeonmaster/shared/statics.ts';

// The broker asks about EVERY ancestor of cwd, so a composing proxy that wants "not reachable" has
// to answer for every one of them — several composing proxies (check-run's
// `implementation({ fn: () => true })`) override the shared adapter proxy's own default, and an
// unstaged path there answers true.
const barrelCandidatesOf = ({ cwd }: { cwd: AbsoluteFilePath }): FilePath[] => {
  const segments = String(cwd).split('/');
  return [...segments.keys()]
    .map((index) => segments.slice(0, segments.length - index).join('/'))
    .filter((ancestor) => ancestor !== '')
    .map((ancestor) => filePathContract.parse(`${ancestor}${SOURCE_BARREL_SUFFIX}`));
};

export const sourceConditionSupportedBrokerProxy = (): {
  setupSupported: (params: { cwd: AbsoluteFilePath }) => void;
  setupSupportedInProjectFolder: (params: { cwd: AbsoluteFilePath }) => void;
  setupUnsupported: (params: { cwd: AbsoluteFilePath }) => void;
} => {
  const existsProxy = fsExistsSyncAdapterProxy();

  const stage = ({ cwd, presentAt }: { cwd: AbsoluteFilePath; presentAt: number }): void => {
    const candidates = barrelCandidatesOf({ cwd });
    for (const [index, candidate] of candidates.entries()) {
      existsProxy.returns({ filePath: candidate, result: index === presentAt });
    }
  };

  return {
    // Stages the barrel at the OUTERMOST ancestor only, which is where npm hoists a workspace link
    // to — so a test using this also proves the broker keeps walking past folders that lack one.
    setupSupported: ({ cwd }: { cwd: AbsoluteFilePath }): void => {
      stage({ cwd, presentAt: barrelCandidatesOf({ cwd }).length - 1 });
    },

    setupSupportedInProjectFolder: ({ cwd }: { cwd: AbsoluteFilePath }): void => {
      stage({ cwd, presentAt: 0 });
    },

    setupUnsupported: ({ cwd }: { cwd: AbsoluteFilePath }): void => {
      stage({ cwd, presentAt: -1 });
    },
  };
};
