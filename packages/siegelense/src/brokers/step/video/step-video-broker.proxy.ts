// PURPOSE: Builds a BrowserSession whose `videoAction` is a jest.fn(), and exposes its call list
// so a test can assert the exact `{action}` stepVideoBroker drove it with, and customize the returned
// VideoResult. Defaults `locationsRepoLinkPathFindBroker`'s own call to "no symlink at the repo root" (DEF-80's
// fallback: a `stop` answer's path passes through unchanged) through
// `locationsRepoLinkPathFindBrokerProxy`'s `setupLinkAbsent`, whose join stage is keyed on the exact
// link segments, so sibling verb proxies' own `join` calls are unaffected.
// USAGE: const proxy = stepVideoBrokerProxy(); const { session, getVideoActionCalls } = proxy.session();

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import { VideoResultStub } from '../../../contracts/video-result/video-result.stub';
import { locationsRepoLinkPathFindBrokerProxy } from '../../locations/repo-link-path-find/locations-repo-link-path-find-broker.proxy';

type BrowserSession = ReturnType<typeof BrowserSessionStub>;
type VideoResult = ReturnType<typeof VideoResultStub>;

// The repo root every test hands the broker; the link path below is staged against it.
const REPO_ROOT_VALUE = '/default/repo-root';
const LINK_PATH = `${REPO_ROOT_VALUE}/.dungeonmaster-assets/siegelense-assets`;
// `stageRepoLinkPresent` resolves the link to SIEGELENSE_ROOT_VALUE under HOME_PATH.
const HOME_DIR_VALUE = '/home/default';
const HOME_PATH = `${HOME_DIR_VALUE}/.dungeonmaster`;
const SIEGELENSE_ROOT_VALUE = `${HOME_DIR_VALUE}/.dungeonmaster/siegelense`;

export const stepVideoBrokerProxy = (): {
  repoRoot: string;
  session: (params?: { result?: VideoResult }) => {
    session: BrowserSession;
    getVideoActionCalls: () => readonly unknown[];
  };
  stageRepoLinkPresent: () => void;
} => {
  const repoLinkProxy = locationsRepoLinkPathFindBrokerProxy();
  // No `.dungeonmaster-assets/siegelense-assets` link anywhere, by default — a `stop` answer's path
  // passes through unchanged unless a test calls `stageRepoLinkPresent`.
  repoLinkProxy.setupLinkAbsent({ repoRoot: REPO_ROOT_VALUE, linkPath: LINK_PATH });

  return {
    repoRoot: REPO_ROOT_VALUE,
    session: (params?: {
      result?: VideoResult;
    }): {
      session: BrowserSession;
      getVideoActionCalls: () => readonly unknown[];
    } => {
      const videoAction = jest
        .fn()
        .mockResolvedValue(params?.result ?? VideoResultStub({ status: 'started', path: null }));

      return {
        session: BrowserSessionStub({ videoAction }),
        getVideoActionCalls: (): readonly unknown[] => videoAction.mock.calls,
      };
    },

    stageRepoLinkPresent: (): void => {
      repoLinkProxy.setupLinkResolvesToRoot({
        repoRoot: REPO_ROOT_VALUE,
        linkPath: LINK_PATH,
        homeDir: HOME_DIR_VALUE,
        homePath: HOME_PATH,
        rootPath: SIEGELENSE_ROOT_VALUE,
      });
    },
  };
};
