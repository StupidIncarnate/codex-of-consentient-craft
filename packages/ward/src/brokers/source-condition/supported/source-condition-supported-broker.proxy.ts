import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import {
  filePathContract,
  type AbsoluteFilePath,
  type FilePath,
} from '@dungeonmaster/shared/contracts';

const SOURCE_BARREL_SUFFIX = '/node_modules/@dungeonmaster/shared/statics.ts';

// The broker asks about EVERY ancestor of cwd, so a composing proxy that wants "not reachable" has
// to answer for every one of them — this proxy's own existsSyncProxy() sets no catch-all, but
// several composing proxies (check-run's `implementation({ fn: () => true })`) register one of
// their own on the SAME underlying fs.existsSync mock, so an unstaged path there answers true.
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
  const existsProxy = existsSyncProxy();

  const stage = ({ cwd, presentAt }: { cwd: AbsoluteFilePath; presentAt: number }): void => {
    const candidates = barrelCandidatesOf({ cwd });
    for (const [index, candidate] of candidates.entries()) {
      existsProxy.returns({ path: candidate, exists: index === presentAt });
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
