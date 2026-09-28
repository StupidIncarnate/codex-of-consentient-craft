// PURPOSE: Builds a BrowserSession whose `videoAction` is a jest.fn(), and exposes its call list
// so a test can assert the exact `{action}` stepVideoBroker drove it with, and customize the returned
// VideoResult. Defaults `locationsRepoLinkPathFindBroker`'s own call to "no symlink at cwd" (DEF-80's
// fallback: a `stop` answer's path passes through unchanged) by mocking `access`/`existsSync`/
// `realpath` DIRECTLY, never through `locationsRepoLinkPathFindBrokerProxy`'s own
// `setupLinkAbsent`/`setupLinkResolvesToRoot` convenience methods — this proxy is composed inside
// `run-verb-layer-broker.proxy.ts`'s shared tree alongside sibling verb proxies (hold, snapshot, …)
// that make their OWN real `pathJoinAdapter` calls, and those two convenience methods stage
// `pathJoinAdapter` with a ONE-SHOT, non-discriminating `.returns()` override — see
// `run-execute-broker.proxy.ts`'s own header comment on `CWD_PATH_VALUE` for the identical reasoning
// and the identical fix.
// USAGE: const proxy = stepVideoBrokerProxy(); const { session, getVideoActionCalls } = proxy.session();

import { existsSync } from 'fs';
import { access, realpath } from 'fs/promises';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import { VideoResultStub } from '../../../contracts/video-result/video-result.stub';
import { locationsRepoLinkPathFindBrokerProxy } from '../../locations/repo-link-path-find/locations-repo-link-path-find-broker.proxy';

type BrowserSession = ReturnType<typeof BrowserSessionStub>;
type VideoResult = ReturnType<typeof VideoResultStub>;

// `/default/cwd` is `processCwdAdapterProxy`'s OWN sticky default, installed as a side effect of
// bare-constructing `locationsRepoLinkPathFindBrokerProxy()` below (it composes that adapter's proxy
// internally) — reused here rather than restaged, the same convention
// `run-execute-broker.proxy.ts` follows.
const CWD_PATH_VALUE = '/default/cwd';
const CONFIG_FILE_PATH = FilePathStub({ value: `${CWD_PATH_VALUE}/.dungeonmaster.json` });
const LINK_PATH = FilePathStub({
  value: `${CWD_PATH_VALUE}/.dungeonmaster-assets/siegelense-assets`,
});
// `/home/default` is `osHomedirAdapterProxy`'s OWN sticky default, installed the same transitive
// way as `CWD_PATH_VALUE` above (via `locationsRootPathFindBrokerProxy` → `dungeonmasterHomeFind
// BrokerProxy` → `osHomedirAdapterProxy`, all composed inside the bare `locationsRepoLinkPathFind
// BrokerProxy()` construction) — `stageRepoLinkPresent` only has to clear `DUNGEONMASTER_HOME` to
// let that default govern `dungeonmasterHomeFindBroker`, the same convention
// `run-execute-broker.proxy.ts` follows.
const HOME_DIR_VALUE = '/home/default';
const SIEGELENSE_ROOT_VALUE = `${HOME_DIR_VALUE}/.dungeonmaster/siegelense`;

export const stepVideoBrokerProxy = (): {
  session: (params?: { result?: VideoResult }) => {
    session: BrowserSession;
    getVideoActionCalls: () => readonly unknown[];
  };
  stageRepoLinkPresent: () => void;
} => {
  // Satisfies enforce-proxy-child-creation for locationsRepoLinkPathFindBroker AND installs the
  // `/default/cwd` sticky default + the real `path.join` passthrough this file relies on — see the
  // header comment for why its own `setupLinkAbsent`/`setupLinkResolvesToRoot` are never called.
  locationsRepoLinkPathFindBrokerProxy();
  const accessHandle: MockHandle = registerMock({ fn: access });
  const existsHandle: MockHandle = registerMock({ fn: existsSync });
  const realpathHandle: MockHandle = registerMock({ fn: realpath });
  accessHandle.calledWith([CONFIG_FILE_PATH]).resolves({ success: true as const });
  // No `.dungeonmaster-assets/siegelense-assets` link anywhere, by default — a `stop` answer's path
  // passes through unchanged unless a test calls `stageRepoLinkPresent`.
  existsHandle.calledWith([]).returns(false);

  return {
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
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
      existsHandle.calledWith([LINK_PATH]).returns(true);
      realpathHandle.calledWith([LINK_PATH]).resolves(SIEGELENSE_ROOT_VALUE);
    },
  };
};
