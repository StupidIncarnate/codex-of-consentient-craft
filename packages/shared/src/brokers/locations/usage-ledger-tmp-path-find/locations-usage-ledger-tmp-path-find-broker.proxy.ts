import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { dungeonmasterHomeFindBrokerProxy } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy';
import { locationsStatics } from '../../../statics/locations/locations-statics';

export const locationsUsageLedgerTmpPathFindBrokerProxy = (): {
  setupLedgerTmpPath: (params: {
    homeDir: string;
    homePath: string;
    token: string;
    ledgerTmpPath: string;
  }) => void;
  setupHomeOnly: (params: { homeDir: string; homePath: string }) => void;
} => {
  const dmHomeProxy = dungeonmasterHomeFindBrokerProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports. The sticky real-passthrough default (below) is what lets
  // setupHomeOnly leave the staging-file join REAL — its own token never reaches this proxy,
  // only the broker call, so there is no value here to stage an exact tuple against.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  const joinHandle = registerMock({ fn: join });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));

  return {
    setupLedgerTmpPath: ({
      homeDir,
      homePath,
      token,
      ledgerTmpPath,
    }: {
      homeDir: string;
      homePath: string;
      token: string;
      ledgerTmpPath: string;
    }): void => {
      dmHomeProxy.clearHomeEnv();
      dmHomeProxy.setupHomePath({ homeDir, homePath });
      joinHandle
        .calledWith([homePath, `${locationsStatics.dungeonmasterHome.usageLedgerTmp}.${token}`])
        .returns(ledgerTmpPath);
    },

    // Stages the home and leaves the staging-file join REAL (the sticky passthrough default
    // above), so the path that comes back was composed from the token the caller passed rather
    // than replayed from a staged value. Reach for this over setupLedgerTmpPath whenever the
    // assertion is about the NAME — a staged result comes back whether or not the token ever
    // reached the filename.
    setupHomeOnly: ({ homeDir, homePath }: { homeDir: string; homePath: string }): void => {
      dmHomeProxy.clearHomeEnv();
      dmHomeProxy.setupHomePath({ homeDir, homePath });
    },
  };
};
